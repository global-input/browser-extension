// Control ids for elements. The same element keeps the same id across analyses, so the phone's
// screen doesn't jump when the page is analysed again. Only the controls of the latest
// analysis are held (keepOnly), and an element no longer in the page is not returned.
export interface ControlRegistry {
  idFor: (element: Element) => string;
  find: (id: string) => Element | null;
  // Forgets every element not seen in the latest analysis.
  keepOnly: (ids: Set<string>) => void;
}

export const createRegistry = (): ControlRegistry => {
  const ids = new WeakMap<Element, string>();
  const elements = new Map<string, Element>();
  let next = 1;
  return {
    idFor: element => {
      let id = ids.get(element);
      if (!id) {
        id = `c${next++}`;
        ids.set(element, id);
      }
      elements.set(id, element);
      return id;
    },
    find: id => {
      const element = elements.get(id);
      return element && element.isConnected ? element : null;
    },
    keepOnly: keep => {
      for (const id of Array.from(elements.keys())) {
        if (!keep.has(id)) elements.delete(id);
      }
    },
  };
};
