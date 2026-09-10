/**
 * Students Management View
 * Implements PRD Section 6.3 (Student Management)
 */

const StudentsView = {
  searchQuery: '',
  departmentFilter: 'All',

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em;">Student Registry & Profiles</h1>
          <p style="color: var(--text-secondary); font-size: 0.92rem;">Manage enrolled collegiate engineering students and track individual loan limits</p>
        </div>
        <div>
          <button id="btn-add-new-student" class="btn btn-primary">
            <span>+</span> Register New Student
          </button>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="card" style="padding: 1.25rem; margin-bottom: 1.5rem;">
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
          <div class="search-bar-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" id="student-search-input" class="form-control search-input" placeholder="Search by student name, ID, enrollment no, or email..." value="${this.searchQuery}" />
          </div>
          <div style="display: flex; gap: 0.5rem;" class="chips-container" id="student-dept-chips">
            <span class="chip ${this.departmentFilter === 'All' ? 'active' : ''}" data-dept="All">All Branches</span>
            <span class="chip ${this.departmentFilter === 'CSE' ? 'active' : ''}" data-dept="CSE">CSE</span>
            <span class="chip ${this.departmentFilter === 'IT' ? 'active' : ''}" data-dept="IT">IT</span>
            <span class="chip ${this.departmentFilter === 'ECE' ? 'active' : ''}" data-dept="ECE">ECE</span>
            <span class="chip ${this.departmentFilter === 'MECH' ? 'active' : ''}" data-dept="MECH">MECH</span>
          </div>
        </div>
      </div>

      <!-- Student Directory Table -->
      <div id="students-table-container">
        <div class="skeleton" style="height: 350px;"></div>
      </div>
    `;

    this.fetchAndRenderStudents();

    // Event listeners
    const searchInput = document.getElementById('student-search-input');
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.searchQuery = e.target.value.trim();
        this.fetchAndRenderStudents();
      }, 250);
    });

    document.querySelectorAll('#student-dept-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#student-dept-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.departmentFilter = chip.dataset.dept;
        this.fetchAndRenderStudents();
      });
    });

    document.getElementById('btn-add-new-student').addEventListener('click', () => {
      this.openAddStudentModal();
    });
  },

  async fetchAndRenderStudents() {
    const container = document.getElementById('students-table-container');
    if (!container) return;

    try {
      const res = await API.getStudents({
        search: this.searchQuery,
        department: this.departmentFilter
      });

      const students = res.students || [];

      if (students.length === 0) {
        const isSearch = this.searchQuery || this.departmentFilter !== 'All';
        container.innerHTML = `
          <div class="card" style="text-align: center; padding: 3.5rem 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">👥</div>
            <h3 style="font-size: 1.25rem; font-weight: 700;">${isSearch ? 'No students found matching filters' : 'Student Registry is Clean & Empty'}</h3>
            <p style="color: var(--text-muted); margin-top: 0.4rem; max-width: 440px; margin-left: auto; margin-right: auto;">
              ${isSearch
                ? 'Try clearing the branch filter or adjusting your search term.'
                : 'No students have been enrolled yet. Register students to manage book circulation.'}
            </p>
            <button class="btn btn-primary btn-sm" style="margin-top: 1.25rem;" onclick="StudentsView.openAddStudentModal()">
              + Register Student
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
                <th>Student ID</th>
                <th>Name & Enrollment</th>
                <th>Department & Semester</th>
                <th>Contact</th>
                <th>Active Loans</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => {
                const loanBadge = s.activeLoansCount > 0
                  ? `<span class="badge badge-warning">${s.activeLoansCount} Active Loan${s.activeLoansCount > 1 ? 's' : ''}</span>`
                  : `<span class="badge badge-neutral">0 Active</span>`;

                return `
                  <tr>
                    <td><strong style="font-family: var(--font-mono); font-size: 0.82rem;">${s.id}</strong></td>
                    <td>
                      <span class="table-cell-title">${s.name}</span>
                      <span class="table-cell-sub">Enrollment: ${s.enrollmentNo}</span>
                    </td>
                    <td>
                      <span class="badge badge-category">${s.department}</span>
                      <span style="font-size: 0.8rem; margin-left: 0.35rem; color: var(--text-secondary);">${s.semester}</span>
                    </td>
                    <td>
                      <span style="font-size: 0.82rem; display: block;">${s.email}</span>
                      <span style="font-size: 0.78rem; color: var(--text-muted);">${s.phone || 'No phone'}</span>
                    </td>
                    <td>${loanBadge}</td>
                    <td>
                      <div style="display: flex; gap: 0.35rem;">
                        <button class="btn btn-secondary btn-sm" onclick="StudentsView.viewStudentHistory('${s.id}')" title="View borrowing history">
                          History
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="StudentsView.openEditStudentModal('${s.id}')" title="Edit student">
                          Edit
                        </button>
                        <button class="btn btn-secondary btn-sm" style="color: var(--danger);" onclick="StudentsView.deleteStudentPrompt('${s.id}', '${s.name.replace(/'/g, "\\'")}')" title="Delete student">
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger); padding: 1.5rem;">Error loading students: ${err.message}</p>`;
    }
  },

  openAddStudentModal() {
    const modal = document.getElementById('student-dialog');
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">👤 Register New Student</h3>
        <button type="button" class="btn btn-secondary btn-icon" onclick="Modal.close('student-dialog')">✕</button>
      </div>
      <div class="modal-body">
        <form id="add-student-form">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="new-student-name" class="form-control" placeholder="e.g. Rahul Sharma" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" id="new-student-email" class="form-control" placeholder="e.g. rahul@college.edu" required />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" id="new-student-phone" class="form-control" placeholder="+91 98765 43210" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Department *</label>
              <select id="new-student-dept" class="form-control" required>
                <option value="CSE">Computer Science & Engineering (CSE)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="ECE">Electronics & Communication (ECE)</option>
                <option value="MECH">Mechanical Engineering (MECH)</option>
                <option value="CIVIL">Civil Engineering (CIVIL)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Current Semester *</label>
              <select id="new-student-sem" class="form-control" required>
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="3rd Semester">3rd Semester</option>
                <option value="4th Semester">4th Semester</option>
                <option value="5th Semester">5th Semester</option>
                <option value="6th Semester">6th Semester</option>
                <option value="7th Semester" selected>7th Semester</option>
                <option value="8th Semester">8th Semester</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Enrollment / Roll Number</label>
            <input type="text" id="new-student-enroll" class="form-control" placeholder="e.g. 0801CS211045" />
          </div>

          <div style="padding: 0.75rem; background: var(--bg-surface); border-radius: var(--radius-md); font-size: 0.8rem; color: var(--text-muted); border: 1px solid var(--border-color);">
            ℹ️ A student login account will be automatically generated with default password <code>student123</code>.
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="Modal.close('student-dialog')">Cancel</button>
        <button type="button" id="btn-save-new-student" class="btn btn-primary">Register Student</button>
      </div>
    `;

    Modal.open('student-dialog');

    document.getElementById('btn-save-new-student').addEventListener('click', async () => {
      const name = document.getElementById('new-student-name').value.trim();
      const email = document.getElementById('new-student-email').value.trim();
      const phone = document.getElementById('new-student-phone').value.trim();
      const department = document.getElementById('new-student-dept').value;
      const semester = document.getElementById('new-student-sem').value;
      const enrollmentNo = document.getElementById('new-student-enroll').value.trim();

      if (!name || !email || !department || !semester) {
        Toast.error('Please enter name, email, department, and semester');
        return;
      }

      try {
        const res = await API.createStudent({
          name, email, phone, department, semester, enrollmentNo,
          performedBy: state.currentUser ? state.currentUser.name : 'Librarian'
        });
        Toast.success(res.message);
        Modal.close('student-dialog');
        StudentsView.fetchAndRenderStudents();
      } catch (err) {
        Toast.error(err.message);
      }
    });
  },

  async openEditStudentModal(studentId) {
    let student;
    try {
      const res = await API.getStudentById(studentId);
      student = res.student;
    } catch (e) {
      Toast.error('Failed to load student');
      return;
    }

    const modal = document.getElementById('student-dialog');
    modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">✏ Edit Student (${student.id})</h3>
        <button type="button" class="btn btn-secondary btn-icon" onclick="Modal.close('student-dialog')">✕</button>
      </div>
      <div class="modal-body">
        <form id="edit-student-form">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="edit-student-name" class="form-control" value="${student.name}" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" id="edit-student-email" class="form-control" value="${student.email}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" id="edit-student-phone" class="form-control" value="${student.phone || ''}" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Department *</label>
              <input type="text" id="edit-student-dept" class="form-control" value="${student.department}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Semester *</label>
              <input type="text" id="edit-student-sem" class="form-control" value="${student.semester}" required />
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="Modal.close('student-dialog')">Cancel</button>
        <button type="button" id="btn-save-edit-student" class="btn btn-primary">Update Profile</button>
      </div>
    `;

    Modal.open('student-dialog');

    document.getElementById('btn-save-edit-student').addEventListener('click', async () => {
      const updates = {
        name: document.getElementById('edit-student-name').value.trim(),
        email: document.getElementById('edit-student-email').value.trim(),
        phone: document.getElementById('edit-student-phone').value.trim(),
        department: document.getElementById('edit-student-dept').value.trim(),
        semester: document.getElementById('edit-student-sem').value.trim(),
        performedBy: state.currentUser ? state.currentUser.name : 'Librarian'
      };

      try {
        await API.updateStudent(studentId, updates);
        Toast.success('Student record updated');
        Modal.close('student-dialog');
        StudentsView.fetchAndRenderStudents();
      } catch (err) {
        Toast.error(err.message);
      }
    });
  },

  async deleteStudentPrompt(studentId, studentName) {
    if (confirm(`Are you sure you want to remove student "${studentName}" (${studentId})?`)) {
      try {
        await API.deleteStudent(studentId, state.currentUser ? state.currentUser.name : 'Librarian');
        Toast.success(`Student "${studentName}" removed`);
        this.fetchAndRenderStudents();
      } catch (err) {
        Toast.error(err.message);
      }
    }
  },

  async viewStudentHistory(studentId) {
    try {
      const res = await API.getStudentById(studentId);
      const s = res.student;
      const history = res.history || [];

      const modal = document.getElementById('student-dialog');
      modal.innerHTML = `
        <div class="modal-header">
          <h3 class="modal-title">📖 Borrowing History: ${s.name}</h3>
          <button type="button" class="btn btn-secondary btn-icon" onclick="Modal.close('student-dialog')">✕</button>
        </div>
        <div class="modal-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; background: var(--bg-surface); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div>
              <strong>${s.department} • ${s.semester}</strong>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${s.email} • ID: ${s.id}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.8rem; color: var(--text-muted);">Outstanding Fine:</span>
              <strong style="display: block; font-size: 1.1rem; color: ${s.pendingFines > 0 ? 'var(--danger)' : 'var(--success)'};">
                ₹${s.pendingFines}
              </strong>
            </div>
          </div>

          ${history.length === 0 ? `
            <p style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No borrowing history for this student yet.</p>
          ` : `
            <div class="table-container">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Fine</th>
                  </tr>
                </thead>
                <tbody>
                  ${history.map(h => `
                    <tr>
                      <td>
                        <span class="table-cell-title">${h.bookTitle}</span>
                        <span class="table-cell-sub">${h.id}</span>
                      </td>
                      <td>${new Date(h.issueDate).toLocaleDateString()}</td>
                      <td>${new Date(h.dueDate).toLocaleDateString()}</td>
                      <td>
                        ${h.returnDate
                          ? `<span class="badge badge-success">Returned</span>`
                          : (h.isOverdue
                            ? `<span class="badge badge-danger">Overdue (${h.overdueDays}d)</span>`
                            : `<span class="badge badge-info">Active</span>`)}
                      </td>
                      <td>
                        ${(h.calculatedFine > 0 || h.fineAmount > 0)
                          ? `<span style="font-weight: 700; color: ${h.finePaid ? 'var(--success)' : 'var(--danger)'}">₹${h.fineAmount || h.calculatedFine} (${h.finePaid ? 'Paid' : 'Unpaid'})</span>`
                          : `<span style="color: var(--text-muted);">₹0</span>`}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="Modal.close('student-dialog')">Close</button>
        </div>
      `;
      Modal.open('student-dialog');
    } catch (e) {
      Toast.error('Could not load student borrowing history');
    }
  }
};
