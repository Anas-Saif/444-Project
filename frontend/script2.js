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
  await fetchTodos();
  let todos = JSON.parse(localStorage.getItem('saved-todos')) || [];
  let calendarEl = document.getElementById('calendar');

  // Initialize FullCalendar
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: todos.map(todo => ({
      title: todo.name,
      start: todo.dueDate,
      backgroundColor: getPriorityColor(todo.priority), // Apply color based on priority
      borderColor: todo.completed ? '#d3d3d3' : '', // Grey out completed tasks
      classNames: todo.completed ? 'completed-event' : '' // Custom class for completed tasks
    }))
  });

  calendar.render();

  addTodoButton.addEventListener('click', addTodo);
  renderTodos();
});

// Render tasks and add event listeners for filters


// Add filter listeners
document.querySelectorAll('input[name="filter"]').forEach(radio => {
  radio.addEventListener('change', function () {
    currentFilter = this.value; // Update the current filter
    renderTodos(); // Re-render tasks based on the selected filter
  });
});

function renderTodos() {
  // Retrieve tasks from localStorage or another storage method
  let todos = JSON.parse(localStorage.getItem('saved-todos')) || [];

  // Clear the current list of tasks in the DOM
  todosList.innerHTML = '';

  // Loop through each task to render it with the edit functionality
  todos.forEach(function(todoObject) {
      const { task_id, title, formatted_due_date, is_completed, description, priority, showDescription } = todoObject;

      // Set up checked status for completed tasks and CSS class for completed appearance
      const checked = is_completed ? 'checked' : '';
      const completedClass = is_completed ? 'completed' : '';
      const descriptionVisibility = showDescription ? '' : 'hidden';
      const arrowDirection = showDescription ? '⬆️' : '⬇️';

      // Define the HTML for each task item, including edit and delete options
      const taskHTML = `
      <div class="todo_box ${completedClass}" value="${task_id}" style="border-left: 5px solid ${getPriorityColor(priority)};">
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
              <input type="date" id="editDueDate-${task_id}" value="${formatted_due_date}" class="todo-due-date">
              <input type="text" id="editDescription-${task_id}" placeholder="${description}" class="todo-description">
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

  // Call the updateTask function to send the changes to the backend
  await updateTask(taskId, updatedTask);

  // Refresh tasks after saving
  await fetchTasks();
}


async function updateTask(taskId, updatedData) {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:8000/tasks/${taskId}`, {
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
res= await fetch(`http://localhost:8000/tasks/${id}/complete`, {
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
  res= await fetch(`http://localhost:8000/tasks/${id}`, {
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

  res= await fetch('http://localhost:8000/tasks', {
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

  // Add updated todos as events
  todos.forEach(function(todo) {
    calendar.addEvent({
      title: todo.name,
      start: todo.dueDate,
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
  return `${day}-${month}-${year}`;
}
// Function to fetch todos
async function fetchTodos() {
  res = await fetch('http://localhost:8000/tasks', {
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