const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

let selectedCategory = null;

const tableBody = document.getElementById('tickets-table');
const openTicketsEl = document.getElementById('openTickets');
const closedTicketsEl = document.getElementById('closedTickets');
const locationSelect = document.getElementById('locationSelect');

/* NAVIGATION */
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(btn.dataset.panel).classList.add('active');
  });
});

/* LOGOUT */
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

/* CATEGORY SELECTION */
const categoryContainer = document.getElementById('categoryContainer');
let selectedCategoryId = null;

const loadCategories = async () => {
  try {
    const res = await fetch('/api/categories', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    categoryContainer.innerHTML = '';

    if (!res.ok) {
      alert(data.message || 'Failed to load categories');
      return;
    }

    (data.data || []).forEach(cat => {
      const card = document.createElement('div');
      card.className = 'category-card';
      card.innerHTML = `
        <h4>${cat.name}</h4>
        <p>${cat.description}</p>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.category-card')
          .forEach(c => c.classList.remove('selected'));

        card.classList.add('selected');
        selectedCategoryId = cat.id;
        selectedCategory = cat;
      });

      categoryContainer.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    alert('Error loading categories');
  }
};

/* LOAD LOCATIONS */
const loadLocations = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/locations', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    locationSelect.innerHTML = '';

    if (!res.ok) {
      alert(data.message || 'Failed to load locations');
      return;
    }

    (data.data || []).forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc.id;
      opt.textContent = `${loc.name} (${loc.building || 'N/A'})`;
      locationSelect.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    alert('Error loading locations');
  }
};

/* FETCH TICKETS */
const fetchTickets = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/tickets', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    tableBody.innerHTML = '';

    if (!res.ok) {
      alert(data.message || 'Failed to load tickets');
      return;
    }

    let open = 0;
    let closed = 0;

    (data.data || []).forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.id}</td>
        <td>${t.title}</td>
        <td>${t.status}</td>
        <td>${t.location_name ?? '-'}</td>
        <td>${new Date(t.opened_at).toLocaleString()}</td>
        <td>
          ${t.status === 'CLOSED'
            ? `<button class="btn" onclick="openFeedbackModal(${t.id})">Feedback</button>`
            : '-'}
        </td>
      `;
      tableBody.appendChild(tr);

      t.status === 'CLOSED' ? closed++ : open++;
    });

    openTicketsEl.textContent = open;
    closedTicketsEl.textContent = closed;
  } catch (err) {
    console.error(err);
    alert('Error fetching tickets');
  }
};

/* CREATE TICKET */
document.getElementById('ticketForm').addEventListener('submit', async e => {
  e.preventDefault();

  if (!selectedCategory) {
    alert('Please select a ticket category');
    return;
  }

  const description = document.getElementById('description').value;
  const locationId = locationSelect.value;

  try {
    const res = await fetch('http://localhost:5000/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        categoryId: selectedCategoryId,
        description,
        locationId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Failed to create ticket');
      return;
    }

    alert('Ticket submitted successfully');
    selectedCategory = null;
    selectedCategoryId = null;
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
    e.target.reset();
    fetchTickets();
  } catch (err) {
    console.error(err);
    alert('Error submitting ticket');
  }
});

/* =======================
   FEEDBACK MODAL
======================= */
const openFeedbackModal = (ticketId) => {
  document.getElementById('feedbackTicketId').value = ticketId;
  document.getElementById('feedbackModal').classList.add('active');
  // Reset form state
  document.getElementById('selectedRating').value = '';
  document.getElementById('feedbackComment').value = '';
  document.querySelectorAll('.star-btn').forEach(s => s.classList.remove('selected'));
};

const closeFeedbackModal = () => {
  document.getElementById('feedbackModal').classList.remove('active');
};

// Close modal when clicking outside
document.getElementById('feedbackModal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('feedbackModal')) closeFeedbackModal();
});

// Star rating selection
document.querySelectorAll('.star-btn').forEach(star => {
  star.addEventListener('click', () => {
    const value = parseInt(star.dataset.value);
    document.getElementById('selectedRating').value = value;
    document.querySelectorAll('.star-btn').forEach(s => {
      s.classList.toggle('selected', parseInt(s.dataset.value) <= value);
    });
  });
});

// Submit feedback form
document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const ticketId = parseInt(document.getElementById('feedbackTicketId').value);
  const rating = parseInt(document.getElementById('selectedRating').value) || null;
  const comment = document.getElementById('feedbackComment').value.trim() || null;

  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ticketId, rating, comment }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Failed to submit feedback');
      return;
    }

    closeFeedbackModal();
    alert('Feedback submitted successfully!');
    fetchTickets();

  } catch (err) {
    console.error(err);
    alert('Error submitting feedback');
  }
});

// refresh tickets silently every 60 seconds
setInterval(() => {
  fetchTickets();
}, 60000);

// INIT
loadCategories();
loadLocations();
fetchTickets();
