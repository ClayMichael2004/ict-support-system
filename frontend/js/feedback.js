const feedbackForm = document.getElementById('feedback-form');
const feedbackMessage = document.getElementById('feedback-message');
const ticketSelect = document.getElementById('ticketId');

const fetchTickets = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/tickets/user', { // tickets for this user
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    data.data.forEach(ticket => {
      const option = document.createElement('option');
      option.value = ticket.id;
      option.textContent = `${ticket.title} - ${ticket.status}`;
      ticketSelect.appendChild(option);
    });
  } catch (err) {
    console.error(err);
  }
};

fetchTickets();

// Submit feedback
feedbackForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const ticketId = ticketSelect.value;
  const rating = document.getElementById('rating').value;
  const comment = document.getElementById('comment').value;

  try {
    const res = await fetch('http://localhost:5000/api/feedback', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ticketId, rating, comment })
    });

    const data = await res.json();
    if (data.success) feedbackMessage.textContent = 'Feedback submitted!';
    else feedbackMessage.textContent = data.message;

  } catch (err) {
    feedbackMessage.textContent = 'Server error';
  }
});
