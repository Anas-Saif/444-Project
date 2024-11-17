// Define your backend API URL
API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8000';
// Check if the user is logged in (only on login.html)
if (window.location.pathname.includes('login.html')) {
    if (localStorage.getItem('token')) {
        // User is already logged in, redirect to main.html
        window.location.href = 'main.html';
    }
}

// Handle Login Form Submission
document.getElementById('login')?.addEventListener('submit', async function (event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
        const response = await fetch(`${API_ENDPOINT}/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // Store the access token in localStorage
            localStorage.setItem('token', data.access_token);

            // Redirect to main.html after successful login
            window.location.href = 'main.html';
        } else {
            // Display error message
            document.getElementById('loginError').textContent = 'Login failed. ' + (data.detail || 'Invalid credentials');
        }
    } catch (error) {
        // Display error message if request fails
        document.getElementById('loginError').textContent = 'Error logging in: ' + error.message;
    }
});

// Ensure the user is authenticated before accessing the main page
if (window.location.pathname.includes('main.html')) {
    const token = localStorage.getItem('token');
    if (!token) {
        // No token, redirect to login.html
        window.location.href = 'login.html';
    } else {
        // Fetch user info and tasks
        fetchUser();
        fetchTasks();
        fetchLabels();
    }
}
// Logout function to remove token and redirect to login
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');  // Clear the token from localStorage
    window.location.href = 'login.html';  // Redirect to login page
});

// Handle Register Form Submission
document.getElementById('register')?.addEventListener('submit', async function (event) {
    event.preventDefault();

    // Get user input
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Clear error messages
    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';

    // Simple validation for password length (custom logic)
    if (password.length < 6) {
        document.getElementById('passwordError').textContent = 'Password must be at least 6 characters long';
        return;
    }

    // User data to send
    const userData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: password
    };

    try {
        const response = await fetch(`${API_ENDPOINT}/user/singup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registration successful! Redirecting to login page...');
            window.location.href = 'login.html';  // Redirect to login page
        } else {
            // Check if email already exists or other validation error
            if (data.detail && data.detail.includes("unable to create user")) {
                document.getElementById('emailError').textContent = 'The email is already registered.';
            } else {
                document.getElementById('emailError').textContent = data.detail || 'Unable to create user';
            }
        }
    } catch (error) {
        // Handle any errors that occur during the fetch
        document.getElementById('emailError').textContent = 'Error registering: ' + error.message;
    }
});
