const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };
const isViewPage = !!document.getElementById('todo-list');
const isAddPage = !!document.getElementById('todo-form');

let todos = [];

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

  return [
    {
      id: 1,
      text: 'Grocery shopping',
      priority: 'Medium',
      category: 'Shopping',
      completed: false,
      due: `${today}T10:30`,
      location: 'Whole Foods',
      contact: null,
      description: 'Milk, eggs, bread, coffee beans, and some fruit.',
    },
    {
      id: 2,
      text: 'Dentist appointment',
      priority: 'High',
      category: 'Health',
      completed: false,
      due: iso(1, 9, 15),
      location: 'Bright Smile Dental, 12 Elm St',
      contact: 'Dr. Chen (555-0142)',
      description: 'Bring insurance card. Root canal follow-up.',
    },
    {
      id: 3,
      text: 'Finish project report',
      priority: 'High',
      category: 'Work',
      completed: false,
      due: iso(2, 17, 0),
      location: null,
      contact: null,
      description: 'Wrap up the Q3 summary and email it to the team.',
    },
    {
      id: 4,
      text: 'Call the plumber',
      priority: 'Low',
      category: 'Home',
      completed: false,
      due: iso(-1, 14, 0),
      location: null,
      contact: 'Maple Plumbing (555-0199)',
      description: 'Leaky faucet in the kitchen.',
    },
    {
      id: 5,
      text: 'Water the plants',
      priority: 'Low',
      category: 'Home',
      completed: false,
      due: null,
      location: null,
      contact: null,
      description: null,
    },
    {
      id: 6,
      text: 'Pick up dry cleaning',
      priority: 'Low',
      category: 'Personal',
      completed: true,
      due: iso(0, 8, 0),
      location: 'Sunshine Cleaners',
      contact: null,
      description: null,
    },
    {
      id: 7,
      text: 'Renew gym membership',
      priority: 'Medium',
      category: 'Health',
      completed: true,
      due: iso(-2, 12, 0),
      location: null,
      contact: 'FitZone Gym (555-0177)',
      description: 'Auto-renewal was on hold.',
    },
    {
      id: 8,
      text: 'Team lunch reservation',
      priority: 'Medium',
      category: 'Work',
      completed: true,
      due: `${today}T12:30`,
      location: 'La Trattoria',
      contact: 'Table for 6 under Miller',
      description: 'Confirmation number 4821.',
    },
    {
      id: 9,
      text: 'Read chapter 5 of design book',
      priority: 'Low',
      category: 'Personal',
      completed: true,
      due: null,
      location: null,
      contact: null,
      description: null,
    },
    {
      id: 10,
      text: 'Order birthday gift',
      priority: 'High',
      category: 'Family',
      completed: true,
      due: iso(-3, 16, 45),
      location: null,
      contact: null,
      description: 'Sent a watch to the in-laws.',
    },
  ];
}

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

async function loadTodos() {
  let serverData = null;
  try {
    const res = await fetch('/api/todos');
    const data = await res.json();
    if (Array.isArray(data)) serverData = data;
  } catch {}

  if (Array.isArray(serverData)) {
    todos = serverData;
    localStorage.setItem('todos', JSON.stringify(todos));
  } else {
    const local = JSON.parse(localStorage.getItem('todos') || 'null');
    todos = Array.isArray(local) && local.length ? local : buildSeed();
    localStorage.setItem('todos', JSON.stringify(todos));
    save();
  }
}

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

function sortTodos(list, sortMode) {
  const byDue = (a, b) => {
    const ta = a.due || '';
    const tb = b.due || '';
    if (ta === tb) return 0;
    if (!ta) return 1;
    if (!tb) return -1;
    return new Date(ta) - new Date(tb);
  };
  const byPriority = (a, b) => {
    const ra = a.priority === undefined || a.priority === null ? 3 : PRIORITY_RANK[a.priority] ?? 3;
    const rb = b.priority === undefined || b.priority === null ? 3 : PRIORITY_RANK[b.priority] ?? 3;
    return ra - rb;
  };
  if (sortMode === 'priority') {
    return list.sort((a, b) => byPriority(a, b) || byDue(a, b));
  }
  return list.sort((a, b) => byDue(a, b) || byPriority(a, b));
}

