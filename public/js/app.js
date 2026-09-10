/**
 * Application Entry Point & Navigation Controller
 */

const App = {
  init() {
    // Apply initial theme
    document.documentElement.setAttribute('data-theme', state.theme);

    // Subscribe to state changes to re-render views automatically
    state.subscribe((currentState) => {
      this.renderApp(currentState);
    });

    // Initial render
    this.renderApp(state);
  },

  renderApp(currentState) {
    const navContainer = document.getElementById('navbar-container');
    const container = document.getElementById('view-container');

    if (!currentState.currentUser) {
      if (navContainer) navContainer.style.display = 'none';
      AuthView.render(container);
      return;
    }

    if (navContainer) navContainer.style.display = 'flex';
    this.renderNavbar(currentState);

    // Route to appropriate view
    container.className = 'view-container';
    switch (currentState.activeTab) {
      case 'dashboard':
        if (currentState.currentUser.role === 'librarian') {
          LibrarianView.render(container);
        } else {
          StudentPortalView.render(container);
        }
        break;
      case 'my-portal':
        StudentPortalView.render(container);
        break;
      case 'books':
        BooksView.render(container);
        break;
      case 'students':
        if (currentState.currentUser.role === 'librarian') {
          StudentsView.render(container);
        } else {
          StudentPortalView.render(container);
        }
        break;
      case 'issues':
        if (currentState.currentUser.role === 'librarian') {
          IssuesView.render(container);
        } else {
          StudentPortalView.render(container);
        }
        break;
      case 'smart-search':
        SmartSearchView.render(container);
        break;
      default:
        if (currentState.currentUser.role === 'librarian') {
          LibrarianView.render(container);
        } else {
          StudentPortalView.render(container);
        }
    }
  },

  renderNavbar(currentState) {
    const user = currentState.currentUser;
    const isLibrarian = user && user.role === 'librarian';

    const navLinksContainer = document.getElementById('nav-links-container');
    const userProfileContainer = document.getElementById('nav-user-container');

    // Render Navigation Links based on role
    if (isLibrarian) {
      navLinksContainer.innerHTML = `
        <li>
          <button class="nav-link-btn ${currentState.activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
            <span>📊</span> <span class="nav-text">Dashboard</span>
          </button>
        </li>
        <li>
          <button class="nav-link-btn ${currentState.activeTab === 'books' ? 'active' : ''}" data-tab="books">
            <span>📚</span> <span class="nav-text">Books</span>
          </button>
        </li>
        <li>
          <button class="nav-link-btn ${currentState.activeTab === 'students' ? 'active' : ''}" data-tab="students">
            <span>👥</span> <span class="nav-text">Students</span>
          </button>
        </li>
        <li>
          <button class="nav-link-btn ${currentState.activeTab === 'issues' ? 'active' : ''}" data-tab="issues">
            <span>🔄</span> <span class="nav-text">Circulation</span>
          </button>
        </li>
        <li>
          <button class="nav-link-btn ${currentState.activeTab === 'smart-search' ? 'active' : ''}" data-tab="smart-search">
            <span>✨</span> <span class="nav-text">AI Search</span>
          </button>
        </li>
      `;
    } else {
      navLinksContainer.innerHTML = `
        <li>
          <button class="nav-link-btn ${currentState.activeTab === 'my-portal' ? 'active' : ''}" data-tab="my-portal">
            <span>👤</span> <span class="nav-text">My Loans</span>
          </button>
        </li>
        <li>
          <button class="nav-link-btn ${currentState.activeTab === 'books' ? 'active' : ''}" data-tab="books">
            <span>📚</span> <span class="nav-text">Books</span>
          </button>
        </li>
        <li>
          <button class="nav-link-btn ${currentState.activeTab === 'smart-search' ? 'active' : ''}" data-tab="smart-search">
            <span>✨</span> <span class="nav-text">AI Search</span>
          </button>
        </li>
      `;
    }

    // Attach click listeners to nav buttons
    navLinksContainer.querySelectorAll('.nav-link-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.setTab(btn.dataset.tab);
      });
    });

    // Render User Badge & Actions
    userProfileContainer.innerHTML = `
      <button id="theme-toggle" class="theme-toggle-btn" title="Toggle Light/Dark Theme">
        ${state.theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div class="user-profile-badge">
        <div class="user-avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
        <div class="user-info">
          <span class="user-name" title="${user.name || user.email}">${user.name || user.email}</span>
          <span class="user-role-tag">${user.role === 'librarian' ? 'Admin' : `${user.department || 'Student'}`}</span>
        </div>
        <button id="btn-logout" class="btn btn-secondary btn-sm" title="Sign out of system">
          Exit
        </button>
      </div>
    `;

    // Theme toggle event
    document.getElementById('theme-toggle').addEventListener('click', () => {
      state.toggleTheme();
    });

    // Logout event
    document.getElementById('btn-logout').addEventListener('click', () => {
      state.setUser(null);
      Toast.info('Signed out of system.');
    });
  }
};

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
