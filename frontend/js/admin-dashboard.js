const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});

// DOM elements
const officersTableBody = document.querySelector('#officers-table tbody');
const locationsTableBody = document.querySelector('#locations-table tbody');
const ticketsTableBody = document.querySelector('#tickets-table tbody');
const auditTableBody = document.querySelector('#audit-table tbody');

const totalOfficersEl = document.getElementById('totalOfficers');
const totalLocationsEl = document.getElementById('totalLocations');
const openTicketsEl = document.getElementById('openTickets');
const closedTicketsEl = document.getElementById('closedTickets');

const officerSelect = document.getElementById('officerSelect');
const addLocationForm = document.getElementById('addLocationForm');
const addOfficerForm = document.getElementById('addOfficerForm');

// Helper: safely extract array from API response
const getArray = (res) => {
  if (!res || !Array.isArray(res.data)) return [];
  return res.data;
};

// Fetch dashboard data and populate tables
const fetchDashboardData = async () => {
  try {
    const [offRes, locRes, tickRes, auditRes] = await Promise.all([
      fetch('/api/admin/officers', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/admin/locations', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/admin/tickets', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/admin/audit', { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    if (![offRes, locRes, tickRes, auditRes].every(r => r.ok)) {
      throw new Error('One or more admin endpoints failed');
    }

    const officers = getArray(await offRes.json());
    const locations = getArray(await locRes.json());
    const tickets = getArray(await tickRes.json());
    const audits = getArray(await auditRes.json());

    // Stats
    totalOfficersEl.textContent = officers.length;
    totalLocationsEl.textContent = locations.length;
    openTicketsEl.textContent = tickets.filter(t => t.status !== 'CLOSED').length;
    closedTicketsEl.textContent = tickets.filter(t => t.status === 'CLOSED').length;

    // Officers table
    officersTableBody.innerHTML = '';
    officerSelect.innerHTML = '<option value="">Select Officer</option>';
    officers.forEach(off => {
      officerSelect.innerHTML += `<option value="${off.id}">${off.fullName}</option>`;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${off.id}</td>
        <td>${off.fullName}</td>
        <td>${off.email}</td>
        <td>-</td>
      `;
      officersTableBody.appendChild(tr);
    });

    // Locations table
    locationsTableBody.innerHTML = '';
    locations.forEach(loc => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${loc.id}</td>
        <td>${loc.name}</td>
        <td>${loc.building || '-'}</td>
        <td>${loc.officerName || '-'}</td>
      `;
      locationsTableBody.appendChild(tr);
    });

    // Tickets table
    ticketsTableBody.innerHTML = '';
    tickets.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.id}</td>
        <td>${t.title}</td>
        <td>${t.status}</td>
        <td>${t.userName || '-'}</td>
        <td>${t.locationName || '-'}</td>
        <td>${t.assignedOfficerName || '-'}</td>
        <td>${t.openedAt ? new Date(t.openedAt).toLocaleString() : '-'}</td>
        <td>${t.closedAt ? new Date(t.closedAt).toLocaleString() : '-'}</td>
      `;
      ticketsTableBody.appendChild(tr);
    });

    // Audit logs
    auditTableBody.innerHTML = '';
    audits.forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a.id}</td>
        <td>${a.userName}</td>
        <td>${a.action}</td>
        <td>${a.entity}</td>
        <td>${a.entityId}</td>
        <td>${a.createdAt ? new Date(a.createdAt).toLocaleString() : '-'}</td>
      `;
      auditTableBody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    alert('Failed to load admin dashboard data');
  }
};

// -------------------- ADD LOCATION --------------------
if (addLocationForm) {
  addLocationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('locationName').value.trim();
    const building = document.getElementById('building').value.trim();
    const officerId = officerSelect.value;

    if (!name || !officerId) {
      return alert('Please fill in all required fields.');
    }

    try {
      const res = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, building, officerId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add location');

      alert('Location added successfully');
      addLocationForm.reset();
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });
}

// -------------------- ADD OFFICER --------------------
if (addOfficerForm) {
  addOfficerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!fullName || !email || !password) {
      return alert('All fields are required.');
    }

    try {
      const res = await fetch('/api/admin/officers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add officer');

      alert('Officer added successfully');
      addOfficerForm.reset();
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });
}

// Panel navigation
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(btn.dataset.panel).classList.add('active');
  });
});

// Initial fetch
fetchDashboardData();
