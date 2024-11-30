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
      const googleSync = await checkGoogleSync();
      if (!googleSync) {
        document.getElementById('popup-container').style.display = 'flex';
      }

      // Update the Google sync toggle based on the user's sync status
      const googleSyncToggle = document.getElementById('google-sync-toggle');
      const googleSyncStatus = document.getElementById('google-sync-status');
      googleSyncToggle.checked = googleSync;
      googleSyncStatus.textContent = googleSync ? 'Synced' : 'Not Synced';
      googleSyncStatus.style.color = googleSync ? 'green' : 'red';

      googleSyncToggle.addEventListener('change', async function() {
        if (googleSyncToggle.checked) {
          // Sync with Google Calendar
          document.cookie = `token=${localStorage.getItem('token')}; path=/`;
          const url = `${API_ENDPOINT}/auth/google`;
          window.open(url, '_blank');
        } else {
          // Unsync with Google Calendar
          await unsyncGoogleCalendar();
          googleSyncStatus.textContent = 'Not Synced';
        }
      });
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

    const closeButton = document.getElementById('close-btn');
    const googleSyncContainer = document.getElementById('popup-container');
    syncButton = document.getElementById('sync-btn');
    
    syncButton.addEventListener('click', () => {
    document.cookie = `token=${localStorage.getItem('token')}; path=/`;
    window.open(`${API_ENDPOINT}/auth/google`, '_blank');});

    closeButton.addEventListener('click', function() {
      googleSyncContainer.style.display = 'none';
  });

});

