/**
 * Book Issue & Return Management View
 * Implements PRD Section 6.4 (Issue), 6.5 (Return), 6.6 (Due Date), 6.7 (Fine Calculation)
 */

const IssuesView = {
  currentStatusFilter: 'ACTIVE', // 'ACTIVE', 'OVERDUE', 'RETURNED', 'All'
  searchQuery: '',

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em;">Issue & Return Circulation</h1>
          <p style="color: var(--text-secondary); font-size: 0.92rem;">Track active borrowed books, automated 14-day due dates, and ₹5/day fine calculations</p>
        </div>
        <div>
          <button id="btn-open-issue-modal" class="btn btn-primary">
            <span>+</span> Issue Book to Student
          </button>
        </div>
      </div>

      <!-- Unified Apple-Style Glass Search & Filters Toolbar -->
      <div class="glass-toolbar">
        <div class="glass-toolbar-row">
          <div class="search-bar-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" id="issue-search-input" class="form-control search-input" placeholder="Search by student name, book title, or issue ID..." value="${this.searchQuery}" />
          </div>
          <div class="segmented-bar" id="issue-status-chips">
            <button type="button" class="chip segment-item ${this.currentStatusFilter === 'ACTIVE' ? 'active' : ''}" data-status="ACTIVE">Active Borrowed</button>
            <button type="button" class="chip segment-item ${this.currentStatusFilter === 'OVERDUE' ? 'active' : ''}" data-status="OVERDUE">Overdue Only ⏰</button>
            <button type="button" class="chip segment-item ${this.currentStatusFilter === 'RETURNED' ? 'active' : ''}" data-status="RETURNED">Returned History</button>
            <button type="button" class="chip segment-item ${this.currentStatusFilter === 'All' ? 'active' : ''}" data-status="All">All Transactions</button>
          </div>
        </div>
      </div>

      <!-- Issues Table Area -->
      <div id="issues-table-container">
        <div class="skeleton" style="height: 350px;"></div>
      </div>
    `;

    this.fetchAndRenderIssues();

    // Event listeners
    const searchInput = document.getElementById('issue-search-input');
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.searchQuery = e.target.value.trim();
        this.fetchAndRenderIssues();
      }, 250);
    });

    document.querySelectorAll('#issue-status-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#issue-status-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentStatusFilter = chip.dataset.status;
        this.fetchAndRenderIssues();
      });
    });

    document.getElementById('btn-open-issue-modal').addEventListener('click', () => {
      this.openIssueModal();
    });
  },

  async fetchAndRenderIssues() {
    const container = document.getElementById('issues-table-container');
    if (!container) return;

    try {
      const res = await API.getIssues({
        status: this.currentStatusFilter,
        search: this.searchQuery
      });

      const issues = res.issues || [];

      if (issues.length === 0) {
        const isSearch = this.searchQuery || this.currentStatusFilter !== 'ACTIVE';
        container.innerHTML = `
          <div class="card" style="text-align: center; padding: 3.5rem 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🔄</div>
            <h3 style="font-size: 1.25rem; font-weight: 700;">${isSearch ? 'No circulation records match filters' : 'No Active Borrowed Books'}</h3>
            <p style="color: var(--text-muted); margin-top: 0.4rem; max-width: 440px; margin-left: auto; margin-right: auto;">
              ${isSearch
                ? 'Try adjusting status filters or clearing the search query.'
                : 'All library books are currently resting on the shelves. Issue books to students to begin tracking 14-day circulation.'}
            </p>
            <button class="btn btn-primary btn-sm" style="margin-top: 1.25rem;" onclick="IssuesView.openIssueModal()">
              + Issue Book to Student
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Issue ID</th>
                <th>Book Title</th>
                <th>Student</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Fine Calculated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${issues.map(i => {
                const isReturned = !!i.returnDate;
                const statusBadge = isReturned
                  ? `<span class="badge badge-success">RETURNED</span>`
                  : (i.isOverdue
                    ? `<span class="badge badge-danger">OVERDUE (${i.overdueDays}d)</span>`
                    : `<span class="badge badge-info">ACTIVE</span>`);

                const fineAmount = isReturned ? i.fineAmount : i.calculatedFine;
                const fineBadge = fineAmount > 0
                  ? `<strong style="color: ${i.finePaid ? 'var(--success)' : 'var(--danger)'};">₹${fineAmount} (${i.finePaid ? 'Paid' : 'Unpaid'})</strong>`
                  : `<span style="color: var(--text-muted);">₹0</span>`;

                return `
                  <tr>
                    <td><strong style="font-family: var(--font-mono); font-size: 0.82rem;">${i.id}</strong></td>
                    <td>
                      <span class="table-cell-title">${i.bookTitle}</span>
                      <span class="table-cell-sub">ID: ${i.bookId}</span>
                    </td>
                    <td>
                      <span class="table-cell-title">${i.studentName}</span>
                      <span class="table-cell-sub">${i.studentId}</span>
                    </td>
                    <td>${new Date(i.issueDate).toLocaleDateString()}</td>
                    <td>
                      <strong>${new Date(i.dueDate).toLocaleDateString()}</strong>
                      ${!isReturned && i.isOverdue ? `<span style="color: var(--danger); font-size: 0.75rem; display: block;">+${i.overdueDays} days late</span>` : ''}
                    </td>
                    <td>${statusBadge}</td>
                    <td>${fineBadge}</td>
                    <td>
                      ${!isReturned ? `
                        <button class="btn btn-primary btn-sm" onclick="IssuesView.openReturnModal('${i.id}')">
                          Process Return
                        </button>
                      ` : `
                        <button class="btn btn-secondary btn-sm" onclick="IssuesView.viewIssueReceipt('${i.id}')">
                          Receipt
                        </button>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger); padding: 1.5rem;">Error loading issues: ${err.message}</p>`;
    }
  },

  async openIssueModal(preselectedBookId = null) {
    let books = [];
    let students = [];
    try {
      const [booksRes, studentsRes] = await Promise.all([
        API.getBooks({ availableOnly: true }),
        API.getStudents({ status: 'active' })
      ]);
      books = booksRes.books || [];
      students = studentsRes.students || [];
    } catch (e) {
      Toast.error('Could not load books or students');
      return;
    }

    if (students.length === 0) {
      Toast.warning('No registered students found in the library. Please register a student first.');
      return;
    }

    if (books.length === 0) {
      Toast.warning('No books currently have available copies to issue. Please add books to the catalog first.');
      return;
    }

    const modal = document.getElementById('issue-dialog');
    const todayStr = new Date().toLocaleDateString();
    const dueDateDefault = new Date();
    dueDateDefault.setDate(dueDateDefault.getDate() + 14);

    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">📖 Issue Book to Student</h3>
        <button type="button" class="btn btn-secondary btn-icon" onclick="Modal.close('issue-dialog')">✕</button>
      </div>
      <div class="modal-body">
        <form id="issue-book-form">
          <div class="form-group">
            <label class="form-label">Select Student *</label>
            <select id="issue-student-select" class="form-control" required>
              <option value="">-- Choose registered student --</option>
              ${students.map(s => `
                <option value="${s.id}">${s.name} (${s.id} • ${s.department} • Borrowed: ${s.activeLoansCount}/4)</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Select Book to Issue *</label>
            <select id="issue-book-select" class="form-control" required>
              <option value="">-- Choose available book --</option>
              ${books.map(b => `
                <option value="${b.id}" ${preselectedBookId === b.id ? 'selected' : ''}>
                  ${b.title} (${b.availableCopies} available on shelf ${b.shelfNumber})
                </option>
              `).join('')}
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: var(--bg-surface); padding: 0.9rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Issue Date</span>
              <strong style="display: block; font-size: 0.95rem;">${todayStr}</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Auto Due Date (14 Days)</span>
              <strong style="display: block; font-size: 0.95rem; color: var(--primary);">${dueDateDefault.toLocaleDateString()}</strong>
            </div>
          </div>

          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label">Optional Notes / Purpose</label>
            <input type="text" id="issue-notes" class="form-control" placeholder="e.g. Minor project reference, exam preparation..." />
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="Modal.close('issue-dialog')">Cancel</button>
        <button type="button" id="btn-submit-issue" class="btn btn-primary">Confirm Book Issue</button>
      </div>
    `;

    Modal.open('issue-dialog');

    document.getElementById('btn-submit-issue').addEventListener('click', async () => {
      const studentId = document.getElementById('issue-student-select').value;
      const bookId = document.getElementById('issue-book-select').value;
      const notes = document.getElementById('issue-notes').value.trim();

      if (!studentId || !bookId) {
        Toast.error('Please select both a student and a book');
        return;
      }

      try {
        const res = await API.issueBook({
          studentId,
          bookId,
          notes,
          performedBy: state.currentUser ? state.currentUser.name : 'Librarian'
        });
        Toast.success(res.message);
        Modal.close('issue-dialog');
        IssuesView.refreshActiveView();
      } catch (err) {
        Toast.error(err.message);
      }
    });
  },

  async openReturnModal(issueId) {
    let issue;
    try {
      const res = await API.getIssueById(issueId);
      issue = res.issue;
    } catch (e) {
      Toast.error('Failed to load transaction details');
      return;
    }

    const modal = document.getElementById('return-dialog');
    const today = new Date().toISOString().split('T')[0];

    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">📥 Accept Book Return</h3>
        <button type="button" class="btn btn-secondary btn-icon" onclick="Modal.close('return-dialog')">✕</button>
      </div>
      <div class="modal-body">
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1.25rem;">
          <h4 style="font-size: 1.05rem; font-weight: 700;">${issue.bookTitle}</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">
            Borrowed by: <strong>${issue.studentName}</strong> (${issue.studentId})
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.85rem;">
            <div>
              <span style="color: var(--text-muted);">Issue Date:</span> ${new Date(issue.issueDate).toLocaleDateString()}
            </div>
            <div>
              <span style="color: var(--text-muted);">Due Date:</span> <strong>${new Date(issue.dueDate).toLocaleDateString()}</strong>
            </div>
          </div>
        </div>

        <form id="return-form">
          <div class="form-group">
            <label class="form-label">Effective Return Date (for demo testing):</label>
            <input type="date" id="return-date-input" class="form-control" value="${today}" />
            <span style="font-size: 0.75rem; color: var(--text-muted);">
              Change this date to test live fine calculations for overdue returns!
            </span>
          </div>

          <!-- Fine Live Preview Box -->
          <div id="fine-calculation-box" style="margin-top: 1rem; padding: 1rem; border-radius: var(--radius-md); background: rgba(99, 102, 241, 0.08); border: 1px solid var(--border-glow);">
            <!-- Will be dynamically populated -->
          </div>

          <div id="fine-collected-container" class="form-group" style="margin-top: 1rem; display: none;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; cursor: pointer;">
              <input type="checkbox" id="check-fine-collected" checked />
              Mark fine as paid/collected at counter
            </label>
          </div>

          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label">Return Notes / Condition</label>
            <input type="text" id="return-notes" class="form-control" placeholder="e.g. Good condition, returned at main desk" />
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="Modal.close('return-dialog')">Cancel</button>
        <button type="button" id="btn-confirm-return" class="btn btn-primary">Complete Return</button>
      </div>
    `;

    Modal.open('return-dialog');

    // Function to calculate and update fine preview dynamically
    const updateFinePreview = () => {
      const selectedDate = new Date(document.getElementById('return-date-input').value);
      const dueDate = new Date(issue.dueDate);

      const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
      const returnMidnight = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();

      const diffMs = returnMidnight - dueMidnight;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const overdueDays = Math.max(0, diffDays);
      const fineAmount = overdueDays * (issue.fineRateApplied || 5);

      const box = document.getElementById('fine-calculation-box');
      const fineRow = document.getElementById('fine-collected-container');

      if (overdueDays > 0) {
        box.style.background = 'rgba(239, 68, 68, 0.12)';
        box.style.borderColor = 'var(--danger)';
        box.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: var(--danger); font-size: 0.95rem;">⚠️ Overdue Return</strong>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">
                ${overdueDays} day(s) late × ₹5/day standard rate
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.8rem; color: var(--text-muted);">Total Fine:</span>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--danger);">₹${fineAmount}</div>
            </div>
          </div>
        `;
        fineRow.style.display = 'block';
      } else {
        box.style.background = 'rgba(16, 185, 129, 0.1)';
        box.style.borderColor = 'var(--success)';
        box.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: var(--success); font-size: 0.95rem;">✓ On-Time Return</strong>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">
                Returned on or before due date (${new Date(issue.dueDate).toLocaleDateString()})
              </div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.8rem; color: var(--text-muted);">Fine Due:</span>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--success);">₹0</div>
            </div>
          </div>
        `;
        fineRow.style.display = 'none';
      }
    };

    updateFinePreview();
    document.getElementById('return-date-input').addEventListener('input', updateFinePreview);

    document.getElementById('btn-confirm-return').addEventListener('click', async () => {
      const returnDate = document.getElementById('return-date-input').value;
      const fineCollected = document.getElementById('check-fine-collected').checked;
      const notes = document.getElementById('return-notes').value.trim();

      try {
        const res = await API.returnBook(issueId, {
          returnDateOverride: returnDate ? new Date(returnDate).toISOString() : new Date().toISOString(),
          fineCollected,
          notes,
          performedBy: state.currentUser ? state.currentUser.name : 'Librarian'
        });
        Toast.success(res.message);
        Modal.close('return-dialog');
        IssuesView.refreshActiveView();
      } catch (err) {
        Toast.error(err.message);
      }
    });
  },

  refreshActiveView() {
    if (state.activeTab === 'dashboard') {
      LibrarianView.render(document.getElementById('view-container'));
    } else if (state.activeTab === 'books') {
      BooksView.fetchAndRenderBooks();
    } else if (state.activeTab === 'issues') {
      IssuesView.fetchAndRenderIssues();
    } else if (state.activeTab === 'my-portal') {
      StudentPortalView.render(document.getElementById('view-container'));
    }
  },

  async viewIssueReceipt(issueId) {
    try {
      const res = await API.getIssueById(issueId);
      const i = res.issue;

      const modal = document.getElementById('issue-dialog');
      modal.innerHTML = `
        <div class="modal-header">
          <h3 class="modal-title">🧾 Transaction Receipt (${i.id})</h3>
          <button type="button" class="btn btn-secondary btn-icon" onclick="Modal.close('issue-dialog')">✕</button>
        </div>
        <div class="modal-body" style="font-family: inherit;">
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <h4 style="font-size: 1.15rem; font-weight: 800;">AI SMART LIBRARY</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted);">Department of Computer Science & Engineering</p>
          </div>

          <div style="border-top: 1px dashed var(--border-color); border-bottom: 1px dashed var(--border-color); padding: 1rem 0; margin-bottom: 1rem; font-size: 0.88rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <div class="flex-between"><span>Book:</span><strong>${i.bookTitle}</strong></div>
            <div class="flex-between"><span>Student:</span><strong>${i.studentName} (${i.studentId})</strong></div>
            <div class="flex-between"><span>Issue Date:</span><span>${new Date(i.issueDate).toLocaleDateString()}</span></div>
            <div class="flex-between"><span>Due Date:</span><span>${new Date(i.dueDate).toLocaleDateString()}</span></div>
            <div class="flex-between"><span>Return Date:</span><strong>${i.returnDate ? new Date(i.returnDate).toLocaleDateString() : 'Active'}</strong></div>
            <div class="flex-between"><span>Late Days:</span><span>${i.overdueDays || 0}</span></div>
            <div class="flex-between"><span>Fine Incurred:</span><strong style="color: ${i.fineAmount > 0 ? 'var(--danger)' : 'inherit'};">₹${i.fineAmount || 0}</strong></div>
            <div class="flex-between"><span>Payment Status:</span><span class="badge ${i.finePaid ? 'badge-success' : 'badge-danger'}">${i.finePaid ? 'PAID' : 'PENDING'}</span></div>
          </div>

          <div style="text-align: center; font-size: 0.75rem; color: var(--text-muted);">
            Thank you for utilizing the digital library circulation system.
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="window.print()">🖨 Print Receipt</button>
          <button type="button" class="btn btn-primary" onclick="Modal.close('issue-dialog')">Done</button>
        </div>
      `;
      Modal.open('issue-dialog');
    } catch (e) {
      Toast.error('Could not load receipt');
    }
  }
};
