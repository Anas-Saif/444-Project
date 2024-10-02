const BASE_URL = 'http://localhost:8000'; 


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
            window.location.href = 'success.html'; 
        } else {
            
            document.getElementById('loginError').textContent = 'Login failed. ' + (data.detail || 'Invalid credentials');
        }
    } catch (error) {
        document.getElementById('loginError').textContent = 'Error logging in: ' + error.message;
    }
});


document.getElementById('register')?.addEventListener('submit', async function (event) {
    event.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    
    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';

    
    if (password.length < 6) {
        document.getElementById('passwordError').textContent = 'Password must be at least 6 characters long';
        return;
    }

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
            alert('Registration successful! Redirecting to login page...');
            window.location.href = 'login.html'; 
        } else {
            if (data.detail && data.detail.includes("unable to create user")) {
                document.getElementById('emailError').textContent = 'The email is already registered.';
            } else {
                document.getElementById('emailError').textContent = data.detail || 'Unable to create user';
            }
        }
    } catch (error) {
        document.getElementById('emailError').textContent = 'Error registering: ' + error.message;
    }
});
