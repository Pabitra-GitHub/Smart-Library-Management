/**
 * Global Client Application State Management
 */

class AppState {
  constructor() {
    // Restore session if available
    const savedUser = localStorage.getItem('library_user');
    this.currentUser = null;
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (err) {
        console.warn('Discarding invalid saved library session:', err);
        localStorage.removeItem('library_user');
      }
    }
    this.activeTab = this.currentUser ? (this.currentUser.role === 'librarian' ? 'dashboard' : 'my-portal') : 'login';
    this.theme = localStorage.getItem('library_theme') || 'dark';
    this.listeners = [];
  }

  setUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('library_user', JSON.stringify(user));
      this.activeTab = user.role === 'librarian' ? 'dashboard' : 'my-portal';
    } else {
      localStorage.removeItem('library_user');
      this.activeTab = 'login';
    }
    this.notify();
  }

  setTab(tabName) {
    this.activeTab = tabName;
    this.notify();
  }

  setTheme(newTheme) {
    this.theme = newTheme;
    localStorage.setItem('library_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    this.notify();
  }

  toggleTheme() {
    this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (err) {
        console.error('State listener error:', err);
      }
    }
  }
}

const state = new AppState();
