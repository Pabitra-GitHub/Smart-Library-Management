/**
 * Books Catalog & Management View
 * Implements PRD Section 6.2 (Book Management) & Section 6.8 (Normal Book Search)
 */

const BooksView = {
  currentFilterCategory: 'All',
  searchQuery: '',
  availableOnly: false,
  viewMode: 'grid', // 'grid' or 'table'

  async render(container) {
    const isLibrarian = state.currentUser && state.currentUser.role === 'librarian';

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em;">Book Catalog & Repository</h1>
          <p style="color: var(--text-secondary); font-size: 0.92rem;">Search, explore, and manage the collegiate technical library collection</p>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          ${isLibrarian ? `
            <button id="btn-add-new-book" class="btn btn-primary">
              <span>+</span> Add New Book
            </button>
          ` : ''}
          <button id="btn-toggle-view" class="btn btn-secondary btn-icon" title="${this.viewMode === 'grid' ? 'Switch to Table View' : 'Switch to Grid View'}">
            <span id="view-mode-icon">${this.viewMode === 'grid' ? '⊞' : '≡'}</span>
          </button>
        </div>
      </div>

      <!-- Unified Apple-Style Glass Search & Filters Toolbar -->
      <div class="glass-toolbar">
        <div class="glass-toolbar-row">
          <div class="search-bar-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" id="book-search-input" class="form-control search-input" placeholder="Search by title, author, ISBN, or shelf (e.g. Python, Silberschatz, A-12)..." value="${UI.attr(this.searchQuery)}" />
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
            <label style="display: flex; align-items: center; gap: 0.45rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; color: var(--text-secondary);">
              <input type="checkbox" id="filter-available-only" ${this.availableOnly ? 'checked' : ''} />
              Available on Shelf Only
            </label>
          </div>
        </div>

        <!-- Category Filter Chips Bar -->
        <div id="book-categories-chips" class="chips-container" style="padding-top: 0.25rem; border-top: 1px solid var(--border-color);">
          <span class="chip ${this.currentFilterCategory === 'All' ? 'active' : ''}" data-category="All">All Categories</span>
        </div>
      </div>

      <!-- Books Content List / Grid -->
      <div id="books-content-area">
        <div class="skeleton" style="height: 350px;"></div>
      </div>
    `;

    // Load categories
    this.loadCategories();
    // Load books
    this.fetchAndRenderBooks();

    // Event listeners
    const searchInput = document.getElementById('book-search-input');
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.searchQuery = e.target.value.trim();
        this.fetchAndRenderBooks();
      }, 250);
    });

    document.getElementById('filter-available-only').addEventListener('change', (e) => {
      this.availableOnly = e.target.checked;
      this.fetchAndRenderBooks();
    });

    document.getElementById('btn-toggle-view').addEventListener('click', () => {
      this.viewMode = this.viewMode === 'grid' ? 'table' : 'grid';
      const icon = document.getElementById('view-mode-icon');
      const btn = document.getElementById('btn-toggle-view');
      if (icon) icon.textContent = this.viewMode === 'grid' ? '⊞' : '≡';
      if (btn) btn.title = this.viewMode === 'grid' ? 'Switch to Table View' : 'Switch to Grid View';
      this.fetchAndRenderBooks();
    });

    if (isLibrarian) {
      document.getElementById('btn-add-new-book').addEventListener('click', () => {
        this.openAddBookModal();
      });
    }
  },

  async loadCategories() {
    try {
      const res = await API.getCategories();
      const container = document.getElementById('book-categories-chips');
      if (!container) return;

      const categories = ['All', ...(res.categories || [])];
      container.innerHTML = categories.map(cat => `
        <span class="chip ${this.currentFilterCategory === cat ? 'active' : ''}" data-category="${UI.attr(cat)}">
          ${UI.escape(cat)}
        </span>
      `).join('');

      container.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
          container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.currentFilterCategory = chip.dataset.category;
          this.fetchAndRenderBooks();
        });
      });
    } catch (e) {
      console.warn('Could not load categories:', e);
    }
  },

  async fetchAndRenderBooks() {
    const contentArea = document.getElementById('books-content-area');
    if (!contentArea) return;

    try {
      const res = await API.getBooks({
        search: this.searchQuery,
        category: this.currentFilterCategory,
        availableOnly: this.availableOnly
      });

      const books = res.books || [];
      const isLibrarian = state.currentUser && state.currentUser.role === 'librarian';

      if (books.length === 0) {
        const isSearch = this.searchQuery || this.currentFilterCategory !== 'All' || this.availableOnly;
        contentArea.innerHTML = `
          <div class="card" style="text-align: center; padding: 3.5rem 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📚</div>
            <h3 style="font-size: 1.25rem; font-weight: 700;">${isSearch ? 'No matching books found' : 'Library Catalog is Clean & Empty'}</h3>
            <p style="color: var(--text-muted); margin-top: 0.4rem; max-width: 440px; margin-left: auto; margin-right: auto;">
              ${isSearch
                ? 'Try adjusting your search terms, clearing category filters, or explore with AI Smart Search.'
                : 'No books have been added yet. Add books to start tracking inventory and circulation.'}
            </p>
            <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.25rem;">
              ${isLibrarian ? `
                <button class="btn btn-primary btn-sm" onclick="BooksView.openAddBookModal()">
                  + Add First Book
                </button>
              ` : ''}
              <button class="btn btn-secondary btn-sm" onclick="state.setTab('smart-search')">
                Explore AI Smart Search →
              </button>
            </div>
          </div>
        `;
        return;
      }

      if (this.viewMode === 'grid') {
        contentArea.innerHTML = `
          <div class="books-grid">
            ${books.map(b => {
              const isAvailable = b.availableCopies > 0;
              const bookId = UI.escape(b.id);
              const bookIdArg = UI.eventArg(b.id);
              const bookTitle = UI.escape(b.title);
              const bookTitleArg = UI.eventArg(b.title);
              const category = UI.escape(b.category || 'General');
              const author = UI.escape(b.author || 'Unknown author');
              const description = UI.escape(b.description || 'Core technical engineering textbook.');
              const shelfNumber = UI.escape(b.shelfNumber || '-');
              const isbn = UI.escape(b.isbn || '-');
              const availabilityBadge = isAvailable
                ? `<span class="badge badge-success">${b.availableCopies} of ${b.totalCopies} Available</span>`
                : `<span class="badge badge-danger">All Copies Issued</span>`;

              return `
                <div class="book-card">
                  <div>
                    <div class="book-header">
                      <span class="badge badge-category">${category}</span>
                      <span class="book-id-badge">${bookId}</span>
                    </div>

                    <h3 class="book-title" style="margin-top: 0.6rem;">${bookTitle}</h3>
                    <p class="book-author">By <strong>${author}</strong> (${UI.escape(b.publicationYear || '-')})</p>
                    
                    <p class="book-description" style="margin-top: 0.6rem;">
                      ${description}
                    </p>
                  </div>

                  <div>
                    <div class="book-meta-grid">
                      <div class="meta-item">
                        <span class="meta-label">Shelf Location</span>
                        <span class="meta-val">📍 ${shelfNumber}</span>
                      </div>
                      <div class="meta-item">
                        <span class="meta-label">ISBN</span>
                        <span class="meta-val" style="font-size: 0.72rem; font-family: var(--font-mono);">${isbn}</span>
                      </div>
                    </div>

                    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
                      ${availabilityBadge}

                      <div style="display: flex; gap: 0.35rem;">
                        ${isLibrarian ? `
                          ${isAvailable ? `
                            <button class="btn btn-primary btn-sm" onclick="IssuesView.openIssueModal('${bookIdArg}')" title="Issue this book to a student">
                              Issue
                            </button>
                          ` : ''}
                          <button class="btn btn-secondary btn-sm" onclick="BooksView.openEditBookModal('${bookIdArg}')" title="Edit book details">
                            Edit
                          </button>
                          <button class="btn btn-secondary btn-sm" style="color: var(--danger);" onclick="BooksView.deleteBookPrompt('${b.id}', '${b.title.replace(/'/g, "\\'")}')" title="Delete book">
                            ✕
                          </button>
                        ` : `
                          <button class="btn btn-secondary btn-sm" onclick="BooksView.viewBookDetail('${bookIdArg}')">
                            Details
                          </button>
                        `}
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else {
        // Table view
        contentArea.innerHTML = `
          <div class="table-container">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title & Author</th>
                  <th>Category</th>
                  <th>Shelf</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${books.map(b => `
                  <tr>
                    <td><span class="book-id-badge">${b.id}</span></td>
                    <td>
                      <span class="table-cell-title">${b.title}</span>
                      <span class="table-cell-sub">${b.author} • ${b.isbn}</span>
                    </td>
                    <td><span class="badge badge-category">${b.category}</span></td>
                    <td><strong>${b.shelfNumber}</strong></td>
                    <td>
                      ${b.availableCopies > 0
                        ? `<span class="badge badge-success">${b.availableCopies}/${b.totalCopies} Available</span>`
                        : `<span class="badge badge-danger">Issued Out</span>`}
                    </td>
                    <td>
                      <div style="display: flex; gap: 0.35rem;">
                        ${isLibrarian ? `
                          ${b.availableCopies > 0 ? `
                            <button class="btn btn-primary btn-sm" onclick="IssuesView.openIssueModal('${b.id}')">Issue</button>
                          ` : ''}
                          <button class="btn btn-secondary btn-sm" onclick="BooksView.openEditBookModal('${b.id}')">Edit</button>
                          <button class="btn btn-secondary btn-sm" style="color: var(--danger);" onclick="BooksView.deleteBookPrompt('${b.id}', '${b.title.replace(/'/g, "\\'")}')">✕</button>
                        ` : `
                          <button class="btn btn-secondary btn-sm" onclick="BooksView.viewBookDetail('${b.id}')">Details</button>
                        `}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (err) {
      contentArea.innerHTML = `<p style="color: var(--danger); padding: 1.5rem;">Error loading books: ${UI.escape(err.message)}</p>`;
    }
  },

  openAddBookModal() {
    const modal = document.getElementById('book-dialog');
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">+ Add New Book to Catalog</h3>
        <button type="button" class="btn btn-secondary btn-icon" onclick="Modal.close('book-dialog')">✕</button>
      </div>
      <div class="modal-body">
        <form id="add-book-form">
          <div class="form-group">
            <label class="form-label">Book Title *</label>
            <input type="text" id="new-book-title" class="form-control" placeholder="e.g. Python Crash Course" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Author(s) *</label>
              <input type="text" id="new-book-author" class="form-control" placeholder="e.g. Eric Matthes" required />
            </div>
            <div class="form-group">
              <label class="form-label">Category *</label>
              <select id="new-book-category" class="form-control" required>
                <option value="Programming">Programming</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Core Engineering">Core Engineering</option>
                <option value="Web Development">Web Development</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Mathematics">Mathematics</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Total Copies *</label>
              <input type="number" id="new-book-copies" class="form-control" value="5" min="1" required />
            </div>
            <div class="form-group">
              <label class="form-label">Shelf Number *</label>
              <input type="text" id="new-book-shelf" class="form-control" placeholder="e.g. A-12" required />
            </div>
            <div class="form-group">
              <label class="form-label">Target Level</label>
              <select id="new-book-level" class="form-control">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate" selected>Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">ISBN</label>
              <input type="text" id="new-book-isbn" class="form-control" placeholder="e.g. 978-1593279288" />
            </div>
            <div class="form-group">
              <label class="form-label">Pub Year</label>
              <input type="number" id="new-book-year" class="form-control" value="2024" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Publisher</label>
            <input type="text" id="new-book-publisher" class="form-control" placeholder="e.g. O'Reilly Media / MIT Press" />
          </div>

          <div class="form-group">
            <label class="form-label">Tags / Keywords (comma separated)</label>
            <input type="text" id="new-book-tags" class="form-control" placeholder="e.g. python, programming, beginner, web" />
          </div>

          <div class="form-group">
            <label class="form-label">Brief Description</label>
            <textarea id="new-book-desc" class="form-control" rows="3" placeholder="Summary of book contents and educational topics covered..."></textarea>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="Modal.close('book-dialog')">Cancel</button>
        <button type="button" id="btn-save-new-book" class="btn btn-primary">Save to Catalog</button>
      </div>
    `;

    Modal.open('book-dialog');

    document.getElementById('btn-save-new-book').addEventListener('click', async () => {
      const title = document.getElementById('new-book-title').value.trim();
      const author = document.getElementById('new-book-author').value.trim();
      const category = document.getElementById('new-book-category').value;
      const totalCopies = document.getElementById('new-book-copies').value;
      const shelfNumber = document.getElementById('new-book-shelf').value.trim();
      const level = document.getElementById('new-book-level').value;
      const isbn = document.getElementById('new-book-isbn').value.trim();
      const publicationYear = document.getElementById('new-book-year').value;
      const publisher = document.getElementById('new-book-publisher').value.trim();
      const tags = document.getElementById('new-book-tags').value;
      const description = document.getElementById('new-book-desc').value.trim();

      if (!title || !author || !totalCopies || !shelfNumber) {
        Toast.error('Please fill in all required fields marked with *');
        return;
      }

      try {
        const res = await API.createBook({
          title, author, category, totalCopies, shelfNumber, level,
          isbn, publicationYear, publisher, tags, description,
          performedBy: state.currentUser ? state.currentUser.name : 'Librarian'
        });
        Toast.success(res.message);
        Modal.close('book-dialog');
        BooksView.fetchAndRenderBooks();
        BooksView.loadCategories();
      } catch (err) {
        Toast.error(err.message);
      }
    });
  },

  async openEditBookModal(bookId) {
    let book;
    try {
      const res = await API.getBookById(bookId);
      book = res.book;
    } catch (e) {
      Toast.error('Failed to load book details');
      return;
    }

    const modal = document.getElementById('book-dialog');
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">✏ Edit Book Details (${book.id})</h3>
        <button type="button" class="btn btn-secondary btn-icon" onclick="Modal.close('book-dialog')">✕</button>
      </div>
      <div class="modal-body">
        <form id="edit-book-form">
          <div class="form-group">
            <label class="form-label">Book Title *</label>
            <input type="text" id="edit-book-title" class="form-control" value="${book.title}" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Author(s) *</label>
              <input type="text" id="edit-book-author" class="form-control" value="${book.author}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Category *</label>
              <input type="text" id="edit-book-category" class="form-control" value="${book.category}" required />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Total Copies *</label>
              <input type="number" id="edit-book-copies" class="form-control" value="${book.totalCopies}" min="1" required />
            </div>
            <div class="form-group">
              <label class="form-label">Shelf Number *</label>
              <input type="text" id="edit-book-shelf" class="form-control" value="${book.shelfNumber}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Level</label>
              <select id="edit-book-level" class="form-control">
                <option value="Beginner" ${book.level === 'Beginner' ? 'selected' : ''}>Beginner</option>
                <option value="Intermediate" ${book.level === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                <option value="Advanced" ${book.level === 'Advanced' ? 'selected' : ''}>Advanced</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea id="edit-book-desc" class="form-control" rows="3">${book.description || ''}</textarea>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="Modal.close('book-dialog')">Cancel</button>
        <button type="button" id="btn-save-edit-book" class="btn btn-primary">Update Book</button>
      </div>
    `;

    Modal.open('book-dialog');

    document.getElementById('btn-save-edit-book').addEventListener('click', async () => {
      const updates = {
        title: document.getElementById('edit-book-title').value.trim(),
        author: document.getElementById('edit-book-author').value.trim(),
        category: document.getElementById('edit-book-category').value.trim(),
        totalCopies: document.getElementById('edit-book-copies').value,
        shelfNumber: document.getElementById('edit-book-shelf').value.trim(),
        level: document.getElementById('edit-book-level').value,
        description: document.getElementById('edit-book-desc').value.trim(),
        performedBy: state.currentUser ? state.currentUser.name : 'Librarian'
      };

      try {
        await API.updateBook(bookId, updates);
        Toast.success('Book updated successfully');
        Modal.close('book-dialog');
        BooksView.fetchAndRenderBooks();
      } catch (err) {
        Toast.error(err.message);
      }
    });
  },

  async deleteBookPrompt(bookId, bookTitle) {
    if (confirm(`Are you sure you want to delete "${bookTitle}" (${bookId}) from the library catalog?`)) {
      try {
        await API.deleteBook(bookId, state.currentUser ? state.currentUser.name : 'Librarian');
        Toast.success(`Book "${bookTitle}" was removed`);
        this.fetchAndRenderBooks();
      } catch (err) {
        Toast.error(err.message);
      }
    }
  },

  async viewBookDetail(bookId) {
    try {
      const res = await API.getBookById(bookId);
      const b = res.book;

      const modal = document.getElementById('book-dialog');
      modal.innerHTML = `
        <div class="modal-header">
          <h3 class="modal-title">${b.title}</h3>
          <button type="button" class="btn btn-secondary btn-icon" onclick="Modal.close('book-dialog')">✕</button>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">By <strong>${b.author}</strong> • ${b.publisher} (${b.publicationYear})</p>
          
          <div class="book-meta-grid" style="margin-bottom: 1.25rem;">
            <div class="meta-item">
              <span class="meta-label">Category</span>
              <span class="meta-val">${b.category}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Shelf Location</span>
              <span class="meta-val">📍 ${b.shelfNumber}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Available Copies</span>
              <span class="meta-val">${b.availableCopies} of ${b.totalCopies}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">ISBN</span>
              <span class="meta-val" style="font-family: var(--font-mono); font-size: 0.75rem;">${b.isbn}</span>
            </div>
          </div>

          <div style="margin-bottom: 1rem;">
            <strong style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase;">Description</strong>
            <p style="margin-top: 0.35rem; font-size: 0.9rem; line-height: 1.5; color: var(--text-primary);">${b.description || 'No description provided.'}</p>
          </div>

          <div>
            <strong style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase;">Tags / Topics</strong>
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.35rem;">
              ${(b.tags || []).map(t => `<span class="badge badge-neutral">${t}</span>`).join('')}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="Modal.close('book-dialog')">Close</button>
        </div>
      `;
      Modal.open('book-dialog');
    } catch (e) {
      Toast.error('Could not open book details');
    }
  }
};
