declare var process: any;
import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // 1. Create the Auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) {
            console.error('Auth creation error:', authError);
            return res.status(400).json({ error: authError.message });
        }

        const userId = authData.user.id;

        // 2. Upsert the profile
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email,
                full_name: fullName,
                role: role,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            });

        if (profileError) {
            console.error('Profile upsert error:', profileError);
            // We don't delete the auth user here as it might be useful for debugging, 
            // but we inform the client that profile creation failed.
            return res.status(400).json({
                error: `User created but profile update failed: ${profileError.message}`,
                userId
            });
        }

        return res.status(200).json({
            success: true,
            user: { id: userId, email }
        });

    } catch (error: any) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: error.message || 'An unexpected error occurred' });
    }
}