if (isAddPage) {
  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const micBtn = document.getElementById('mic-btn');
  const dateInput = document.getElementById('todo-due-date');
  const hoursSelect = document.getElementById('todo-due-hours');
  const minutesSelect = document.getElementById('todo-due-minutes');
  const priorityInput = document.getElementById('todo-priority');
  const categoryInput = document.getElementById('todo-category');
  const locationInput = document.getElementById('todo-location');
  const contactInput = document.getElementById('todo-contact');
  const descriptionInput = document.getElementById('todo-description');
  const pageTitle = document.getElementById('page-title');
  const submitBtn = document.getElementById('submit-btn');

  populateSelect(hoursSelect, 24, 2);
  populateSelect(minutesSelect, 60, 2);

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let listening = false;

  if (SR) {
    recognition = new SR();
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (e) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      input.value = transcript.trim();
    };
    recognition.onend = () => {
      listening = false;
      micBtn.classList.remove('listening');
      micBtn.textContent = '\ud83c\udfa4';
    };
    recognition.onerror = () => {
      listening = false;
      micBtn.classList.remove('listening');
      micBtn.textContent = '\ud83c\udfa4';
    };
  } else {
    micBtn.style.display = 'none';
  }

  function startListening() {
    listening = true;
    micBtn.classList.add('listening');
    micBtn.textContent = '\u23f9';
    input.value = '';
    try {
      recognition.start();
    } catch {}
  }

  function stopListening() {
    listening = false;
    micBtn.classList.remove('listening');
    micBtn.textContent = '\ud83c\udfa4';
    recognition.stop();
  }

  micBtn.addEventListener('click', () => {
    if (!recognition) return;
    if (listening) stopListening();
    else startListening();
  });

  const params = new URLSearchParams(location.search);
  const editId = params.get('id');
  let editingTodo = null;

  async function initEdit() {
    if (!editId) return;
    await loadTodos();
    editingTodo = todos.find((t) => String(t.id) === editId);
    if (!editingTodo) return;
    pageTitle.textContent = 'Edit Task';
    submitBtn.textContent = 'Save Task';
    input.value = editingTodo.text;
    if (editingTodo.due) {
      const parts = editingTodo.due.split('T');
      dateInput.value = parts[0] || '';
      if (parts[1]) {
        const hm = parts[1].split(':');
        hoursSelect.value = hm[0].padStart(2, '0');
        minutesSelect.value = (hm[1] || '').slice(0, 2).padStart(2, '0');
      }
    }
    priorityInput.value = editingTodo.priority || '';
    categoryInput.value = editingTodo.category || '';
    locationInput.value = editingTodo.location || '';
    contactInput.value = editingTodo.contact || '';
    descriptionInput.value = editingTodo.description || '';
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

    const data = {
      text,
      due,
      priority: priorityInput.value || null,
      category: categoryInput.value || null,
      location: locationInput.value.trim() || null,
      contact: contactInput.value.trim() || null,
      description: descriptionInput.value.trim() || null,
    };

    if (editingTodo) {
      Object.assign(editingTodo, data);
    } else {
      todos.push({ id: Date.now(), completed: false, ...data });
    }
    save().then(() => {
      location.href = 'index.html';
    });
  });

  initEdit();
}

if (isViewPage) {
  const list = document.getElementById('todo-list');
  const remainingCount = document.getElementById('remaining-count');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const filterBtns = document.querySelectorAll('.filter');
  const catFilterBtns = document.querySelectorAll('.cat-filter');
  const sortSelect = document.getElementById('sort-select');

  let currentFilter = 'all';
  let currentCategory = '';
  let sortMode = 'due';

  function render() {
    list.innerHTML = '';
    const filtered = todos.filter((todo) => {
      if (currentFilter === 'active' && todo.completed) return false;
      if (currentFilter === 'completed' && !todo.completed) return false;
      if (currentCategory && todo.category !== currentCategory) return false;
      return true;
    });
    sortTodos(filtered, sortMode);

    filtered.forEach((todo) => {
      const li = document.createElement('li');
      const overdue = isOverdue(todo);
      li.className =
        'todo-item' +
        (todo.completed ? ' completed' : '') +
        (overdue ? ' overdue' : '') +
        (todo.priority ? ' pri-row-' + todo.priority.toLowerCase() : '');

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
      if (todo.priority) {
        const pri = document.createElement('span');
        pri.className = 'todo-priority pri-' + todo.priority.toLowerCase();
        pri.textContent = todo.priority;
        span.appendChild(pri);
      }
      span.appendChild(document.createTextNode(todo.text));
      if (todo.category) {
        const badge = document.createElement('span');
        badge.className = 'todo-category cat-' + todo.category.toLowerCase();
        badge.textContent = todo.category;
        span.appendChild(badge);
      }

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

      const editBtn = document.createElement('a');
      editBtn.className = 'edit-btn';
      editBtn.href = 'add.html?id=' + todo.id;
      editBtn.textContent = '\u270e';

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
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });

    const remaining = todos.filter((t) => !t.completed).length;
    remainingCount.textContent = `${remaining} left`;
  }

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

  catFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      catFilterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      render();
    });
  });

  sortSelect.addEventListener('change', () => {
    sortMode = sortSelect.value;
    render();
  });

  loadTodos().then(render);

  let syncing = false;
  async function pollServer() {
    if (syncing) return;
    syncing = true;
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      if (!Array.isArray(data)) return;
      if (JSON.stringify(data) !== JSON.stringify(todos)) {
        todos = data;
        localStorage.setItem('todos', JSON.stringify(todos));
        render();
      }
    } catch {
    } finally {
      syncing = false;
    }
  }
  setInterval(pollServer, 2000);
}
