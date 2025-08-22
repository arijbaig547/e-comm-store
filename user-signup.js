function switchTab(tab) {
  // sab se active hatao
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('form').forEach(f => f.classList.remove('active'));

  // target form active karo
  const targetForm = document.querySelector(`#${tab}`);
  if (targetForm) targetForm.classList.add('active');

  // target tab button active karo
  if (tab === "login") {
    document.getElementById("login-tab").classList.add("active");
  } else if (tab === "signup") {
    document.getElementById("signup-tab").classList.add("active");
  }
}



import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://olpnhxizrjsrdmcdpauj.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scG5oeGl6cmpzcmRtY2RwYXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzgzMzIsImV4cCI6MjA3MDY1NDMzMn0._Vz4UC4O4qeXPKr1MhJv0OaqhztQrPrJNdPIJetwzqQ"
const supabase = createClient(supabaseUrl, supabaseKey)






// Signup form
const signupForm = document.querySelector('#signup');
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = signupForm.querySelector('input[type="text"]').value;
    const email = signupForm.querySelector('input[type="email"]').value;
    const password = signupForm.querySelector('input[type="password"]').value;

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName },
            emailRedirectTo: 'http://127.0.0.1:5502/user-signup.html'
        }
    });


    if (error) {
        alert('Error: ' + error.message);
    } else {
        alert(`Signup successful! Check your email (${email}) to confirm your account.`);
        // Switch to login tab after signup
        switchTab('login');
    }
});

// Login form
// Login form
const loginForm = document.querySelector('#login');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = loginForm.querySelector('input[type="email"]').value;
  const password = loginForm.querySelector('input[type="password"]').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert('Error: ' + error.message);
  } else {
    // User ka naam nikalna (metadata me save hai)
    const user = data.user;
    const fullName = user.user_metadata.full_name || user.email;

    // Navbar me set karna
    // document.getElementById("userNameBtn").innerText = fullName;

    alert('Login successful! Welcome ' + fullName);
    location.href = "index.html";
  }
});

document.querySelector('#login-tab').addEventListener('click', () => switchTab('login'));
document.querySelector('#signup-tab').addEventListener('click', () => switchTab('signup'));
