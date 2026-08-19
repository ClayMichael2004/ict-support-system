AuthHelper.requireAuth(['STAFF', 'OFFICER', 'ADMIN']);

let selectedCategory = null;
let selectedCategoryId = null;

const tableBody = document.getElementById('tickets-table');
const openTicketsEl = document.getElementById('openTickets');
const closedTicketsEl = document.getElementById('closedTickets');
const locationSelect = document.getElementById('locationSelect');
const categoryContainer = document.getElementById('categoryContainer');

/* NAVIGATION */
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const panel = document.getElementById(btn.dataset.panel);
    if (panel) panel.classList.add('active');

    if (btn.dataset.panel === 'ticketsPanel') fetchTickets();
    if (btn.dataset.panel === 'createPanel') {
      loadCategories();
      loadLocations();
    }
  });
});

/* LOGOUT */
document.getElementById('logoutBtn').addEventListener('click', () => {
  AuthHelper.logout();
});

/* CATEGORY SELECTION */
const loadCategories = async () => {
  try {
    const res = await AuthHelper.fetchWithAuth('/api/categories');
    if (!res) return;

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to load categories');
    }

    const data = await res.json();
    categoryContainer.innerHTML = '';

    const categories = data.data || [];

    if (categories.length === 0) {
      categoryContainer.innerHTML = '<p style="color: #6b7280; grid-column: 1/-1;">No ticket categories available</p>';
      return;
    }

    categories.forEach(cat => {
      const card = document.createElement('div');
      card.className = `category-card ${selectedCategoryId === cat.id ? 'selected' : ''}`;
      card.innerHTML = `
        <h4>${cat.name}</h4>
        <p style="font-size: 12px; margin-top: 6px; font-weight: normal; opacity: 0.85;">${cat.description || ''}</p>
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
    categoryContainer.innerHTML = '<p style="color: #ef4444; grid-column: 1/-1;">Error loading categories</p>';
    showToast('Error loading categories: ' + err.message, 'error');
  }
};

/* LOAD LOCATIONS */
const loadLocations = async () => {
  try {
    const res = await AuthHelper.fetchWithAuth('/api/locations');
    if (!res) return;

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to load locations');
    }

    const data = await res.json();
    locationSelect.innerHTML = '<option value="">Select Location</option>';

    const locations = data.data || [];
    locations.forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc.id;
      opt.textContent = `${loc.name} (${loc.building || 'Main Building'})`;
      locationSelect.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    showToast('Error loading locations: ' + err.message, 'error');
  }
};

/* FETCH TICKETS */
const fetchTickets = async () => {
  try {
    const res = await AuthHelper.fetchWithAuth('/api/tickets');
    if (!res) return;

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to load tickets');
    }

    const data = await res.json();
    tableBody.innerHTML = '';

    let open = 0;
    let closed = 0;

    const tickets = data.data || [];

    if (tickets.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #888; padding: 20px;">You have not submitted any tickets yet</td></tr>';
    } else {
      tickets.forEach(t => {
        const tr = document.createElement('tr');
        const statusClass = (t.status || '').toLowerCase().replace('_', '-');
        const opened = t.opened_at || t.openedAt || t.created_at;

        tr.innerHTML = `
          <td>${t.id}</td>
          <td>${t.category_name || t.title}</td>
          <td><span class="status-badge ${statusClass}">${t.status}</span></td>
          <td>${t.location_name || t.locationName || '-'}</td>
          <td>${opened ? new Date(opened).toLocaleString() : '-'}</td>
          <td>
            ${t.status === 'CLOSED'
              ? `<button class="btn" onclick="openFeedbackModal(${t.id})">Feedback</button>`
              : '<span style="color: #6b7280; font-size: 13px;">In Review</span>'}
          </td>
        `;
        tableBody.appendChild(tr);

        t.status === 'CLOSED' ? closed++ : open++;
      });
    }

    openTicketsEl.textContent = open;
    closedTicketsEl.textContent = closed;
  } catch (err) {
    console.error(err);
    showToast('Error fetching tickets: ' + err.message, 'error');
  }
};

/* CREATE TICKET */
document.getElementById('ticketForm').addEventListener('submit', async e => {
  e.preventDefault();

  if (!selectedCategoryId) {
    return showToast('Please select an issue category', 'warning');
  }

  const descriptionInput = document.getElementById('description');
  const description = descriptionInput.value.trim();
  const locationId = locationSelect.value;

  if (!locationId) {
    return showToast('Please select your location', 'warning');
  }

  if (!description) {
    return showToast('Please describe the issue', 'warning');
  }

  try {
    const res = await AuthHelper.fetchWithAuth('/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categoryId: selectedCategoryId,
        description,
        locationId,
      }),
    });

    if (!res) return;

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to create ticket');
    }

    showToast('Ticket submitted successfully!', 'success');
    selectedCategory = null;
    selectedCategoryId = null;
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
    e.target.reset();

    // Switch back to tickets list
    fetchTickets();
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const ticketsNav = document.querySelector('[data-panel="ticketsPanel"]');
    const ticketsPanel = document.getElementById('ticketsPanel');
    if (ticketsNav) ticketsNav.classList.add('active');
    if (ticketsPanel) ticketsPanel.classList.add('active');

  } catch (err) {
    console.error(err);
    showToast(err.message || 'Error submitting ticket', 'error');
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
    const res = await AuthHelper.fetchWithAuth('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ticketId, rating, comment }),
    });

    if (!res) return;

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to submit feedback');
    }

    closeFeedbackModal();
    showToast('Thank you! Feedback submitted successfully.', 'success');
    fetchTickets();

  } catch (err) {
    console.error(err);
    showToast(err.message || 'Error submitting feedback', 'error');
  }
});

// Refresh tickets silently every 60 seconds
setInterval(() => {
  fetchTickets();
}, 60000);

// INIT
loadCategories();
loadLocations();
fetchTickets();

