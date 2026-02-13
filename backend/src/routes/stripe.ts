import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { supabaseAdmin } from '../config/supabase';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';
import { validate } from '../middleware/validation';

const router = express.Router();

// ---------------------------------------------------------------------------
// Stripe client  (initialized lazily so server can start even without keys)
// ---------------------------------------------------------------------------
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
    if (!stripeClient) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is not configured');
        }
        stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-12-18.acacia' as any,
            typescript: true,
        });
    }
    return stripeClient;
}

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------
const createCheckoutSchema = Joi.object({
    packageId: Joi.string().max(30).required(),
});

// ---------------------------------------------------------------------------
// POST /api/stripe/create-checkout-session
// Creates a Stripe Checkout Session for a token package purchase.
// Returns { url } — the client must redirect to this URL.
// ---------------------------------------------------------------------------
router.post(
    '/create-checkout-session',
    authenticateToken,
    validate(createCheckoutSchema),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userId = req.user!.id;
        const { packageId } = req.body;

        // Look up the package from the DB
        const { data: pkg, error: pkgError } = await supabaseAdmin
            .from('token_packages')
            .select('*')
            .eq('id', packageId)
            .eq('is_active', true)
            .single();

        if (pkgError || !pkg) {
            res.status(400).json({ success: false, error: 'Invalid or inactive package' });
            return;
        }

        const totalTokens = pkg.tokens + pkg.bonus_tokens;
        const stripe = getStripe();

        // Build line items — prefer a pre-configured Stripe Price if available
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = pkg.stripe_price_id
            ? [{ price: pkg.stripe_price_id, quantity: 1 }]
            : [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${pkg.tokens} Tokens${pkg.bonus_tokens > 0 ? ` + ${pkg.bonus_tokens} Bonus` : ''}`,
                            description: `SportsFeed Token Package — ${totalTokens} tokens total`,
                        },
                        unit_amount: pkg.price_cents, // already in cents
                    },
                    quantity: 1,
                },
            ];

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: lineItems,
            metadata: {
                user_id: userId,
                package_id: packageId,
                tokens_to_credit: String(totalTokens),
            },
            success_url:
                process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173/tokens/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:5173/tokens/cancel',
        });

        res.json({ success: true, url: session.url });
    }),
);

// ---------------------------------------------------------------------------
// POST /api/stripe/webhook
// Handles Stripe webhook events.
// IMPORTANT: this endpoint must receive the RAW body (not JSON-parsed).
// The raw-body middleware is mounted in server.ts BEFORE express.json().
// ---------------------------------------------------------------------------
router.post(
    '/webhook',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const stripe = getStripe();
        const sig = req.headers['stripe-signature'] as string;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
            res.status(500).json({ error: 'Webhook secret not configured' });
            return;
        }

        let event: Stripe.Event;
        try {
            // req.body is a raw Buffer because of the express.raw() middleware
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } catch (err: any) {
            console.error('[Stripe Webhook] Signature verification failed:', err.message);
            res.status(400).json({ error: `Webhook Error: ${err.message}` });
            return;
        }

        // ----- Idempotency check -----
        const { data: existing } = await supabaseAdmin
            .from('stripe_webhook_events')
            .select('event_id')
            .eq('event_id', event.id)
            .maybeSingle();

        if (existing) {
            // Already processed
            res.json({ received: true, duplicate: true });
            return;
        }

        // Record the event
        await supabaseAdmin.from('stripe_webhook_events').insert({
            event_id: event.id,
            event_type: event.type,
            processed_at: new Date().toISOString(),
            payload: event as any,
        });

        // ----- Handle events -----
        switch (event.type) {
            case 'checkout.session.completed': {
                await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                break;
            }
            case 'charge.refunded': {
                await handleChargeRefunded(event.data.object as Stripe.Charge);
                break;
            }
            default:
                console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    }),
);

// ---------------------------------------------------------------------------
// checkout.session.completed handler
// ---------------------------------------------------------------------------
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.user_id;
    const packageId = session.metadata?.package_id;
    const tokensToCredit = parseInt(session.metadata?.tokens_to_credit || '0', 10);

    if (!userId || !tokensToCredit) {
        console.error('[Stripe Webhook] Missing metadata in checkout session', session.id);
        return;
    }

    const paymentIntentId =
        typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id || null;

    console.log(
        `[Stripe Webhook] Crediting ${tokensToCredit} tokens to user ${userId} ` +
        `(session: ${session.id}, PI: ${paymentIntentId}, package: ${packageId})`,
    );

    const { data: success, error } = await supabaseAdmin.rpc('purchase_tokens_from_stripe', {
        p_user_id: userId,
        p_amount: tokensToCredit,
        p_stripe_pi: paymentIntentId,
        p_stripe_cs: session.id,
        p_package_id: packageId || null,
    });

    if (error) {
        console.error('[Stripe Webhook] RPC purchase_tokens_from_stripe failed:', error);
        return;
    }

    console.log(`[Stripe Webhook] Token credit result: ${success}`);

    // Send notification
    try {
        await supabaseAdmin.from('notifications').insert({
            user_id: userId,
            type: 'system',
            title: 'Tokens Purchased!',
            message: `You purchased ${tokensToCredit} tokens successfully.`,
            data: {
                amount: tokensToCredit,
                package_id: packageId,
                session_id: session.id,
            },
            created_at: new Date().toISOString(),
        });
    } catch (notifErr) {
        console.warn('[Stripe Webhook] Non-fatal: notification insert failed', notifErr);
    }
}

// ---------------------------------------------------------------------------
// charge.refunded handler
// ---------------------------------------------------------------------------
async function handleChargeRefunded(charge: Stripe.Charge) {
    const paymentIntentId =
        typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id || null;

    if (!paymentIntentId) {
        console.error('[Stripe Webhook] charge.refunded missing payment_intent');
        return;
    }

    // Find the original transaction by stripe_payment_intent_id
    const { data: originalTxn } = await supabaseAdmin
        .from('token_transactions')
        .select('to_user_id, amount')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .eq('type', 'purchased')
        .maybeSingle();

    if (!originalTxn) {
        console.error(
            `[Stripe Webhook] No purchase transaction found for PI ${paymentIntentId}`,
        );
        return;
    }

    // Calculate refund amount (in tokens) — proportional to the charge refund
    const refundAmountCents = charge.amount_refunded;
    const totalChargeCents = charge.amount;
    const tokenRefundAmount = Math.round(
        (refundAmountCents / totalChargeCents) * originalTxn.amount,
    );

    console.log(
        `[Stripe Webhook] Refunding ${tokenRefundAmount} tokens from user ${originalTxn.to_user_id}`,
    );

    const { data: result, error } = await supabaseAdmin.rpc('refund_stripe_tokens', {
        p_user_id: originalTxn.to_user_id,
        p_amount: tokenRefundAmount,
        p_stripe_pi: paymentIntentId,
    });

    if (error) {
        console.error('[Stripe Webhook] RPC refund_stripe_tokens failed:', error);
        return;
    }

    console.log('[Stripe Webhook] Refund result:', result);
}

// ---------------------------------------------------------------------------
// GET /api/stripe/packages
// Returns available token packages. Public (but rate-limited).
// ---------------------------------------------------------------------------
router.get(
    '/packages',
    asyncHandler(async (_req: Request, res: Response): Promise<void> => {
        const { data: packages, error } = await supabaseAdmin
            .from('token_packages')
            .select('id, tokens, bonus_tokens, price_cents, display_order')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch packages' });
            return;
        }

        res.json({
            success: true,
            packages: (packages || []).map((p) => ({
                id: p.id,
                tokens: p.tokens,
                bonusTokens: p.bonus_tokens,
                totalTokens: p.tokens + p.bonus_tokens,
                price: p.price_cents / 100, // convert cents to dollars for display
                priceCents: p.price_cents,
            })),
        });
    }),
);
// ---------------------------------------------------------------------------
// GET /api/stripe/verify-session?session_id=...
// Called by the success page to verify payment and credit tokens.
// This is a FALLBACK for when webhooks aren't running (local dev).
// The RPC is idempotent so double-crediting is impossible.
// ---------------------------------------------------------------------------
router.get(
    '/verify-session',
    authenticateToken,
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const sessionId = req.query.session_id as string;
        const userId = req.user!.id;

        if (!sessionId) {
            res.status(400).json({ success: false, error: 'session_id is required' });
            return;
        }

        const stripe = getStripe();

        let session: Stripe.Checkout.Session;
        try {
            session = await stripe.checkout.sessions.retrieve(sessionId);
        } catch (err: any) {
            res.status(400).json({ success: false, error: 'Invalid session ID' });
            return;
        }

        // Security: ensure the session belongs to this user
        if (session.metadata?.user_id !== userId) {
            res.status(403).json({ success: false, error: 'Session does not belong to this user' });
            return;
        }

        if (session.payment_status !== 'paid') {
            res.status(400).json({ success: false, error: 'Payment not completed', status: session.payment_status });
            return;
        }

        const tokensToCredit = parseInt(session.metadata?.tokens_to_credit || '0', 10);
        const packageId = session.metadata?.package_id || null;
        const paymentIntentId =
            typeof session.payment_intent === 'string'
                ? session.payment_intent
                : (session.payment_intent as any)?.id || null;

        if (!tokensToCredit) {
            res.status(400).json({ success: false, error: 'Invalid session metadata' });
            return;
        }

        // Credit tokens (idempotent — RPC checks if already credited for this session)
        const { data: success, error } = await supabaseAdmin.rpc('purchase_tokens_from_stripe', {
            p_user_id: userId,
            p_amount: tokensToCredit,
            p_stripe_pi: paymentIntentId,
            p_stripe_cs: sessionId,
            p_package_id: packageId,
        });

        if (error) {
            console.error('[Stripe Verify] RPC failed:', error);
            res.status(500).json({ success: false, error: 'Failed to credit tokens' });
            return;
        }

        // Get updated balance
        const { data: wallet } = await supabaseAdmin
            .from('user_tokens')
            .select('balance')
            .eq('user_id', userId)
            .single();

        res.json({
            success: true,
            tokensCredited: tokensToCredit,
            packageId,
            newBalance: wallet?.balance ?? 0,
        });
    }),
);

export default router;
