import { createClient } from '@supabase/supabase-js';

async function checkAuthUser() {
  console.log('Starting authentication check/setup process...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oooujqtlkbwvhnjtzust.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vb3VqcXRsa2J3dmhuanR6dXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNTA1NTgsImV4cCI6MjA1OTcyNjU1OH0.q4niIZDU0DzOVi_nztu6xoXkhU_TfwfHZ0STxhtTs9A';
  
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Verify database connection first
    console.log('Verifying database connection...');
    const { data: userCount, error: countError } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact' });
      
    if (countError) {
      console.error('Database connection error:', countError.message);
      throw countError;
    }
    
    console.log('Database connection successful. Found users:', userCount?.[0]?.count || 0);
    
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
            role: 'admin' // Use lowercase for consistency with database
          }
        }
      });
      
      if (signupError) {
        console.error('Failed to create admin auth user:', signupError.message);
      } else {
        console.log('Successfully created admin auth user. User data:', signupData?.user);
        
        // Check if we need to create the admin user in the users table
        const { data: adminExists, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('username', 'admin')
          .single();
          
        if (checkError || !adminExists) {
          console.log('Admin user does not exist in users table. Creating...');
          
          // Create admin user in users table
          const { data: newAdmin, error: createError } = await supabase
            .from('users')
            .insert([
              {
                username: 'admin',
                password_hash: '$2a$10$XGFDXaP3uZ7kd0Kg2J5j4u8gkC/mz6et8tCZ4fPrQUO4H0JbNu8pu', // hashed version of 'admin123'
                role: 'admin'
              }
            ])
            .select()
            .single();
            
          if (createError) {
            console.error('Failed to create admin in users table:', createError.message);
          } else {
            console.log('Successfully created admin user in database:', newAdmin);
          }
        } else {
          console.log('Admin user already exists in users table.');
        }
      }
    } else {
      console.log('Auth user exists and credentials work');
      console.log('User data:', data.user);
    }
  } catch (err) {
    console.error('Error during authentication setup:', err);
  }
}

// Run the check
checkAuthUser().then(() => {
  console.log('Authentication check/setup complete.');
}).catch(err => {
  console.error('Fatal error during authentication check/setup:', err);
}); 