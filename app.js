const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const dateInput = document.getElementById('todo-due-date');
const hoursSelect = document.getElementById('todo-due-hours');
const minutesSelect = document.getElementById('todo-due-minutes');
const locationInput = document.getElementById('todo-location');
const contactInput = document.getElementById('todo-contact');
const descriptionInput = document.getElementById('todo-description');
const list = document.getElementById('todo-list');
const remainingCount = document.getElementById('remaining-count');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter');

let todos = [];
let currentFilter = 'all';

function populateSelect(select, count, pad) {
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = '--';
  select.appendChild(empty);
  for (let i = 0; i < count; i++) {
    const opt = document.createElement('option');
    opt.value = String(i).padStart(pad, '0');
    opt.textContent = String(i).padStart(pad, '0');
    select.appendChild(opt);
  }
}

populateSelect(hoursSelect, 24, 2);
populateSelect(minutesSelect, 60, 2);

async function save() {
  localStorage.setItem('todos', JSON.stringify(todos));
  try {
    await fetch('/api/todos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todos),
    });
  } catch {}
}

function buildSeed() {
  const now = new Date();
  const iso = (offsetDays, hour, minute) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };
  const yyyymmdd = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const today = yyyymmdd(now);

  const todosList = [
    {
      id: 1,
      text: 'Grocery shopping',
      completed: false,
      due: `${today}T10:30`,
      location: 'Whole Foods',
      contact: null,
      description: 'Milk, eggs, bread, coffee beans, and some fruit.',
    },
    {
      id: 2,
      text: 'Dentist appointment',
      completed: false,
      due: iso(1, 9, 15),
      location: 'Bright Smile Dental, 12 Elm St',
      contact: 'Dr. Chen (555-0142)',
      description: 'Bring insurance card. Root canal follow-up.',
    },
    {
      id: 3,
      text: 'Finish project report',
      completed: false,
      due: iso(2, 17, 0),
      location: null,
      contact: null,
      description: 'Wrap up the Q3 summary and email it to the team.',
    },
    {
      id: 4,
      text: 'Call the plumber',
      completed: false,
      due: iso(-1, 14, 0),
      location: null,
      contact: 'Maple Plumbing (555-0199)',
      description: 'Leaky faucet in the kitchen.',
    },
    {
      id: 5,
      text: 'Water the plants',
      completed: false,
      due: null,
      location: null,
      contact: null,
      description: null,
    },
    {
      id: 6,
      text: 'Pick up dry cleaning',
      completed: true,
      due: iso(0, 8, 0),
      location: 'Sunshine Cleaners',
      contact: null,
      description: null,
    },
    {
      id: 7,
      text: 'Renew gym membership',
      completed: true,
      due: iso(-2, 12, 0),
      location: null,
      contact: 'FitZone Gym (555-0177)',
      description: 'Auto-renewal was on hold.',
    },
    {
      id: 8,
      text: 'Team lunch reservation',
      completed: true,
      due: `${today}T12:30`,
      location: 'La Trattoria',
      contact: 'Table for 6 under Miller',
      description: 'Confirmation number 4821.',
    },
    {
      id: 9,
      text: 'Read chapter 5 of design book',
      completed: true,
      due: null,
      location: null,
      contact: null,
      description: null,
    },
    {
      id: 10,
      text: 'Order birthday gift',
      completed: true,
      due: iso(-3, 16, 45),
      location: null,
      contact: null,
      description: 'Sent a watch to the in-laws.',
    },
  ];
  return todosList;
}

async function loadTodos() {
  let serverData = null;
  try {
    const res = await fetch('/api/todos');
    const data = await res.json();
    if (Array.isArray(data)) serverData = data;
  } catch {}

  if (serverData && serverData.length) {
    todos = serverData;
    localStorage.setItem('todos', JSON.stringify(todos));
  } else {
    const local = JSON.parse(localStorage.getItem('todos') || 'null');
    todos = Array.isArray(local) && local.length ? local : buildSeed();
    localStorage.setItem('todos', JSON.stringify(todos));
    save();
  }
  render();
}

loadTodos();

function formatDate(value) {
  const d = new Date(value);
  const hasTime = value.length > 10;
  return d.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

function isOverdue(todo) {
  if (todo.completed) return false;
  return !!todo.due && new Date(todo.due) < new Date();
}

function sortTodos(list) {
  return list.sort((a, b) => {
    const ta = a.due || '';
    const tb = b.due || '';
    if (ta === tb) return 0;
    if (!ta) return 1;
    if (!tb) return -1;
    return new Date(ta) - new Date(tb);
  });
}

function render() {
  list.innerHTML = '';
  const filtered = todos.filter((todo) => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });
  sortTodos(filtered);

  filtered.forEach((todo) => {
    const li = document.createElement('li');
    const overdue = isOverdue(todo);
    li.className = 'todo-item' + (todo.completed ? ' completed' : '') + (overdue ? ' overdue' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => {
      todo.completed = checkbox.checked;
      save();
      render();
    });

    const textWrap = document.createElement('div');
    textWrap.style.flex = '1';

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;

    textWrap.appendChild(span);
    if (todo.due) {
      const time = document.createElement('div');
      time.className = 'todo-time';
      time.textContent = 'Due ' + formatDate(todo.due);
      textWrap.appendChild(time);
    }
    if (todo.location || todo.contact) {
      const meta = document.createElement('div');
      meta.className = 'todo-meta';
      if (todo.location) {
        const isUrl = /^https?:\/\/.+/.test(todo.location);
        const span = document.createElement('span');
        span.textContent = '\ud83d\udccd ' + todo.location;
        if (isUrl) {
          const a = document.createElement('a');
          a.className = 'todo-location-link';
          a.href = todo.location;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = span.textContent;
          meta.appendChild(a);
        } else {
          meta.appendChild(span);
        }
        if (todo.contact) meta.append('   ');
      }
      if (todo.contact) {
        const span = document.createElement('span');
        span.textContent = '\u2709 ' + todo.contact;
        meta.appendChild(span);
      }
      textWrap.appendChild(meta);
    }
    if (todo.description) {
      const desc = document.createElement('div');
      desc.className = 'todo-desc';
      desc.textContent = todo.description;
      textWrap.appendChild(desc);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '\u00d7';
    deleteBtn.addEventListener('click', () => {
      todos = todos.filter((t) => t !== todo);
      save();
      render();
    });

    li.appendChild(checkbox);
    li.appendChild(textWrap);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });

  const remaining = todos.filter((t) => !t.completed).length;
  remainingCount.textContent = `${remaining} left`;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  let due = null;
  if (dateInput.value) {
    const h = hoursSelect.value;
    const m = minutesSelect.value;
    due = h && m ? `${dateInput.value}T${h}:${m}` : dateInput.value;
  }

  todos.push({
    id: Date.now(),
    text,
    completed: false,
    due,
    location: locationInput.value.trim() || null,
    contact: contactInput.value.trim() || null,
    description: descriptionInput.value.trim() || null,
  });
  save();
  render();
  input.value = '';
  dateInput.value = '';
  hoursSelect.value = '';
  minutesSelect.value = '';
  locationInput.value = '';
  contactInput.value = '';
  descriptionInput.value = '';
  input.focus();
});

clearCompletedBtn.addEventListener('click', () => {
  todos = todos.filter((t) => !t.completed);
  save();
  render();
});

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});
