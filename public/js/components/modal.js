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
  }
};
