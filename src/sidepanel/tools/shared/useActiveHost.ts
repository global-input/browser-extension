// The site a tool works on. It starts with the host the Sign in tab knew when the tool was
// opened; without one, the tool asks the active tab's content script, so it does not depend
// on what the Sign in tab knew (for example a tab opened before the extension was reloaded,
// once the page is reloaded and the user presses Try again).
import { useEffect, useState } from 'react';
import { activeTabHost } from '../../adapters/chromePage';

export const useActiveHost = (initial: string) => {
  const [host, setHost] = useState<string | null>(initial || null);
  const [asked, setAsked] = useState(!!initial);
  const ask = () => {
    setAsked(false);
    activeTabHost().then(found => {
      setHost(found);
      setAsked(true);
    });
  };
  useEffect(() => {
    if (!initial) {
      ask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { host: host || '', asked, ask };
};
