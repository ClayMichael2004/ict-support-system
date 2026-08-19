AuthHelper.requireAuth(['OFFICER', 'ADMIN']);

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
    const panel = document.getElementById(btn.dataset.panel);
    if (panel) panel.classList.add('active');

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
    if (!res) return;

    if (!res.ok) {
      throw new Error('Failed to fetch tickets');
    }

    const { data = [] } = await res.json();
    ticketsTableBody.innerHTML = '';

    let open = 0, inProgress = 0, closed = 0;

    if (data.length === 0) {
      ticketsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #888; padding: 20px;">No tickets assigned to you yet</td></tr>';
    } else {
      data.forEach(ticket => {
        const tr = document.createElement('tr');
        const statusClass = (ticket.status || '').toLowerCase().replace('_', '-');
        const opened = ticket.opened_at || ticket.openedAt || ticket.created_at;

        tr.innerHTML = `
          <td>${ticket.id}</td>
          <td>${ticket.category_name || ticket.title}</td>
          <td><span class="status-badge ${statusClass}">${ticket.status}</span></td>
          <td>${ticket.location_name || ticket.locationName || '-'}</td>
          <td>${opened ? new Date(opened).toLocaleString() : '-'}</td>
          <td>
            ${ticket.status !== 'CLOSED'
              ? `<button class="btn" onclick="event.stopPropagation(); updateStatus(${ticket.id}, 'IN_PROGRESS')">In Progress</button>
                 <button class="btn danger" onclick="event.stopPropagation(); updateStatus(${ticket.id}, 'CLOSED')">Close</button>`
              : '<span style="color: #059669; font-weight: 500;">Resolved</span>'}
          </td>
        `;
        
        // Make row clickable to view details
        tr.addEventListener('click', () => viewTicketDetails(ticket.id));
        
        ticketsTableBody.appendChild(tr);

        if (ticket.status === 'OPEN') open++;
        if (ticket.status === 'IN_PROGRESS') inProgress++;
        if (ticket.status === 'CLOSED') closed++;
      });
    }

    openTicketsEl.textContent = open;
    inProgressTicketsEl.textContent = inProgress;
    closedTicketsEl.textContent = closed;

  } catch (err) {
    console.error(err);
    showToast('Failed to fetch tickets: ' + err.message, 'error');
  }
};

