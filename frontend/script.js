// Define your backend API URL
const BASE_URL = 'http://localhost:8000'; // Replace with your actual backend API URL

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
        const response = await fetch(`${BASE_URL}/user/login`, {
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

// Fetch User Info on main.html
async function fetchUser() {
    const response = await fetch(`${BASE_URL}/user/me`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    const user = await response.json();
    document.getElementById('userName').textContent = `Welcome, ${user.first_name} ${user.last_name}`;
}

// Fetch Tasks
async function fetchTasks() {
    const response = await fetch(`${BASE_URL}/tasks/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    const tasks = await response.json();
    displayTasks(tasks);
}

// Fetch Labels
async function fetchLabels() {
    const response = await fetch(`${BASE_URL}/labels/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    const labels = await response.json();
    // Populate label dropdown or other necessary areas with label data
}

// Display Tasks (with or without labels)
function displayTasks(tasks) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = ''; // Clear current tasks
    tasks.forEach((task) => {
        const taskCard = document.createElement('div');
        taskCard.classList.add('task-card'); // You can style this class in your CSS

        // Set background color based on label color or default to grey
        const taskLabelColor = task.labels.length ? task.labels[0].color : '#f5f5f5';
        taskCard.style.backgroundColor = taskLabelColor;

        taskCard.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description || 'No description'}</p>
            <p>Due in: ${getDaysRemaining(task.due_date)} days</p>
        `;

        taskCard.addEventListener('click', () => showTaskInfo(task)); // Show task info modal

        taskList.appendChild(taskCard);
    });
}

// Calculate remaining days until due date
function getDaysRemaining(dueDate) {
    const dueDateObj = new Date(dueDate);
    const today = new Date();
    const differenceInTime = dueDateObj - today;
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    return differenceInDays;
}

// Show task info modal
function showTaskInfo(task) {
    document.getElementById('taskInfoTitle').textContent = `Task: ${task.title}`;
    document.getElementById('taskInfoDue').textContent = `Due: ${task.due_date}`;
    document.getElementById('taskInfoPriority').textContent = `Priority: ${task.priority || 'Not set'}`;
    document.getElementById('infoModal').style.display = 'flex';

    document.getElementById('deleteTaskBtn').onclick = () => deleteTask(task.task_id);
    document.getElementById('updateTaskBtn').onclick = () => updateTask(task);
}

// Delete task
async function deleteTask(taskId) {
    if (confirm("Are you sure you want to delete this task?")) {
        await fetch(`${BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        alert('Task successfully deleted!');
        document.getElementById('infoModal').style.display = 'none'; // Close modal
        fetchTasks(); // Refresh tasks
    }
}

// Update task - opens the task modal pre-filled with task info
function updateTask(task) {
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description;
    document.getElementById('taskDueDate').value = task.due_date;
    document.getElementById('taskPriority').value = task.priority || 'Low';
    document.getElementById('taskModal').style.display = 'flex'; // Open modal for update

    // Save the update
    document.getElementById('saveTaskBtn').onclick = async function () {
        const updatedTaskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            due_date: document.getElementById('taskDueDate').value,
            priority: document.getElementById('taskPriority').value
        };

        await fetch(`${BASE_URL}/tasks/${task.task_id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedTaskData)
        });

        document.getElementById('taskModal').style.display = 'none'; // Hide modal
        fetchTasks(); // Refresh task list
    };
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
