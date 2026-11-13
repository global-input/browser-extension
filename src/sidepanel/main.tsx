import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { notOwned, openSessionStore } from './adapters/sessionStore';

// The saved phone session (if any) is read before connecting, so the panel resumes it instead
// of starting a new one.
openSessionStore()
  .catch(notOwned)
  .then(store => {
    createRoot(document.getElementById('root') as HTMLElement).render(<App sessionStore={store} />);
  });
