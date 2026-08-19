// Authenticate
AuthHelper.requireAuth('ADMIN');

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  AuthHelper.logout();
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
  if (!res) return [];
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res)) return res;
  return [];
};

// Fetch dashboard data and populate tables
const fetchDashboardData = async () => {
  try {
    const [offRes, locRes, tickRes, auditRes] = await Promise.all([
      AuthHelper.fetchWithAuth('/api/admin/officers'),
      AuthHelper.fetchWithAuth('/api/admin/locations'),
      AuthHelper.fetchWithAuth('/api/admin/tickets'),
      AuthHelper.fetchWithAuth('/api/admin/audit'),
    ]);

    if (!offRes || !locRes || !tickRes || !auditRes) {
      // If any is null, AuthHelper handled redirect/session expiry
      return;
    }

    if (![offRes, locRes, tickRes, auditRes].every(r => r.ok)) {
      throw new Error('One or more admin endpoints failed to load');
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
    
    if (officers.length === 0) {
      officersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888;">No officers registered yet</td></tr>';
    } else {
      officers.forEach(off => {
        const offName = off.fullName || off.full_name || 'Officer';
        officerSelect.innerHTML += `<option value="${off.id}">${offName}</option>`;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${off.id}</td>
          <td>${offName}</td>
          <td>${off.email}</td>
          <td>Active</td>
        `;
        officersTableBody.appendChild(tr);
      });
    }

    // Locations table
    locationsTableBody.innerHTML = '';
    if (locations.length === 0) {
      locationsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888;">No locations added yet</td></tr>';
    } else {
      locations.forEach(loc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${loc.id}</td>
          <td>${loc.name}</td>
          <td>${loc.building || '-'}</td>
          <td>${loc.officerName || loc.officer_name || '-'}</td>
        `;
        locationsTableBody.appendChild(tr);
      });
    }

    // Tickets table
    ticketsTableBody.innerHTML = '';
    if (tickets.length === 0) {
      ticketsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #888;">No tickets created yet</td></tr>';
    } else {
      tickets.forEach(t => {
        const tr = document.createElement('tr');
        const statusClass = (t.status || '').toLowerCase().replace('_', '-');
        const opened = t.openedAt || t.opened_at || t.created_at;
        const closed = t.closedAt || t.closed_at;

        tr.innerHTML = `
          <td>${t.id}</td>
          <td>${t.category_name || t.title}</td>
          <td><span class="status-badge ${statusClass}">${t.status}</span></td>
          <td>${t.userName || t.user_full_name || '-'}</td>
          <td>${t.locationName || t.location_name || '-'}</td>
          <td>${t.assignedOfficerName || t.officer_full_name || '-'}</td>
          <td>${opened ? new Date(opened).toLocaleString() : '-'}</td>
          <td>${closed ? new Date(closed).toLocaleString() : '-'}</td>
        `;
        ticketsTableBody.appendChild(tr);
      });
    }

    // Audit logs
    auditTableBody.innerHTML = '';
    if (audits.length === 0) {
      auditTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #888;">No audit logs recorded yet</td></tr>';
    } else {
      audits.forEach(a => {
        const tr = document.createElement('tr');
        const time = a.createdAt || a.created_at;
        tr.innerHTML = `
          <td>${a.id}</td>
          <td>${a.userName || a.user || '-'}</td>
          <td><strong>${a.action}</strong></td>
          <td>${a.entity}</td>
          <td>${a.entityId || a.entity_id || '-'}</td>
          <td>${time ? new Date(time).toLocaleString() : '-'}</td>
        `;
        auditTableBody.appendChild(tr);
      });
    }

  } catch (err) {
    console.error(err);
    showToast('Failed to load dashboard data: ' + err.message, 'error');
  }
};

// -------------------- ADD LOCATION --------------------
if (addLocationForm) {
  addLocationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('locationName');
    const buildingInput = document.getElementById('building');
    const name = nameInput.value.trim();
    const building = buildingInput.value.trim();
    const officerId = officerSelect.value;

    if (!name || !officerId) {
      return showToast('Please fill in all required fields.', 'warning');
    }

    try {
      const res = await AuthHelper.fetchWithAuth('/api/admin/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, building, officerId })
      });

      if (!res) return;

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add location');

      showToast('Location added successfully', 'success');
      addLocationForm.reset();
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to add location', 'error');
    }
  });
}

// -------------------- ADD OFFICER --------------------
if (addOfficerForm) {
  addOfficerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!fullName || !email || !password) {
      return showToast('All fields are required.', 'warning');
    }

    try {
      const res = await AuthHelper.fetchWithAuth('/api/admin/officers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullName, email, password })
      });

      if (!res) return;

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add officer');

      showToast('Officer added successfully', 'success');
      addOfficerForm.reset();
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to add officer', 'error');
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

