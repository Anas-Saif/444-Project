const todos = JSON.parse(localStorage.getItem('saved-todos')) || [];
let currentFilter = 'all'; // Set the default filter to 'all'

const addTodoButton = document.querySelector('.add-todo');
const todoName = document.querySelector('.todo-name');
const todoDuedateElement = document.querySelector('.todo-due-date');
const todoDescriptionElement = document.querySelector('.todo-description'); // Description input
const todoPriorityElement = document.querySelector('.todo-priority'); // Priority input
const todosList = document.querySelector('.todos');

let calendar; // Declare calendar globally

// FullCalendar initialization
document.addEventListener('DOMContentLoaded', function() {
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
});

// Render tasks and add event listeners for filters
renderTodos();

// Add filter listeners
document.querySelectorAll('input[name="filter"]').forEach(radio => {
  radio.addEventListener('change', function () {
    currentFilter = this.value; // Update the current filter
    renderTodos(); // Re-render tasks based on the selected filter
  });
});

function renderTodos() {
  if (todos.length === 0) {
    todosList.innerHTML = `<tr><td colspan="5" class="text-center">No Tasks</td></tr>`;
    return;
  }

  let filteredTodos = todos;
  
  // Apply the current filter
  if (currentFilter === 'incomplete') {
    filteredTodos = todos.filter(todo => !todo.completed); // Only show incomplete tasks
  }

  let todosHTML = '';

  filteredTodos.forEach(function(todoObject, i) {
    const { name, dueDate, completed, description, showDescription, priority } = todoObject;

    const checked = completed ? 'checked' : '';
    const completedClass = completed ? 'completed' : '';
    const descriptionVisibility = showDescription ? '' : 'hidden';
    const arrowDirection = showDescription ? '⬆️' : '⬇️';

    const html = `
    <div class="todo_box ${completedClass}" style="border-left: 5px solid ${getPriorityColor(priority)};">
      <div class="todo-header">
        <input type="checkbox" class="complete-todo" data-id="${i}" ${checked}>
        <div class="todo todo-small-name">${name}</div>
        <div class="todo todo-date">${dueDate}</div>
        <button class="delete-todo" onclick="
          todos.splice(${i}, 1);
          renderTodos();
          localStorage.setItem('saved-todos', JSON.stringify(todos));
          updateCalendarEvents(); // Update calendar after deletion
        ">Delete</button>
        <button class="toggle-description" onclick="toggleDescription(${i})">${arrowDirection}</button>
      </div>
      <div class="task-description ${descriptionVisibility}">
        ${description || 'No description provided.'}
      </div>
    </div>
    `;
    todosHTML += html;
  });

  todosList.innerHTML = todosHTML;

  const checkboxes = document.querySelectorAll('.complete-todo');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const index = this.getAttribute('data-id');
      toggleCompleteTask(index);
    });
  });
}

function toggleCompleteTask(index) {
  // Toggle the completed status
  todos[index].completed = !todos[index].completed;

  // Update the tasks in local storage
  localStorage.setItem('saved-todos', JSON.stringify(todos));

  // Re-render the tasks
  renderTodos();

  // Re-render the calendar to reflect the changes
  updateCalendarEvents();
}

function toggleDescription(index) {
  // Toggle the showDescription flag
  todos[index].showDescription = !todos[index].showDescription;

  // Update the tasks in local storage
  localStorage.setItem('saved-todos', JSON.stringify(todos));

  // Re-render the tasks
  renderTodos();
}

function addTodo() {
  const todo = todoName.value;
  const todoDuedate = todoDuedateElement.value;
  const todoDescription = todoDescriptionElement.value;
  const todoPriority = todoPriorityElement.value; 
  
  if (!todo || !todoDuedate) {
    alert('Please enter a task and due date!');
    return;
  }

  todos.push({
    name: todo,
    dueDate: todoDuedate,
    description: todoDescription,
    priority: todoPriority, 
    completed: false,
    showDescription: false
  });

  todoName.value = '';
  todoDuedateElement.value = '';
  todoDescriptionElement.value = '';
  todoPriorityElement.value = 'low'; // Reset priority to default

  renderTodos();
  localStorage.setItem('saved-todos', JSON.stringify(todos));

  // Update the calendar after adding a new todo
  updateCalendarEvents();
}

// Helper function to get the color based on priority
function getPriorityColor(priority) {
  switch (priority) {
    case 'high':
      return 'red';
    case 'medium':
      return 'orange';
    case 'low':
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