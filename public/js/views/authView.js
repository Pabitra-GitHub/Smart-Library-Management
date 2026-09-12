/**
 * Authentication View Component
 * Provides Create Account (with Master Passcode protection for Librarian) and Sign In
 * Styled with authentic Apple glassmorphic card architecture and segmented control bar
 */

const AuthView = {
  currentMode: 'register', // Default to 'register' (Create Account shown first)
  selectedRole: 'librarian',

  render(container) {
    container.innerHTML = `
      <div style="max-width: 520px; margin: 2.25rem auto 3.5rem; position: relative;">
        <!-- Specular Glass Auth Card -->
        <div class="card" style="padding: 2.5rem; border: 1px solid var(--border-highlight); box-shadow: var(--shadow-modal);">
          
          <!-- Brand Logo & Apple Style Header -->
          <div style="text-align: center; margin-bottom: 2rem;">
            <div class="brand-icon" style="margin: 0 auto 1.15rem; width: 58px; height: 58px; font-size: 1.75rem; border: 2px solid rgba(255,255,255,0.35);">📚</div>
            <h1 style="font-size: 1.85rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.35rem;">AI Smart Library</h1>
            <p style="color: var(--text-secondary); font-size: 0.90rem;">Intelligent Collegiate Technical Library & Circulation</p>
          </div>

          <!-- Apple Segmented Control Bar: Create Account vs Sign In -->
          <div class="segmented-bar" style="display: flex; width: 100%; margin-bottom: 2rem; padding: 0.3rem;">
            <button type="button" id="tab-btn-register" class="segment-item ${this.currentMode === 'register' ? 'active' : ''}" style="flex: 1; justify-content: center; padding: 0.55rem;">
              ✨ Create Account
            </button>
            <button type="button" id="tab-btn-login" class="segment-item ${this.currentMode === 'login' ? 'active' : ''}" style="flex: 1; justify-content: center; padding: 0.55rem;">
              🔑 Sign In
            </button>
          </div>

          <!-- Dynamic Form Area -->
          <div id="auth-form-container"></div>

          <!-- Security Badge Footnote -->
          <div style="margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; gap: 0.45rem; font-size: 0.76rem; color: var(--text-muted);">
            <span>🔒</span> Encrypted Local Collegiate Security Gateway
          </div>
        </div>
      </div>
    `;

    this.renderForm();

    // Mode toggle listeners
    document.getElementById('tab-btn-register').addEventListener('click', () => {
      this.currentMode = 'register';
      this.render(container);
    });

    document.getElementById('tab-btn-login').addEventListener('click', () => {
      this.currentMode = 'login';
      this.render(container);
    });
  },

  renderForm() {
    const formContainer = document.getElementById('auth-form-container');
    if (!formContainer) return;

    if (this.currentMode === 'register') {
      formContainer.innerHTML = `
        <form id="register-form">
          <!-- Role Selection Segmented Control Bar -->
          <div class="form-group">
            <label class="form-label">Select Account Role</label>
            <div class="segmented-bar" style="display: flex; width: 100%; padding: 0.25rem;">
              <button type="button" id="role-pill-librarian" class="segment-item ${this.selectedRole === 'librarian' ? 'active' : ''}" style="flex: 1; justify-content: center; padding: 0.5rem;">
                👔 Librarian (Admin)
              </button>
              <button type="button" id="role-pill-student" class="segment-item ${this.selectedRole === 'student' ? 'active' : ''}" style="flex: 1; justify-content: center; padding: 0.5rem;">
                🎓 Student
              </button>
            </div>
          </div>

          <!-- Full Name -->
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="reg-name" class="form-control" placeholder="e.g. Dr. Alok Verma or Rahul Sharma" required />
          </div>

          <!-- Email -->
          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input type="email" id="reg-email" class="form-control" placeholder="e.g. user@college.edu" required />
          </div>

          <!-- Password -->
          <div class="form-group">
            <label class="form-label">Create Password *</label>
            <input type="password" id="reg-password" class="form-control" placeholder="••••••••" required />
          </div>

          <!-- Role-specific dynamic fields -->
          <div id="role-specific-fields"></div>

          <button type="submit" id="reg-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem; padding: 0.85rem; font-size: 0.96rem;">
            Create Account & Enter Library →
          </button>
        </form>
      `;

      this.renderRoleSpecificFields();

      // Role pill toggles
      document.getElementById('role-pill-librarian').addEventListener('click', () => {
        this.selectedRole = 'librarian';
        document.getElementById('role-pill-librarian').classList.add('active');
        document.getElementById('role-pill-student').classList.remove('active');
        this.renderRoleSpecificFields();
      });

      document.getElementById('role-pill-student').addEventListener('click', () => {
        this.selectedRole = 'student';
        document.getElementById('role-pill-student').classList.add('active');
        document.getElementById('role-pill-librarian').classList.remove('active');
        this.renderRoleSpecificFields();
      });

      // Submit registration
      document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleRegistration();
      });

    } else {
      // Sign In Form
      formContainer.innerHTML = `
        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Email or Username</label>
            <input type="text" id="login-identifier" class="form-control" placeholder="Enter your email or username" required autofocus />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="login-password" class="form-control" placeholder="••••••••" required />
          </div>

          <button type="submit" id="login-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem; padding: 0.85rem; font-size: 0.96rem;">
            Sign In to System →
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.5rem; font-size: 0.86rem; color: var(--text-muted);">
          Don't have an account yet? 
          <a href="#" id="link-switch-create" style="color: var(--primary); font-weight: 700; text-decoration: none;">Create an account</a>
        </div>
      `;

      document.getElementById('link-switch-create').addEventListener('click', (e) => {
        e.preventDefault();
        this.currentMode = 'register';
        this.render(document.getElementById('view-container'));
      });

      document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin();
      });
    }
  },

  renderRoleSpecificFields() {
    const container = document.getElementById('role-specific-fields');
    if (!container) return;

    if (this.selectedRole === 'librarian') {
      container.innerHTML = `
        <!-- Librarian Security Master Passcode -->
        <div class="form-group" style="margin-top: 0.75rem; background: rgba(99, 102, 241, 0.09); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-glow); box-shadow: var(--glass-inner-bevel);">
          <label class="form-label" style="display: flex; align-items: center; justify-content: space-between;">
            <span>🔒 Librarian Master Passcode *</span>
            <span class="badge badge-warning" style="font-size: 0.65rem;">Passcode Protected</span>
          </label>
          <input type="password" id="reg-passcode" class="form-control" placeholder="Enter master security key (Default: admin123)" required />
          <span style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 0.4rem; display: block;">
            Protects administrator registration. Only authorized library staff with the master key can create librarian accounts.
          </span>
        </div>

        <div class="form-group" style="margin-top: 0.75rem;">
          <label class="form-label">Staff Designation (Optional)</label>
          <input type="text" id="reg-designation" class="form-control" placeholder="e.g. Head Librarian / Assistant Librarian" value="Librarian" />
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-top: 0.5rem;">
          <div class="form-group">
            <label class="form-label">Department *</label>
            <select id="reg-dept" class="form-control" required>
              <option value="CSE" selected>CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Semester *</label>
            <select id="reg-sem" class="form-control" required>
              <option value="1st Semester">1st Sem</option>
              <option value="2nd Semester">2nd Sem</option>
              <option value="3rd Semester">3rd Sem</option>
              <option value="4th Semester">4th Sem</option>
              <option value="5th Semester">5th Sem</option>
              <option value="6th Semester">6th Sem</option>
              <option value="7th Semester" selected>7th Sem</option>
              <option value="8th Semester">8th Sem</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Enrollment / Roll Number (Optional)</label>
          <input type="text" id="reg-enroll" class="form-control" placeholder="e.g. 0801CS211045" />
        </div>
      `;
    }
  },

  async handleRegistration() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const role = this.selectedRole;

    const payload = {
      role,
      name,
      email,
      password
    };

    if (role === 'librarian') {
      const passcode = document.getElementById('reg-passcode').value.trim();
      const designation = document.getElementById('reg-designation') ? document.getElementById('reg-designation').value.trim() : 'Librarian';
      payload.securityPasscode = passcode;
      payload.designation = designation;
    } else {
      payload.department = document.getElementById('reg-dept').value;
      payload.semester = document.getElementById('reg-sem').value;
      payload.enrollmentNo = document.getElementById('reg-enroll') ? document.getElementById('reg-enroll').value.trim() : '';
    }

    const btn = document.getElementById('reg-submit-btn');
    btn.disabled = true;
    btn.innerText = 'Creating account...';

    try {
      const res = await API.register(payload);
      Toast.success(res.message);
      state.setUser(res.user);
    } catch (err) {
      Toast.error(err.message || 'Registration failed');
      btn.disabled = false;
      btn.innerText = 'Create Account & Enter Library →';
    }
  },

  async handleLogin() {
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;

    const btn = document.getElementById('login-submit-btn');
    btn.disabled = true;
    btn.innerText = 'Signing in...';

    try {
      const res = await API.login(identifier, password);
      Toast.success(res.message);
      state.setUser(res.user);
    } catch (err) {
      Toast.error(err.message || 'Login failed');
      btn.disabled = false;
      btn.innerText = 'Sign In to System →';
    }
  }
};
