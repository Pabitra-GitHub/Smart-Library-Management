/**
 * API Client Layer
 * Handles communication with the backend REST endpoints.
 */

const API = {
  baseUrl: '/api',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  },

  // Auth
  register(accountData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(accountData)
    });
  },

  login(identifier, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
  },

  getAuthStatus() {
    return this.request('/auth/status');
  },

  // Books
  getBooks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/books${query ? `?${query}` : ''}`);
  },

  getBookById(id) {
    return this.request(`/books/${id}`);
  },

  getCategories() {
    return this.request('/books/categories');
  },

  createBook(bookData) {
    return this.request('/books', {
      method: 'POST',
      body: JSON.stringify(bookData)
    });
  },

  updateBook(id, bookData) {
    return this.request(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData)
    });
  },

  deleteBook(id, performedBy) {
    return this.request(`/books/${id}?performedBy=${encodeURIComponent(performedBy || 'Librarian')}`, {
      method: 'DELETE'
    });
  },

  // Students
  getStudents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/students${query ? `?${query}` : ''}`);
  },

  getStudentById(id) {
    return this.request(`/students/${id}`);
  },

  createStudent(studentData) {
    return this.request('/students', {
      method: 'POST',
      body: JSON.stringify(studentData)
    });
  },

  updateStudent(id, studentData) {
    return this.request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData)
    });
  },

  deleteStudent(id, performedBy) {
    return this.request(`/students/${id}?performedBy=${encodeURIComponent(performedBy || 'Librarian')}`, {
      method: 'DELETE'
    });
  },

  // Issues & Returns
  getIssues(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/issues${query ? `?${query}` : ''}`);
  },

  issueBook(issueData) {
    return this.request('/issues', {
      method: 'POST',
      body: JSON.stringify(issueData)
    });
  },

  returnBook(issueId, returnData) {
    return this.request(`/issues/${issueId}/return`, {
      method: 'POST',
      body: JSON.stringify(returnData)
    });
  },

  updateFineStatus(issueId, finePaid) {
    return this.request(`/issues/${issueId}/fine`, {
      method: 'PATCH',
      body: JSON.stringify({ finePaid })
    });
  },

  // AI Smart Search
  smartSearch(query) {
    return this.request('/ai/smart-search', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  },

  getAISuggestions() {
    return this.request('/ai/suggestions');
  },

  // Dashboards & Stats
  getLibrarianStats() {
    return this.request('/stats/librarian');
  },

  getStudentStats(studentId) {
    return this.request(`/stats/student/${studentId}`);
  },

  getSettings() {
    return this.request('/settings');
  },

  updateSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  resetDemoData() {
    return this.request('/settings/reset', {
      method: 'POST'
    });
  }
};
