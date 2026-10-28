// Outlines a control on the page for a few seconds, so the user can see what the phone controls.
// An overlay is used, so the page's own styles are never changed.
const DURATION_MS = 3000;
const OVERLAY_ID = 'global-input-page-control-highlight';

export const highlightElement = (element: Element, doc: Document = document) => {
  doc.getElementById(OVERLAY_ID)?.remove();
  element.scrollIntoView({ block: 'center', inline: 'nearest' });
  const box = element.getBoundingClientRect();
  const overlay = doc.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, {
    position: 'fixed',
    left: `${box.left - 4}px`,
    top: `${box.top - 4}px`,
    width: `${box.width + 8}px`,
    height: `${box.height + 8}px`,
    border: '3px solid #1F4FB8',
    borderRadius: '6px',
    boxShadow: '0 0 0 4px rgba(31, 79, 184, 0.25)',
    pointerEvents: 'none',
    zIndex: '2147483647',
  });
  doc.documentElement.appendChild(overlay);
  const remove = () => {
    overlay.remove();
    doc.defaultView?.removeEventListener('scroll', remove, true);
  };
  doc.defaultView?.addEventListener('scroll', remove, true);
  setTimeout(remove, DURATION_MS);
};
