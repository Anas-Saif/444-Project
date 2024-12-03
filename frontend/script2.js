let currentFilter = 'all'; // Set the default filter to 'all'


const addTodoButton = document.querySelector('.add-todo');
const todoName = document.querySelector('.todo-name');
const todoDuedateElement = document.querySelector('.todo-due-date');
const todoDescriptionElement = document.querySelector('.todo-description'); // Description input
const todoPriorityElement = document.querySelector('.todo-priority'); // Priority input
const todosList = document.querySelector('.todos');

let calendar; // Declare calendar globally




// FullCalendar initialization
document.addEventListener('DOMContentLoaded', async function() {
  if (!window.API_ENDPOINT) {
    const script = document.createElement('script');
    script.src = 'config.js';
    document.head.appendChild(script);

    script.onload = async () => {
      await fetchTodos();
      let todos = JSON.parse(localStorage.getItem('saved-todos')) || [];
      let calendarEl = document.getElementById('calendar');
      // Initialize FullCalendar
      calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: todos.map(todo => ({
          title: todo.title,
          start: todo.formatted_due_date,
          backgroundColor: getPriorityColor(todo.priority), // Apply color based on priority
          borderColor: todo.completed ? '#d3d3d3' : '', // Grey out completed tasks
          classNames: todo.completed ? 'completed-event' : '' // Custom class for completed tasks
        }))
      });

      calendar.render();

      addTodoButton.addEventListener('click', addTodo);
      renderTodos();
    };
  } else {
    await fetchTodos();
    let todos = JSON.parse(localStorage.getItem('saved-todos')) || [];
    let calendarEl = document.getElementById('calendar');
    // Initialize FullCalendar
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      events: todos.map(todo => ({
        title: todo.title,
        start: todo.formatted_due_date,
        backgroundColor: getPriorityColor(todo.priority), // Apply color based on priority
        borderColor: todo.completed ? '#d3d3d3' : '', // Grey out completed tasks
        classNames: todo.completed ? 'completed-event' : '' // Custom class for completed tasks
      }))
    });

    calendar.render();

    addTodoButton.addEventListener('click', addTodo);
    renderTodos();
  }
});

// Render tasks and add event listeners for filters


// Add filter listeners
document.querySelectorAll('input[name="filter"]').forEach(radio => {
  radio.addEventListener('change', function () {
    currentFilter = this.value; // Update the current filter
    localStorage.setItem('currentFilter', currentFilter); // Save the filter to localStorage
    renderTodos(); // Re-render tasks based on the selected filter
  });
});

function renderTodos() {
  let todos = JSON.parse(localStorage.getItem('saved-todos')) || [];
  const currentFilter = localStorage.getItem('currentFilter') || 'all';

  // Clear the current list of tasks in the DOM
  todosList.innerHTML = '';

  // Variables to track the progress
  let totalTasks = todos.length;
  let completedTasks = todos.filter(todo => todo.is_completed).length;
  let progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100; // Calculate progress

  // Update the progress bar
  updateProgressBar(progress);

  // Loop through each task to render it
  todos.forEach(function(todoObject) {
    const { task_id, title, formatted_due_date, is_completed, description, priority, showDescription } = todoObject;
    const formattedDueDateEdit = formatDateEdit(formatted_due_date);

    const checked = is_completed ? 'checked' : '';
    const completedClass = is_completed ? 'completed' : '';
    const descriptionVisibility = showDescription ? '' : 'hidden';
    const arrowDirection = showDescription ? '⬆️' : '⬇️';

    // Define the HTML for each task item
    const taskHTML = `
    <div class="todo_box ${completedClass}" value="${task_id}" style=" display:${currentFilter === 'incomplete' && is_completed ? 'none!important': 'grid'} ;border-left: 5px solid ${getPriorityColor(priority)};">
        <div class="todo-header">
            <input type="checkbox" onchange="toggleCompleteTask(${task_id})" class="complete-todo" data-id="${task_id}" ${checked}>
            <div class="todo todo-small-name">${title}</div>
            <div class="todo todo-date">${formatted_due_date}</div> <!-- Rendering the due_date -->
            <button class="edit-todo" onclick="toggleEditSection(${task_id})">Edit</button>
            <button class="delete-todo" onclick="deleteTask(${task_id})">Delete</button>
            <button class="toggle-description" onclick="toggleDescription(${task_id})">${arrowDirection}</button>
        </div>
        <div class="task-description ${descriptionVisibility}">
            ${description || 'No description provided.'}
        </div>
    </div>
    `;
    todosList.innerHTML += taskHTML;
  });
}



