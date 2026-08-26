import { useCallback, useRef, useState } from 'react';

// Lightweight in-memory back/forward-free history stack for the tab-based
// shells (they don't use a router). setTab behaves exactly like the plain
// useState setter every existing page already calls; goBack pops to the
// previously visited tab so the utility bar's Back button is real navigation.
export function useTabHistory(initialTab) {
  const [tab, setTabState] = useState(initialTab);
  const [canGoBack, setCanGoBack] = useState(false);
  const historyRef = useRef([initialTab]);

  const setTab = useCallback((next) => {
    setTabState((prev) => {
      if (next === prev) return prev;
      const stack = historyRef.current;
      stack.push(next);
      if (stack.length > 50) stack.shift();
      setCanGoBack(stack.length > 1);
      return next;
    });
  }, []);

  const goBack = useCallback(() => {
    setTabState((prev) => {
      const stack = historyRef.current;
      if (stack.length <= 1) return prev;
      stack.pop();
      setCanGoBack(stack.length > 1);
      return stack[stack.length - 1];
    });
  }, []);

  return { tab, setTab, goBack, canGoBack };
}
