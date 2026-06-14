import './commands';

// Ignorer les erreurs ResizeObserver (faux positifs courants en React)
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('ResizeObserver') || err.message.includes('Non-Error promise rejection')) {
    return false;
  }
});
