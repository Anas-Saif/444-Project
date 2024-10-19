const BASE_URL = 'http://localhost:8000'; 
let token = localStorage.getItem('token'); // Assuming token is stored in localStorage after login

// --------------------- LOGIN & REGISTRATION ---------------------

// Login functionality
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
            // Store token
            localStorage.setItem('token', data.access_token);

            // Redirection to main.html page
            window.location.href = 'main.html';  // <<< Make sure this is 'main.html'
        } else {
            document.getElementById('loginError').textContent = 'Login failed. ' + (data.detail || 'Invalid credentials');
        }
    } catch (error) {
        document.getElementById('loginError').textContent = 'Error logging in: ' + error.message;
    }
});


// --------------------- TASKS & LABELS MANAGEMENT ---------------------

// Show Task Modal
document.getElementById('createTaskBtn')?.addEventListener('click', () => {
    document.getElementById('taskModal').style.display = 'flex';
});

// Show Label Modal
document.getElementById('createLabelBtn')?.addEventListener('click', () => {
    document.getElementById('labelModal').style.display = 'flex';
});

// Close Modal (when clicking outside)
window.addEventListener('click', function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Fetch and display user info
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

// Fetch and display labels in the task modal
async function fetchLabels() {
    const response = await fetch(`${BASE_URL}/labels/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    const labels = await response.json();
    const labelSelect = document.getElementById('taskLabel');
    labelSelect.innerHTML = '<option value="">No Label</option>'; // Reset options

    labels.forEach(label => {
        const option = document.createElement('option');
        option.value = label.label_id;
        option.textContent = label.name;
        labelSelect.appendChild(option);
    });
}

// Fetch tasks and display them in the task list
async function fetchTasks() {
    const response = await fetch(`${BASE_URL}/tasks/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    const tasks = await response.json();
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = ''; // Clear existing tasks

    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${task.labels.length ? '' : 'task-gray'}`;
        taskCard.innerHTML = `
            <h3 class="font-bold">${task.title}</h3>
            <p>${task.description || 'No description'}</p>
            <p>Due in: ${getDaysRemaining(task.due_date)} days</p>
        `;

        taskCard.addEventListener('click', () => {
            alert(`Task: ${task.title}\nDue: ${task.due_date}\nPriority: ${task.priority || 'Not set'}`);
        });

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

// Save new task
document.getElementById('saveTaskBtn')?.addEventListener('click', async () => {
    const taskTitle = document.getElementById('taskTitle').value;
    const taskDueDate = document.getElementById('taskDueDate').value;

    if (!taskTitle || !taskDueDate) {
        alert('Please fill in the required fields: Task Title and Due Date.');
        return;
    }

    const taskData = {
        title: taskTitle,
        description: document.getElementById('taskDescription').value,
        due_date: taskDueDate,
        labels: [document.getElementById('taskLabel').value], // List of label IDs
        priority: document.getElementById('taskPriority').value
    };

    await fetch(`${BASE_URL}/tasks/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
    });

    document.getElementById('taskModal').style.display = 'none'; // Hide modal
    fetchTasks(); // Refresh task list
});

// Save new label
document.getElementById('saveLabelBtn')?.addEventListener('click', async () => {
    const labelName = document.getElementById('labelName').value;
    const labelColor = document.getElementById('labelColor').value;

    if (!labelName || !labelColor) {
        alert('Please fill in the required fields: Label Name and Color.');
        return;
    }

    const labelData = {
        name: labelName,
        color: labelColor
    };

    await fetch(`${BASE_URL}/labels/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(labelData)
    });

    document.getElementById('labelModal').style.display = 'none'; // Hide modal
    fetchLabels(); // Refresh label list in task modal
});

// --------------------- ON PAGE LOAD ---------------------

// Initialize the page by fetching tasks, labels, and user info
window.onload = () => {
    if (!token) {
        window.location.href = 'login.html'; // Redirect to login if no token is found
    } else {
        fetchUser();
        fetchLabels();
        fetchTasks();
    }
};