/* =======================
   VIEW TICKET DETAILS
======================= */
const viewTicketDetails = async (ticketId) => {
  try {
    const res = await AuthHelper.fetchWithAuth(`/api/tickets/${ticketId}`);
    if (!res) return;

    if (!res.ok) throw new Error('Failed to fetch ticket details');

    const { data: ticket } = await res.json();

    // Populate modal with ticket details
    document.getElementById('modal-ticket-id').textContent = ticket.id;
    document.getElementById('modal-ticket-title').textContent = ticket.category_name || ticket.title;
    
    // Status badge
    const statusEl = document.getElementById('modal-ticket-status');
    const statusClass = (ticket.status || '').toLowerCase().replace('_', '-');
    statusEl.innerHTML = `<span class="status-badge ${statusClass}">${ticket.status}</span>`;
    
    document.getElementById('modal-ticket-description').textContent = ticket.description || 'No description provided';
    
    // User info
    document.getElementById('modal-user-name').textContent = ticket.user_full_name || ticket.userName || 'N/A';
    document.getElementById('modal-user-email').textContent = ticket.user_email || 'N/A';
    
    // Location info
    document.getElementById('modal-location-name').textContent = ticket.location_name || ticket.locationName || 'N/A';
    document.getElementById('modal-location-building').textContent = ticket.location_building || ticket.building || 'N/A';
    
    // Timeline
    const opened = ticket.opened_at || ticket.openedAt || ticket.created_at;
    const closed = ticket.closed_at || ticket.closedAt;

    document.getElementById('modal-opened-at').textContent = 
      opened ? new Date(opened).toLocaleString() : 'N/A';
    document.getElementById('modal-closed-at').textContent = 
      closed ? new Date(closed).toLocaleString() : 'Not yet closed';
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
    showToast('Failed to load ticket details: ' + error.message, 'error');
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
    const res = await AuthHelper.fetchWithAuth(`/api/tickets/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (!res) return;
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update status');

    showToast(`Ticket #${id} marked as ${status}`, 'success');
    fetchTickets();
  } catch (err) {
    showToast('Failed to update status: ' + err.message, 'error');
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
    if (!res) return;

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to load staff');
    }

    const { data = [] } = await res.json();
    staffTableBody.innerHTML = '';

    if (data.length === 0) {
      staffTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888; padding: 20px;">No registered staff found</td></tr>';
      return;
    }

    data.forEach(user => {
      const tr = document.createElement('tr');
      const regDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : '-';
      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${user.fullName || user.full_name || '-'}</td>
        <td>${user.email}</td>
        <td>${regDate}</td>
      `;
      staffTableBody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    showToast('Failed to load staff: ' + err.message, 'error');
  }
};

/* =======================
   REGISTER STAFF
======================= */
document.getElementById('staffForm').addEventListener('submit', async e => {
  e.preventDefault();

  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!fullName || !email || !password) {
    return showToast('All fields are required', 'warning');
  }

  try {
    const res = await AuthHelper.fetchWithAuth('/api/officer/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        email,
        password
      })
    });

    if (!res) return;

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    showToast('Staff registered successfully', 'success');
    e.target.reset();
    fetchStaff(); // Refresh the staff list
  } catch (err) {
    showToast(err.message || 'Registration failed', 'error');
  }
});

/* =======================
   FETCH FEEDBACK
======================= */
const fetchFeedback = async () => {
  try {
    const res = await AuthHelper.fetchWithAuth('/api/officer/feedback');
    if (!res) return;

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to load feedback');
    }

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
      const isNew = !feedback.is_read;
      const stars = renderStars(feedback.rating || 0);
      
      const feedbackEl = document.createElement('div');
      feedbackEl.className = `feedback-item ${isNew ? 'new' : ''}`;
      feedbackEl.innerHTML = `
        <div class="feedback-header">
          <div>
            <h4 class="feedback-title">Ticket #${feedback.ticket_id}: ${feedback.ticket_title || 'Support Ticket'}</h4>
            <div class="feedback-meta">
              From: <strong>${feedback.staff_name || 'Staff Member'}</strong> (${feedback.staff_email || 'N/A'})
            </div>
          </div>
          <div class="feedback-rating" title="${feedback.rating || 0}/5 stars">
            ${stars}
          </div>
        </div>
        
        <div class="feedback-body">
          ${feedback.comment ? `<div class="feedback-comment">"${feedback.comment}"</div>` : '<em style="color: #999;">No comment provided</em>'}
          
          <div class="feedback-ticket-info">
            <strong>Ticket Description:</strong> ${feedback.ticket_description || '-'}
          </div>
        </div>
        
        <div class="feedback-timestamp">
          ${isNew ? '🔴 New - ' : ''}${formatTimestamp(feedback.created_at)}
        </div>
      `;
      
      feedbackContainer.appendChild(feedbackEl);
    });

    // Mark all as read and clear badge
    await markFeedbackAsRead();

  } catch (err) {
    console.error(err);
    feedbackContainer.innerHTML = `
      <div class="no-feedback">
        <div class="no-feedback-icon">⚠️</div>
        <p style="color: #dc2626;">Failed to load feedback. Please try again later.</p>
      </div>
    `;
    showToast('Failed to load feedback: ' + err.message, 'error');
  }
};

/* =======================
   MARK FEEDBACK AS READ
======================= */
const markFeedbackAsRead = async () => {
  try {
    await AuthHelper.fetchWithAuth('/api/officer/feedback/read', {
      method: 'PATCH',
    });
    // Clear badge immediately
    feedbackBadge.style.display = 'none';
    feedbackBadge.textContent = '0';
  } catch (err) {
    console.error('Failed to mark feedback as read');
  }
};

/* =======================
   FETCH FEEDBACK COUNT (for badge)
======================= */
const fetchFeedbackCount = async () => {
  try {
    const res = await AuthHelper.fetchWithAuth('/api/officer/feedback/count');
    if (!res || !res.ok) return;

    const { data } = await res.json();
    
    if (data && data.count > 0) {
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

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Recently';
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

// Poll every 30 seconds
setInterval(() => {
  fetchFeedbackCount();
}, 30000);

// Refresh tickets silently every 60 seconds
setInterval(() => {
  fetchTickets();
}, 60000);

/* INIT */
fetchTickets();
fetchFeedbackCount();

