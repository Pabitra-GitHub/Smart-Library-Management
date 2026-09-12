/**
 * Small browser-side helpers for safe rendering and display formatting.
 */
window.UI = {
  escape(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  },

  attr(value) {
    return this.escape(value);
  },

  date(value, fallback = '-') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString();
  },

  eventArg(value) {
    return this.attr(String(value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, '\\n')
      .replace(/</g, '\\x3C')
      .replace(/>/g, '\\x3E'));
  }
};
