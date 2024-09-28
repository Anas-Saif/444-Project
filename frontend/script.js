const BASE_URL = 'http://localhost:8000'; // Adjust this if necessary

// Handle Login
document.getElementById('login')?.addEventListener('submit', async function (event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
        const response = await fetch(`${BASE_URL}/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('message').textContent = 'Login successful!';
            console.log('Token:', data.access_token);
        } else {
            document.getElementById('message').textContent = 'Login failed. ' + (data.detail || 'Invalid credentials');
        }
    } catch (error) {
        document.getElementById('message').textContent = 'Error logging in: ' + error.message;
    }
});

// Handle Register
document.getElementById('register')?.addEventListener('submit', async function (event) {
    event.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const userData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: password
    };

    try {
        const response = await fetch(`${BASE_URL}/user/singup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('message').textContent = 'Registration successful!';
        } else {
            document.getElementById('message').textContent = 'Registration failed. ' + (data.detail || 'Invalid input');
        }
    } catch (error) {
        document.getElementById('message').textContent = 'Error registering: ' + error.message;
    }
});
