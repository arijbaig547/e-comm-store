// ----------------- Supabase Setup -----------------
// ----------------- Supabase Setup -----------------


// ----------------- Form & Tab Elements -----------------
const loginForm = document.querySelector("#login");
const signupForm = document.querySelector("#signup");

// Login fields
const emailInput = loginForm.querySelector("input[type='email']");
const passwordInput = loginForm.querySelector("input[type='password']");
const loginBtn = loginForm.querySelector(".loginbtn");

// Admin credentials
const adminEmail = "admin@gmail.com";
const adminPassword = "123456789";



// ----------------- Login Logic -----------------
loginBtn.addEventListener("click", async function(e) {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    // Admin login
    if(email === adminEmail && password === adminPassword) {
        alert("Admin login successful!");
        location.href = "dashboard.html";
        return;
    }
    else{
        alert("Invalid Credentials")
    }
})

    // User login via Supabase
//     const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

//     if(error) {
//         alert("Invalid Credentials for user!");
//     } else {
//         alert("User login successful!");
//         location.href = "user-dashboard.html";
//     }
// });

// ----------------- Signup Logic -----------------
// signupForm.addEventListener("submit", async function(e) {
//     e.preventDefault();

//     const name = signupForm.querySelector("input[type='text']").value;
//     const email = signupForm.querySelector("input[type='email']").value;
//     const password = signupForm.querySelectorAll("input[type='password']")[0].value;
//     const confirmPassword = signupForm.querySelectorAll("input[type='password']")[1].value;

//     if(password !== confirmPassword) {
//         alert("Passwords do not match!");
//         return;
//     }

//     // User signup via Supabase
//     const { data, error } = await supabaseClient.auth.signUp({ email, password });

//     if(error) {
//         alert("Error: " + error.message);
//     } else {
//         alert("Signup successful! Please login.");
//         switchTab('login');
//     }
// });
