import { createClient } from '@supabase/supabase-js';

async function checkAuthUser() {
  const supabase = createClient(
    'https://oooujqtlkbwvhnjtzust.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vb3VqcXRsa2J3dmhuanR6dXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNTA1NTgsImV4cCI6MjA1OTcyNjU1OH0.q4niIZDU0DzOVi_nztu6xoXkhU_TfwfHZ0STxhtTs9A'
  );

  try {
    // Try to sign in with admin credentials
    console.log('Trying to sign in with admin credentials...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@fitouttrack.example',
      password: 'admin123'
    });

    if (error) {
      console.log('Auth error:', error.message);
      console.log('Creating auth user...');
      
      // Try to create the auth user
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: 'admin@fitouttrack.example',
        password: 'admin123',
        options: {
          data: {
            username: 'admin',
            role: 'Admin'
          }
        }
      });
      
      console.log('Signup result:', signupData ? 'Success' : 'Failed', signupError ? signupError.message : '');
    } else {
      console.log('Auth user exists and credentials work');
      console.log('User data:', data.user);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkAuthUser(); 