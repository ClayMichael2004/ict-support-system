const locationSelect = document.getElementById('locationId');
const officerSelect = document.getElementById('assignedOfficerId');
const ticketForm = document.getElementById('ticket-form');
const ticketMessage = document.getElementById('ticket-message');

// Fetch locations and officers
const fetchLocationsOfficers = async () => {
  try {
    const locRes = await AuthHelper.fetchWithAuth('/api/locations');
    if (locRes && locRes.ok) {
      const locData = await locRes.json();
      if (locationSelect) {
        locationSelect.innerHTML = '<option value="">Select Location</option>';
        (locData.data || []).forEach(loc => {
          const option = document.createElement('option');
          option.value = loc.id;
          option.textContent = loc.name;
          locationSelect.appendChild(option);
        });
      }
    }

    const offRes = await AuthHelper.fetchWithAuth('/api/officer/staff');
    if (offRes && offRes.ok && officerSelect) {
      const offData = await offRes.json();
      officerSelect.innerHTML = '<option value="">Select Officer</option>';
      (offData.data || []).forEach(off => {
        const option = document.createElement('option');
        option.value = off.id;
        option.textContent = off.fullName || off.full_name;
        officerSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error(err);
  }
};

if (locationSelect || officerSelect) {
  fetchLocationsOfficers();
}

// Submit ticket
if (ticketForm) {
  ticketForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleEl = document.getElementById('title');
    const descriptionEl = document.getElementById('description');
    const title = titleEl ? titleEl.value : '';
    const description = descriptionEl ? descriptionEl.value : '';
    const locationId = locationSelect ? locationSelect.value : '';
    const assignedOfficerId = officerSelect ? officerSelect.value : '';

    try {
      const res = await AuthHelper.fetchWithAuth('/api/tickets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, description, locationId, assignedOfficerId })
      });

      if (!res) return;

      const data = await res.json();
      if (res.ok && data.success) {
        if (ticketMessage) ticketMessage.textContent = 'Ticket created successfully!';
        showToast('Ticket created successfully!', 'success');
        ticketForm.reset();
      } else {
        if (ticketMessage) ticketMessage.textContent = data.message || 'Ticket creation failed';
        showToast(data.message || 'Ticket creation failed', 'error');
      }

    } catch (err) {
      if (ticketMessage) ticketMessage.textContent = err.message || 'Server error';
      showToast(err.message || 'Server error', 'error');
    }
  });
}
