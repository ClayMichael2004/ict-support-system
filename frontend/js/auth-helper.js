const AuthHelper = {
  // Get cached user info
  getUser() {
    try {
      const user = sessionStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (_) {
      return null;
    }
  },

  // Set cached user info
  setUser(user) {
    if (user) {
      sessionStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('user');
    }
  },

  // Clear all auth storage
  clearAuth() {
    sessionStorage.removeItem('user');
    localStorage.removeItem('token'); // Clean up any legacy token
  },

  // Fetch current user from server
  async fetchCurrentUser() {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.data && data.data.user) {
        this.setUser(data.data.user);
        return data.data.user;
      }
      return null;
    } catch (_) {
      return null;
    }
  },

  // Redirect to login if not authenticated or role mismatch
  async requireAuth(expectedRoles = null, redirectUrl = 'login.html') {
    const user = await this.fetchCurrentUser();
    if (!user) {
      this.clearAuth();
      window.location.href = redirectUrl;
      return false;
    }

    if (expectedRoles) {
      const allowed = Array.isArray(expectedRoles)
        ? expectedRoles.map(r => r.toUpperCase())
        : [expectedRoles.toUpperCase()];
      const userRole = (user.role || '').toUpperCase();
      if (!allowed.includes(userRole)) {
        console.warn(`Role ${userRole} not authorized for this view.`);
        window.location.href = redirectUrl;
        return false;
      }
    }

    return true;
  },

  // Logout and redirect
  async logout(redirectUrl = 'login.html') {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      this.clearAuth();
      window.location.href = redirectUrl;
    }
  },

  // Make authenticated API request (browser automatically attaches httpOnly cookie)
  async fetchWithAuth(url, options = {}) {
    const fetchOptions = {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, fetchOptions);

      // If 401, token is invalid or expired - logout cleanly
      if (response.status === 401) {
        console.log('Session expired or unauthorized, redirecting to login...');
        await this.logout();
        return null;
      }

      // If 403, permissions issue
      if (response.status === 403) {
        let errMessage = 'Access forbidden';
        try {
          const errData = await response.json();
          errMessage = errData.message || errMessage;
        } catch (_) {}
        throw new Error(errMessage);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  // Clean Toast Notification System
  showToast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ'}</span>
      <div class="toast-content">${message}</div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    const removeToast = () => {
      toast.classList.add('toast-hide');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    };

    toast.querySelector('.toast-close').addEventListener('click', removeToast);

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(removeToast, duration);
    }

    return toast;
  }
};

// Global exports
window.AuthHelper = AuthHelper;
window.showToast = (msg, type, duration) => AuthHelper.showToast(msg, type, duration);
window.showNotification = (msg, type, duration) => AuthHelper.showToast(msg, type, duration);