function toggleEditSection(taskId) {
  const editSection = document.getElementById(`edit-section-${taskId}`);
  editSection.classList.toggle('hidden');
}

async function saveEdit(taskId) {
  // Get the updated values from the edit input fields
  const updatedTask = {
    title: document.getElementById(`editName-${taskId}`).value,
    description: document.getElementById(`editDescription-${taskId}`).value,
    due_date: document.getElementById(`editDueDate-${taskId}`).value,
    priority: document.getElementById(`editPriority-${taskId}`).value
  };

  // Ensure that the updated task has a title and due date
  if (!updatedTask.title || !updatedTask.due_date) {
    alert('Please enter a task name and due date!');
    return;
  }

  // Retrieve the tasks from localStorage
  let todos = JSON.parse(localStorage.getItem('saved-todos')) || [];

  // Find the index of the task to be updated based on taskId
  const taskIndex = todos.findIndex(todo => todo.task_id === taskId);

  if (taskIndex !== -1) {
    // Update the task at the found index
    todos[taskIndex] = {
      ...todos[taskIndex], // Keep other properties unchanged
      ...updatedTask // Apply the updated values
    };

    // Save the updated tasks back to localStorage
    localStorage.setItem('saved-todos', JSON.stringify(todos));

    // Re-render the tasks and update the calendar
    renderTodos();
    updateCalendarEvents(); // Ensure the calendar reflects the updated tasks
  } else {
    console.error('Task not found!');
  }
}



async function updateTask(taskId, updatedData) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_ENDPOINT}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedData)
  });
  if (!response.ok) {
      console.error('Failed to update task');
  }
}





