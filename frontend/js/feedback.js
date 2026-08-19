const feedbackForm = document.getElementById('feedback-form');
const feedbackMessage = document.getElementById('feedback-message');
const ticketSelect = document.getElementById('ticketId');

const fetchTickets = async () => {
  try {
    const res = await AuthHelper.fetchWithAuth('/api/tickets');
    if (!res || !res.ok) return;

    const data = await res.json();
    if (ticketSelect) {
      ticketSelect.innerHTML = '<option value="">Select Closed Ticket</option>';
      (data.data || []).forEach(ticket => {
        if (ticket.status === 'CLOSED') {
          const option = document.createElement('option');
          option.value = ticket.id;
          option.textContent = `#${ticket.id} - ${ticket.category_name || ticket.title}`;
          ticketSelect.appendChild(option);
        }
      });
    }
  } catch (err) {
    console.error(err);
  }
};

if (ticketSelect) {
  fetchTickets();
}

// Submit feedback
if (feedbackForm) {
  feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ticketId = ticketSelect ? ticketSelect.value : null;
    const ratingEl = document.getElementById('rating');
    const commentEl = document.getElementById('comment');
    const rating = ratingEl ? ratingEl.value : null;
    const comment = commentEl ? commentEl.value : null;

    if (!ticketId) {
      if (feedbackMessage) feedbackMessage.textContent = 'Please select a ticket';
      return;
    }

    try {
      const res = await AuthHelper.fetchWithAuth('/api/feedback', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ticketId, rating, comment })
      });

      if (!res) return;

      const data = await res.json();
      if (res.ok && data.success) {
        if (feedbackMessage) feedbackMessage.textContent = 'Feedback submitted successfully!';
        showToast('Feedback submitted successfully!', 'success');
        feedbackForm.reset();
      } else {
        if (feedbackMessage) feedbackMessage.textContent = data.message || 'Feedback submission failed';
        showToast(data.message || 'Feedback submission failed', 'error');
      }

    } catch (err) {
      if (feedbackMessage) feedbackMessage.textContent = err.message || 'Server error';
      showToast(err.message || 'Server error', 'error');
    }
  });
}
