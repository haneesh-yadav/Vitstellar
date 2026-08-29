// Shared date helpers.
// Used by database/deadlines.js and any component that needs to show a
// deadline/date to the user. Keeping this in one place means a date only
// ever needs to be edited once — the display text always matches it.

export function formatDate(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatTime(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// "01 February 2027 [11:59 PM]" — the phrasing used across the form
// "Last Date to fill the form is ..." instructions.
export function formatDeadlineNotice(date) {
  return `${formatDate(date)} [${formatTime(date)}]`;
}