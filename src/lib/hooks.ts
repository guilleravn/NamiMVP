import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · Ñami`;
  }, [title]);
}

/**
 * After client-side navigation, scroll to the top and move focus to the page's <h1>, so
 * screen reader and keyboard users land on the new screen instead of the old button.
 */
export function useRouteFocus(): void {
  const { pathname } = useLocation();
  useFocusHeadingOnChange(pathname, () => window.scrollTo(0, 0));
}

/**
 * Focuses the page's <h1> whenever `key` changes, but not on first mount. Compares with the
 * previous key (instead of a "first run" flag) so StrictMode's double effects don't trigger it.
 */
export function useFocusHeadingOnChange(key: string, before?: () => void): void {
  const previous = useRef(key);
  useEffect(() => {
    if (previous.current === key) return;
    previous.current = key;
    before?.();
    document.querySelector<HTMLElement>('main h1')?.focus();
  }, [key, before]);
}

/** setTimeout that is cleared on unmount. Used for the fake payment delay. */
export function useTimeout(): (fn: () => void, ms: number) => void {
  const ids = useRef<number[]>([]);
  useEffect(() => () => ids.current.forEach((id) => window.clearTimeout(id)), []);
  return (fn, ms) => {
    ids.current.push(window.setTimeout(fn, ms));
  };
}
