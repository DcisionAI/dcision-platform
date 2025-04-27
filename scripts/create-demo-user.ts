import { createClient } from '@supabase/supabase-js';

const DEMO_EMAIL = 'demo@dcisionai.com';
const DEMO_PASSWORD = 'demo123!@#Demo'; // Complex password for security

async function createDemoUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials in environment variables');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Check if demo user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', DEMO_EMAIL)
      .single();

    if (existingUser) {
      console.log('Demo user already exists');
      return;
    }

    // Create demo user
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        is_demo: true,
        name: 'Demo User'
      }
    });

    if (error) {
      throw error;
    }

    // Profile and settings will be created automatically via triggers
    console.log('Demo user created successfully:', data.user.id);

    // Set up demo data (you can add more demo data setup here)
    const { error: settingsError } = await supabase
      .from('user_settings')
      .update({
        theme: 'light',
        notifications_enabled: true
      })
      .eq('user_id', data.user.id);

    if (settingsError) {
      console.error('Error setting up demo user settings:', settingsError);
    }

  } catch (error) {
    console.error('Error creating demo user:', error);
    process.exit(1);
  }
}

createDemoUser(); 