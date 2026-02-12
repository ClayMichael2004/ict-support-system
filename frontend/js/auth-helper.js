const AuthHelper = {
  // Get token
  getToken() {
    return localStorage.getItem('token');
  },

  // Save token
  setToken(token) {
    localStorage.setItem('token', token);
  },

  // Clear token
  clearToken() {
    localStorage.removeItem('token');
  },

  // Check if token exists and is valid format
  hasValidToken() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT without verification (just to check structure)
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      const payload = JSON.parse(atob(parts[1]));
      
      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.log('Token expired, clearing...');
        this.clearToken();
        return false;
      }

      return true;
    } catch (e) {
      console.log('Invalid token format, clearing...');
      this.clearToken();
      return false;
    }
  },

  // Get user info from token
  getUserFromToken() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id,
        role: payload.role,
        email: payload.email
      };
    } catch (e) {
      return null;
    }
  },

  // Redirect to login if not authenticated
  requireAuth(redirectUrl = 'login.html') {
    if (!this.hasValidToken()) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  },

  // Logout and redirect
  logout(redirectUrl = 'login.html') {
    this.clearToken();
    window.location.href = redirectUrl;
  },

  // Make authenticated API request
  async fetchWithAuth(url, options = {}) {
    if (!this.hasValidToken()) {
      this.logout();
      return;
    }

    const token = this.getToken();
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    try {
      const response = await fetch(url, { ...options, headers });

      // If 401, token is invalid - logout
      if (response.status === 401) {
        console.log('Authentication failed, logging out...');
        this.logout();
        return;
      }

      // If 403, it's a permissions issue (not auth issue)
      if (response.status === 403) {
        const error = await response.json();
        throw new Error(error.message || 'Access forbidden');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Make it available globally
window.AuthHelper = AuthHelper;