async function toggleCompleteTask(id) {
res= await fetch(`${API_ENDPOINT}/tasks/${id}/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  await fetchTodos();
  // Re-render the tasks
  renderTodos();

  // Re-render the calendar to reflect the changes
  updateCalendarEvents();
}

async function toggleDescription(id) {
  // Toggle the showDescription flag
  let todos = JSON.parse(localStorage.getItem('saved-todos'));
  const index = todos.findIndex(todo => todo.task_id === id);
  if (index !== -1) {
    todos[index].showDescription = !todos[index].showDescription;
    localStorage.setItem('saved-todos', JSON.stringify(todos));}
  // Update the tasks in local storage
  
  // Re-render the tasks
  renderTodos();
}
async function deleteTask(id) {
  // Retrieve tasks from localStorage
  let todos = JSON.parse(localStorage.getItem('saved-todos')) || [];

  // Filter out the task to be deleted based on the task_id
  todos = todos.filter(todo => todo.task_id !== id);

  // Update localStorage with the new list after deletion
  localStorage.setItem('saved-todos', JSON.stringify(todos));

  // Re-render the tasks and update the calendar
  renderTodos();
  updateCalendarEvents();
}



function renderTodos() {
  let todos = JSON.parse(localStorage.getItem('saved-todos')) || [];
  const currentFilter = localStorage.getItem('currentFilter') || 'all';

  // Clear the current list of tasks in the DOM
  todosList.innerHTML = '';

  // Variables to track the progress
  let totalTasks = todos.length;
  let completedTasks = todos.filter(todo => todo.is_completed).length;
  let progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100; // Calculate progress

  // Update the progress bar
  updateProgressBar(progress);

  // Loop through each task to render it
  todos.forEach(function (todoObject) {
    const {
      task_id,
      title,
      due_date, // Use the raw due_date here
      is_completed,
      description,
      priority,
      showDescription,
    } = todoObject;

    const checked = is_completed ? 'checked' : '';
    const completedClass = is_completed ? 'completed' : '';
    const descriptionVisibility = showDescription ? '' : 'hidden';
    const arrowDirection = showDescription ? '⬆️' : '⬇️';

    // Define the HTML for each task item
    const taskHTML = `
      <div class="todo_box ${completedClass}" value="${task_id}" style=" display:${
      currentFilter === 'incomplete' && is_completed ? 'none!important' : 'grid'
    }; border-left: 5px solid ${getPriorityColor(priority)};">
          <div class="todo-header">
              <input type="checkbox" onchange="toggleCompleteTask(${task_id})" class="complete-todo" data-id="${task_id}" ${checked}>
              <div class="todo todo-small-name">${title}</div>
              <div class="todo todo-date">${due_date}</div> <!-- Display due_date -->
              <button class="edit-todo" onclick="toggleEditSection(${task_id})">Edit</button>
              <button class="delete-todo" onclick="deleteTask(${task_id})">Delete</button>
              <button class="toggle-description" onclick="toggleDescription(${task_id})">${arrowDirection}</button>
          </div>
          <div class="task-description ${descriptionVisibility}">
              ${description || 'No description provided.'}
          </div>
      </div>
    `;
    todosList.innerHTML += taskHTML;
  });
}



// Update the progress bar on the page
function updateProgressBar(progress) {
  const progressBar = document.getElementById('progress-bar');
  const progressPercentage = document.getElementById('progress-percentage');
  
  progressBar.style.width = progress + '%'; // Set the progress bar width
  progressPercentage.innerText = Math.round(progress) + '%'; // Display the progress percentage
}

// Function to toggle task completion
async function toggleCompleteTask(id) {
  let todos = JSON.parse(localStorage.getItem('saved-todos')) || [];
  const task = todos.find(todo => todo.task_id === id);

  if (task) {
    task.is_completed = !task.is_completed; // Toggle completion status
    localStorage.setItem('saved-todos', JSON.stringify(todos)); // Update localStorage
  }
  
  renderTodos(); // Re-render tasks and update progress
}

async function addTodo() {
  const todo = todoName.value.trim(); // Ensure no empty spaces
  const todoDuedate = todoDuedateElement.value; // Use the date picker value directly
  const todoDescription = todoDescriptionElement.value.trim();
  const todoPriority = todoPriorityElement.value;

  // Check for empty fields
  if (!todo || !todoDuedate) {
    alert('Please enter a task and due date!');
    return;
  }

  const newTask = {
    task_id: Date.now(), // Unique ID for the task
    title: todo,
    description: todoDescription,
    due_date: todoDuedate, // Save as YYYY-MM-DD
    priority: todoPriority,
    is_completed: false,
    showDescription: false,
    formatted_due_date: formatDate(todoDuedate), // Ensure it gets formatted for display
  };

  // Get existing tasks from localStorage
  let todos = JSON.parse(localStorage.getItem('saved-todos')) || [];

  // Add the new task to the existing task list
  todos.push(newTask);

  // Save the updated tasks back to localStorage
  localStorage.setItem('saved-todos', JSON.stringify(todos));

  // Clear input fields
  todoName.value = '';
  todoDuedateElement.value = '';
  todoDescriptionElement.value = '';
  todoPriorityElement.value = 'Low'; // Reset priority to default

  // Re-render tasks and update the calendar
  renderTodos();
  updateCalendarEvents();

}






// Helper function to get the color based on priority
function getPriorityColor(priority) {
  switch (priority) {
    case 'High':
      return 'red';
    case 'Medium':
      return 'orange';
    case 'Low':
      return 'green';
    default:
      return '';
  }
}

function updateCalendarEvents() {
  // Clear all events from the calendar
  calendar.getEvents().forEach(event => event.remove());

  // Retrieve tasks from localStorage
  const todos = JSON.parse(localStorage.getItem('saved-todos')) || [];

  // Add updated todos as events to the calendar
  todos.forEach(function (todo) {
    calendar.addEvent({
      title: todo.title, // Task title
      start: todo.due_date, // Use the raw due_date directly
      backgroundColor: getPriorityColor(todo.priority), // Color based on priority
      borderColor: todo.is_completed ? '#d3d3d3' : '', // Grey out completed tasks
      classNames: todo.is_completed ? 'completed-event' : '' // Add class if task is completed
    });
  });
}



// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

document.getElementById('closeInfoModal').addEventListener('click', () => {
  document.getElementById('infoModal').style.display = 'none'; // Close task info modal
});

// Function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to format date for editing yyyy-mm-dd
function formatDateEdit(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}





// Function to fetch todos
async function fetchTodos() {
  res = await fetch(`${API_ENDPOINT}/tasks`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }).then(res => res.json())
  .then(data => {
    todos = data.map(todo => ({
      ...todo,
      formatted_due_date: formatDate(todo.due_date) // Add formatted date
    }));
    localStorage.setItem('saved-todos', JSON.stringify(todos));
  });
}