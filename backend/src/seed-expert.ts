import { supabaseAdmin } from './config/supabase';

/**
 * Seed script to create a permanent expert account.
 * Run with: npx ts-node src/seed-expert.ts
 */
async function seedExpert() {
    const EXPERT_EMAIL = 'expert@gmail.com';
    const EXPERT_PASSWORD = 'expert#123';
    const EXPERT_NAME = 'Expert Moderator';

    console.log('🔧 Creating expert account...');

    // Check if expert already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === EXPERT_EMAIL);

    if (existing) {
        console.log('⚠️  Expert auth user already exists, updating role...');


        // Update profiles table
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ role: 'expert' })
            .eq('id', existing.id);

        if (profileError) {
            console.log('profiles table update skipped:', profileError.message);
        }

        // Update users table
        const { error: usersError } = await supabaseAdmin
            .from('users')
            .update({ role: 'expert' })
            .eq('id', existing.id);

        if (usersError) {
            console.log('users table update skipped:', usersError.message);
        }

        console.log('✅ Expert role applied. Login with:');
        console.log(`   Email: ${EXPERT_EMAIL}`);
        console.log(`   Password: ${EXPERT_PASSWORD}`);
        process.exit(0);
        return;
    }

    // Create new auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: EXPERT_EMAIL,
        password: EXPERT_PASSWORD,
        email_confirm: true  // Auto-confirm so they can log in immediately
    });

    if (authError) {
        console.error('❌ Failed to create auth user:', authError.message);
        process.exit(1);
        return;
    }

    const userId = authData.user.id;
    console.log(`✅ Auth user created: ${userId}`);

    // Wait for trigger to create profile row
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update profiles table with expert role
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
            role: 'expert',
            email: EXPERT_EMAIL
        })
        .eq('id', userId);

    if (profileError) {
        console.log('profiles table update note:', profileError.message);
    } else {
        console.log('✅ profiles table updated to expert');
    }

    // Update users table with expert role and full profile data
    const { error: usersError } = await supabaseAdmin
        .from('users')
        .update({
            name: EXPERT_NAME,
            role: 'expert',
            gender: 'prefer-not-to-say',
            sports_categories: ['coco', 'martial-arts'],
            bio: 'Expert moderator - reviewing and maintaining content quality.',
            is_verified: true,
            verification_status: 'approved',
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (usersError) {
        // Try insert if the trigger didn't create a user row
        const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
                id: userId,
                email: EXPERT_EMAIL,
                name: EXPERT_NAME,
                role: 'expert',
                gender: 'prefer-not-to-say',
                sports_categories: ['coco', 'martial-arts'],
                bio: 'Expert moderator - reviewing and maintaining content quality.',
                is_verified: true,
                verification_status: 'approved'
            });

        if (insertError) {
            console.error('❌ users table error:', insertError.message);
        } else {
            console.log('✅ users table row inserted with expert role');
        }
    } else {
        console.log('✅ users table updated to expert');
    }

    console.log('\n🎉 Expert account created successfully!');
    console.log(`   Email: ${EXPERT_EMAIL}`);
    console.log(`   Password: ${EXPERT_PASSWORD}`);
    console.log(`   Role: expert`);
    process.exit(0);
}

seedExpert().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
