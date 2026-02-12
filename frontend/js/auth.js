document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const errorEl = document.getElementById('login-error');
  errorEl.textContent = 'Authenticating…';

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value
      }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      errorEl.textContent = 'Invalid server response';
      return;
    }

    if (!res.ok) {
      errorEl.textContent = data.message || 'Login failed';
      passwordInput.value = '';
      return;
    }

    // ✅ Correct response path
    const token = data.data.token;
    const user = data.data.user;
    const role = user.role;

    localStorage.setItem('token', token);

    // ✅ Role-based redirect
    if (role === 'ADMIN') {
      window.location.href = 'admin-dashboard.html';
    } else if (role === 'OFFICER') {
      window.location.href = 'officer-dashboard.html';
    } else {
      window.location.href = 'staff-dashboard.html';
    }

  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Cannot reach server';
  }
});
