import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// All expert routes require authentication + expert role
router.use(authMiddleware);

function requireExpert(req: Request, res: Response, next: Function) {
    const user = (req as AuthenticatedRequest).user;
    if (!user || user.role !== 'expert') {
        res.status(403).json({ success: false, error: 'Expert role required' });
        return;
    }
    next();
}

// GET /api/expert/pending-coaches — List all pending coach registrations
router.get('/pending-coaches', requireExpert, async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, email, username, bio, profile_image, sports_category, created_at, role, approval_status')
            .or('role.eq.pending_coach,and(role.eq.coach,approval_status.eq.pending)')
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Error fetching pending coaches:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch pending coaches' });
            return;
        }

        res.json({ success: true, coaches: data || [] });
    } catch (err) {
        logger.error('Error in pending-coaches:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/expert/approve-coach — Approve a pending coach
router.post('/approve-coach', requireExpert, async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({ success: false, error: 'userId is required' });
            return;
        }

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({
                role: 'coach',
                approval_status: 'approved',
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
            .eq('role', 'pending_coach');

        if (error) {
            logger.error('Error approving coach:', error);
            res.status(500).json({ success: false, error: 'Failed to approve coach' });
            return;
        }

        logger.info(`Coach approved: ${userId} by expert ${(req as AuthenticatedRequest).user.id}`);
        res.json({ success: true, message: 'Coach approved successfully' });
    } catch (err) {
        logger.error('Error in approve-coach:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/expert/reject-coach — Reject a pending coach
router.post('/reject-coach', requireExpert, async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({ success: false, error: 'userId is required' });
            return;
        }

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({
                approval_status: 'rejected',
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
            .eq('role', 'pending_coach');

        if (error) {
            logger.error('Error rejecting coach:', error);
            res.status(500).json({ success: false, error: 'Failed to reject coach' });
            return;
        }

        logger.info(`Coach rejected: ${userId} by expert ${(req as AuthenticatedRequest).user.id}`);
        res.json({ success: true, message: 'Coach request rejected' });
    } catch (err) {
        logger.error('Error in reject-coach:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
