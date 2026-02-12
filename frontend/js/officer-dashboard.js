AuthHelper.requireAuth();

const ticketsTableBody = document.querySelector('#tickets-table tbody');
const staffTableBody = document.querySelector('#staffTable tbody');

const openTicketsEl = document.getElementById('openTickets');
const inProgressTicketsEl = document.getElementById('inProgressTickets');
const closedTicketsEl = document.getElementById('closedTickets');

const ticketModal = document.getElementById('ticketModal');
const feedbackContainer = document.getElementById('feedbackContainer');
const feedbackBadge = document.getElementById('feedbackBadge');

/* =======================
   SIDEBAR NAVIGATION
======================= */
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(btn.dataset.panel).classList.add('active');

    if (btn.dataset.panel === 'staffPanel') fetchStaff();
    if (btn.dataset.panel === 'feedbackPanel') fetchFeedback();
  });
});

/* =======================
   LOGOUT
======================= */
document.getElementById('logoutBtn').addEventListener('click', () => {
  AuthHelper.logout();
});

/* =======================
   FETCH TICKETS
======================= */
const fetchTickets = async () => {
  try {
    const res = await AuthHelper.fetchWithAuth('/api/tickets');
    if (!res.ok) throw new Error();

    const { data = [] } = await res.json();
    ticketsTableBody.innerHTML = '';

    let open = 0, inProgress = 0, closed = 0;

    data.forEach(ticket => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${ticket.id}</td>
        <td>${ticket.title}</td>
        <td>${ticket.status}</td>
        <td>${ticket.location_name || ticket.location_id}</td>
        <td>${new Date(ticket.opened_at || ticket.created_at).toLocaleString()}</td>
        <td>
          ${ticket.status !== 'CLOSED'
            ? `<button class="btn" onclick="event.stopPropagation(); updateStatus(${ticket.id}, 'IN_PROGRESS')">In Progress</button>
               <button class="btn danger" onclick="event.stopPropagation(); updateStatus(${ticket.id}, 'CLOSED')">Close</button>`
            : '-'}
        </td>
      `;
      
      // Make row clickable to view details
      tr.addEventListener('click', () => viewTicketDetails(ticket.id));
      
      ticketsTableBody.appendChild(tr);

      if (ticket.status === 'OPEN') open++;
      if (ticket.status === 'IN_PROGRESS') inProgress++;
      if (ticket.status === 'CLOSED') closed++;
    });

    openTicketsEl.textContent = open;
    inProgressTicketsEl.textContent = inProgress;
    closedTicketsEl.textContent = closed;

  } catch (err) {
    alert('Failed to fetch tickets: ' + err.message);
  }
};

/* =======================
   VIEW TICKET DETAILS
======================= */
const viewTicketDetails = async (ticketId) => {
  try {
    const res = await AuthHelper.fetchWithAuth(`/api/tickets/${ticketId}`);
    if (!res.ok) throw new Error('Failed to fetch ticket details');

    const { data: ticket } = await res.json();

    // Populate modal with ticket details
    document.getElementById('modal-ticket-id').textContent = ticket.id;
    document.getElementById('modal-ticket-title').textContent = ticket.title;
    
    // Status badge
    const statusEl = document.getElementById('modal-ticket-status');
    const statusClass = ticket.status.toLowerCase().replace('_', '-');
    statusEl.innerHTML = `<span class="status-badge ${statusClass}">${ticket.status}</span>`;
    
    document.getElementById('modal-ticket-description').textContent = ticket.description;
    
    // User info
    document.getElementById('modal-user-name').textContent = ticket.user_full_name || 'N/A';
    document.getElementById('modal-user-email').textContent = ticket.user_email || 'N/A';
    
    // Location info
    document.getElementById('modal-location-name').textContent = ticket.location_name || 'N/A';
    document.getElementById('modal-location-building').textContent = ticket.location_building || 'N/A';
    
    // Timeline
    document.getElementById('modal-opened-at').textContent = 
      ticket.opened_at ? new Date(ticket.opened_at).toLocaleString() : 'N/A';
    document.getElementById('modal-closed-at').textContent = 
      ticket.closed_at ? new Date(ticket.closed_at).toLocaleString() : 'Not yet closed';
    document.getElementById('modal-solved-by').textContent = ticket.solved_by_name || 'N/A';
    
    // Action buttons
    const actionsDiv = document.getElementById('modal-actions');
    actionsDiv.innerHTML = '';
    
    if (ticket.status !== 'CLOSED') {
      const inProgressBtn = document.createElement('button');
      inProgressBtn.className = 'btn';
      inProgressBtn.textContent = 'Mark In Progress';
      inProgressBtn.onclick = () => updateStatusFromModal(ticket.id, 'IN_PROGRESS');
      
      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn danger';
      closeBtn.textContent = 'Close Ticket';
      closeBtn.onclick = () => updateStatusFromModal(ticket.id, 'CLOSED');
      
      actionsDiv.appendChild(inProgressBtn);
      actionsDiv.appendChild(closeBtn);
    }
    
    // Show modal
    ticketModal.classList.add('active');

  } catch (error) {
    alert('Failed to load ticket details: ' + error.message);
  }
};

/* =======================
   CLOSE MODAL
======================= */
const closeTicketModal = () => {
  ticketModal.classList.remove('active');
};

// Close modal when clicking outside
ticketModal.addEventListener('click', (e) => {
  if (e.target === ticketModal) {
    closeTicketModal();
  }
});

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && ticketModal.classList.contains('active')) {
    closeTicketModal();
  }
});

/* =======================
   UPDATE STATUS
======================= */
const updateStatus = async (id, status) => {
  try {
    await AuthHelper.fetchWithAuth(`/api/tickets/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    fetchTickets();
  } catch (err) {
    alert('Failed to update status: ' + err.message);
  }
};

const updateStatusFromModal = async (id, status) => {
  await updateStatus(id, status);
  closeTicketModal();
};

/* =======================
   FETCH STAFF
======================= */
const fetchStaff = async () => {
  try {
    const res = await AuthHelper.fetchWithAuth('/api/officer/staff');
    if (!res.ok) throw new Error();

    const { data = [] } = await res.json();
    staffTableBody.innerHTML = '';

    data.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${user.fullName}</td>
        <td>${user.email}</td>
        <td>${new Date(user.created_at).toLocaleDateString()}</td>
      `;
      staffTableBody.appendChild(tr);
    });

  } catch (err) {
    alert('Failed to load staff: ' + err.message);
  }
};

/* =======================
   REGISTER STAFF
======================= */
document.getElementById('staffForm').addEventListener('submit', async e => {
  e.preventDefault();

  try {
    const res = await AuthHelper.fetchWithAuth('/api/officer/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: fullName.value,
        email: email.value,
        password: password.value
      })
    });

    if (!res.ok) throw new Error('Registration failed');

    alert('Staff registered successfully');
    e.target.reset();
    fetchStaff(); // Refresh the staff list
  } catch (err) {
    alert('Registration failed: ' + err.message);
  }
});

/* =======================
   FETCH FEEDBACK
======================= */
const fetchFeedback = async () => {
  try {
    const res = await AuthHelper.fetchWithAuth('/api/officer/feedback');
    if (!res.ok) throw new Error();

    const { data = [] } = await res.json();
    feedbackContainer.innerHTML = '';

    if (data.length === 0) {
      feedbackContainer.innerHTML = `
        <div class="no-feedback">
          <div class="no-feedback-icon">📝</div>
          <p>No feedback received yet</p>
        </div>
      `;
      return;
    }

    data.forEach(feedback => {
      const isNew = isWithin24Hours(feedback.created_at);
      const stars = renderStars(feedback.rating);
      
      const feedbackEl = document.createElement('div');
      feedbackEl.className = `feedback-item ${isNew ? 'new' : ''}`;
      feedbackEl.innerHTML = `
        <div class="feedback-header">
          <div>
            <h4 class="feedback-title">Ticket #${feedback.ticket_id}: ${feedback.ticket_title}</h4>
            <div class="feedback-meta">
              From: <strong>${feedback.staff_name}</strong> (${feedback.staff_email})
            </div>
          </div>
          <div class="feedback-rating" title="${feedback.rating}/5 stars">
            ${stars}
          </div>
        </div>
        
        <div class="feedback-body">
          ${feedback.comment ? `<div class="feedback-comment">"${feedback.comment}"</div>` : '<em style="color: #999;">No comment provided</em>'}
          
          <div class="feedback-ticket-info">
            <strong>Ticket:</strong> ${feedback.ticket_description}
          </div>
        </div>
        
        <div class="feedback-timestamp">
          ${isNew ? '🔴 New - ' : ''}${formatTimestamp(feedback.created_at)}
        </div>
      `;
      
      feedbackContainer.appendChild(feedbackEl);
    });

  } catch (err) {
    feedbackContainer.innerHTML = '<p style="color: red;">Failed to load feedback</p>';
  }
};

/* =======================
   FETCH FEEDBACK COUNT (for badge)
======================= */
const fetchFeedbackCount = async () => {
  try {
    const res = await AuthHelper.fetchWithAuth('/api/officer/feedback/count');
    if (!res.ok) return;

    const { data } = await res.json();
    
    if (data.count > 0) {
      feedbackBadge.textContent = data.count;
      feedbackBadge.style.display = 'inline-block';
    } else {
      feedbackBadge.style.display = 'none';
    }

  } catch (err) {
    console.error('Failed to fetch feedback count');
  }
};

/* =======================
   HELPER FUNCTIONS
======================= */
const renderStars = (rating) => {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += `<span class="star ${i <= rating ? '' : 'empty'}">★</span>`;
  }
  return stars;
};

const isWithin24Hours = (timestamp) => {
  const now = new Date();
  const feedbackTime = new Date(timestamp);
  const diffHours = (now - feedbackTime) / (1000 * 60 * 60);
  return diffHours <= 24;
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
};

/* INIT */
fetchTickets();
fetchFeedbackCount();
