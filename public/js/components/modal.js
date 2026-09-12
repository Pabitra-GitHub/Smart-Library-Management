/**
 * Accessible Dialog Modal Controller
 * Adheres to Modern Web Guidance with closedby="any" and light-dismiss fallback
 */

const Modal = {
  open(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (!dialog) return;

    // Ensure modern closedby attribute is set
    dialog.setAttribute('closedby', 'any');

    // Attach light dismiss fallback for browsers without native closedBy support
    if (!dialog._hasLightDismissFallback && !('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (!isDialogContent) {
          dialog.close();
        }
      });
      dialog._hasLightDismissFallback = true;
    }

    dialog.showModal();
  },

  close(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (dialog && dialog.open) {
      dialog.close();
    }
  },

  confirm({ title, message, icon = '❓', confirmText = 'Proceed', cancelText = 'Cancel', onConfirm }) {
    let dialog = document.getElementById('confirm-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'confirm-dialog';
      dialog.setAttribute('aria-label', 'Action Confirmation Dialog');
      document.body.appendChild(dialog);
    }

    dialog.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title" style="display: flex; align-items: center; gap: 0.6rem;">
          <span style="font-size: 1.35rem;">${icon}</span>
          <span>${title}</span>
        </h3>
        <button type="button" class="btn btn-secondary btn-icon" id="confirm-dialog-close-x" aria-label="Close dialog">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 0.95rem; line-height: 1.55; color: var(--text-secondary); margin: 0;">
          ${message}
        </p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="confirm-dialog-btn-cancel">${cancelText}</button>
        <button type="button" class="btn btn-primary" id="confirm-dialog-btn-confirm">${confirmText}</button>
      </div>
    `;

    const closeDialog = () => Modal.close('confirm-dialog');

    document.getElementById('confirm-dialog-close-x').onclick = closeDialog;
    document.getElementById('confirm-dialog-btn-cancel').onclick = closeDialog;
    document.getElementById('confirm-dialog-btn-confirm').onclick = () => {
      closeDialog();
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
    };

    Modal.open('confirm-dialog');
  }
};