// check if the user has synced their google calendar
const checkGoogleSync = async () => {
  const data = await fetch(`${API_ENDPOINT}/user/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }).then(res => res.json());
  return data.google_sync;
}
const unsyncGoogleCalendar = async () => {
  const data = await fetch(`${API_ENDPOINT}/user/disable_google_sync`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }).then(res => res.json());
  return ;
}

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
  // Retrieve tasks from localStorage or another storage method
  let todos = JSON.parse(localStorage.getItem('saved-todos')) || [];
  const currentFilter = localStorage.getItem('currentFilter') || 'all';

  // Clear the current list of tasks in the DOM
  todosList.innerHTML = '';

  // Loop through each task to render it with the edit functionality
  todos.forEach(function(todoObject) {
      const { task_id, title, formatted_due_date, is_completed, description, priority, showDescription } = todoObject;
      const formattedDueDateEdit = formatDateEdit(formatted_due_date);

      // Set up checked status for completed tasks and CSS class for completed appearance
      const checked = is_completed ? 'checked' : '';
      const completedClass = is_completed ? 'completed' : '';
      const descriptionVisibility = showDescription ? '' : 'hidden';
      const arrowDirection = showDescription ? '⬆️' : '⬇️';


      // Define the HTML for each task item, including edit and delete options
      const taskHTML = `
      <div class="todo_box ${completedClass}" value="${task_id}" style=" display:${currentFilter === 'incomplete' && is_completed ? 'none!important': 'grid'} ;border-left: 5px solid ${getPriorityColor(priority)};">
          <div class="todo-header">
              <input type="checkbox" onchange="toggleCompleteTask(${task_id})" class="complete-todo" data-id="${task_id}" ${checked}>
              <div class="todo todo-small-name">${title}</div>
              <div class="todo todo-date">${formatted_due_date}</div>
              <button class="edit-todo" onclick="toggleEditSection(${task_id})">Edit</button>
              <button class="delete-todo" onclick="deleteTask(${task_id})">Delete</button>
              <button class="toggle-description" onclick="toggleDescription(${task_id})">${arrowDirection}</button>
          </div>
          <div class="task-description ${descriptionVisibility}">
              ${description || 'No description provided.'}
          </div>
          <!-- Hidden edit section for updating task details -->
          <div id="edit-section-${task_id}" class="edit-section hidden">
              <input type="text" id="editName-${task_id}" value="${title}" placeholder="Task Name" class="todo-name">
              <input type="date" id="editDueDate-${task_id}" value="${formattedDueDateEdit}" class="todo-due-date" placeholder="${formattedDueDateEdit}">
              <input type="text" id="editDescription-${task_id}" value="${description}"  placeholder="Enter Description" class="todo-description">
              <select id="editPriority-${task_id}" class="todo-priority">
                  <option value="Low" ${priority === 'Low' ? 'selected' : ''}>Low</option>
                  <option value="Medium" ${priority === 'Medium' ? 'selected' : ''}>Medium</option>
                  <option value="High" ${priority === 'High' ? 'selected' : ''}>High</option>
              </select>
              <button onclick="saveEdit(${task_id})" class="save-todo">Save</button>
          </div>
      </div>
      `;

      // Append the generated HTML for each task to the todos container in the DOM
      todosList.innerHTML += taskHTML;
  });
}



function toggleEditSection(taskId) {
  const editSection = document.getElementById(`edit-section-${taskId}`);
  editSection.classList.toggle('hidden');
}


async function saveEdit(taskId) {
  const updatedTask = {
      title: document.getElementById(`editName-${taskId}`).value,
      description: document.getElementById(`editDescription-${taskId}`).value,
      due_date: document.getElementById(`editDueDate-${taskId}`).value,
      priority: document.getElementById(`editPriority-${taskId}`).value
  };


  if (!updatedTask.title || !updatedTask.due_date) {
      alert('Please enter a task and due date!');
      return;
  }

  // Call the updateTask function to send the changes to the backend
  await updateTask(taskId, updatedTask);
  
  // Refresh tasks after saving
  await fetchTodos();

  // Re-render the tasks
  renderTodos();

  updateCalendarEvents();
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



// async function editTask(id) {
//   let todos = JSON.parse(localStorage.getItem('saved-todos'));
//   const task = todos.find(todo => todo.task_id === id);

//   if (!task) return alert("Task not found!");

//   // Open modal with task details pre-filled
//   document.querySelector('#editTodoModal').style.display = 'block';
//   document.querySelector('#editName').value = task.title;
//   document.querySelector('#editDescription').value = task.description;
//   document.querySelector('#editDueDate').value = task.due_date;
//   document.querySelector('#editPriority').value = task.priority;

//   document.querySelector('#saveEdit').onclick = async () => {
//     const updatedTask = {
//       title: document.querySelector('#editName').value,
//       description: document.querySelector('#editDescription').value,
//       due_date: document.querySelector('#editDueDate').value,
//       priority: document.querySelector('#editPriority').value
//     };

//     // Update task via backend API
//     await fetch(`http://localhost:8000/tasks/${id}`, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${localStorage.getItem('token')}`
//       },
//       body: JSON.stringify(updatedTask)
//     });

//     // Close modal and refresh
//     document.querySelector('#editTodoModal').style.display = 'none';
//     await fetchTodos();
//     renderTodos();
//   };
// }

// document.querySelector('#closeEditModal').onclick = () => {
//   document.querySelector('#editTodoModal').style.display = 'none';
// };



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
  res= await fetch(`${API_ENDPOINT}/tasks/${id}`, {
    method: 'DELETE',
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

async function addTodo() {
  const todo = todoName.value;
  const todoDuedate = todoDuedateElement.value;
  const todoDescription = todoDescriptionElement.value;
  const todoPriority = todoPriorityElement.value; 
  
  if (!todo || !todoDuedate) {
    alert('Please enter a task and due date!');
    return;
  }

  request = {
    title: todo,
    description: todoDescription,
    due_date: todoDuedate,
    priority: todoPriority
  };

  res= await fetch(`${API_ENDPOINT}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(request)
  });

  if (res.status !== 201) {
    alert('Failed to add task');
    return;
  }



  // todos.push({
  //   name: todo,
  //   dueDate: todoDuedate,
  //   description: todoDescription,
  //   priority: todoPriority, 
  //   completed: false,
  //   showDescription: false
  // });

  todoName.value = '';
  todoDuedateElement.value = '';
  todoDescriptionElement.value = '';
  todoPriorityElement.value = 'low'; // Reset priority to default
  await fetchTodos();
  renderTodos();
  // localStorage.setItem('saved-todos', JSON.stringify(todos));

  // Update the calendar after adding a new todo
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
  // Clear all events first
  calendar.getEvents().forEach(event => event.remove());
  todos = JSON.parse(localStorage.getItem('saved-todos')) || [];
  // Add updated todos as events
  todos.forEach(function(todo) {
    calendar.addEvent({
      title: todo.title,
      start: todo.formatted_due_date,
      backgroundColor: getPriorityColor(todo.priority), // Apply color based on priority
      borderColor: todo.completed ? '#d3d3d3' : '', // Grey out completed tasks
      classNames: todo.completed ? 'completed-event' : '' // Add class if task is completed
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