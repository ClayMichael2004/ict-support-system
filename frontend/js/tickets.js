const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

const locationSelect = document.getElementById('locationId');
const officerSelect = document.getElementById('assignedOfficerId');
const ticketForm = document.getElementById('ticket-form');
const ticketMessage = document.getElementById('ticket-message');

// Fetch locations and officers
const fetchLocationsOfficers = async () => {
  try {
    const locRes = await fetch('http://localhost:5000/api/locations', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const locData = await locRes.json();
    locData.data.forEach(loc => {
      const option = document.createElement('option');
      option.value = loc.id;
      option.textContent = loc.name;
      locationSelect.appendChild(option);
    });

    const offRes = await fetch('http://localhost:5000/api/officers', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const offData = await offRes.json();
    offData.data.forEach(off => {
      const option = document.createElement('option');
      option.value = off.id;
      option.textContent = off.fullName;
      officerSelect.appendChild(option);
    });
  } catch (err) {
    console.error(err);
  }
};

fetchLocationsOfficers();

// Submit ticket
ticketForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;
  const locationId = locationSelect.value;
  const assignedOfficerId = officerSelect.value;

  try {
    const res = await fetch('http://localhost:5000/api/tickets', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, description, locationId, assignedOfficerId })
    });

    const data = await res.json();
    if (data.success) ticketMessage.textContent = 'Ticket created successfully!';
    else ticketMessage.textContent = data.message;

  } catch (err) {
    ticketMessage.textContent = 'Server error';
  }
});
