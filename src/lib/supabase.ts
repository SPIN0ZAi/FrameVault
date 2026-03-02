import { createClient } from '@supabase/supabase-js';

// Ensure this file is never bundled in the browser as it exposes the Service Role Key
// The Service Role Key allows bypassing Row Level Security (RLS) to sign URLs securely.

export const getSupabaseServerClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
    }

    return createClient(supabaseUrl, supabaseKey);
};
