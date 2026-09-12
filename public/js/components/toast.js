/**
 * Toast Notification System
 */

const Toast = {
  container: null,

  _getContainer() {
    if (!this.container) {
      this.container = document.getElementById('toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        document.body.appendChild(this.container);
      }
    }
    return this.container;
  },

  show(message, type = 'info', duration = 3500) {
    const container = this._getContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const icon = document.createElement('span');
    icon.style.fontWeight = '800';
    icon.style.fontSize = '1rem';
    icon.textContent = iconMap[type] || '•';

    const text = document.createElement('span');
    text.style.flex = '1';
    text.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.style.cssText = 'background:none; border:none; color:inherit; cursor:pointer; opacity:0.6; font-size:1rem; padding:0 0.25rem;';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => toast.remove());

    toast.append(icon, text, closeBtn);

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  },

  success(msg, dur) { this.show(msg, 'success', dur); },
  error(msg, dur) { this.show(msg, 'error', dur); },
  warning(msg, dur) { this.show(msg, 'warning', dur); },
  info(msg, dur) { this.show(msg, 'info', dur); }
};
