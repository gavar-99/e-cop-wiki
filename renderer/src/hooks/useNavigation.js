import { useState, useCallback } from 'react';
import { VIEWS, HISTORY_TYPES } from '../constants';

/**
 * Custom hook for managing navigation history (browser-like back/forward)
 *
 * @returns {Object} - Navigation state and handlers
 */
export function useNavigation() {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [currentEntry, setCurrentEntry] = useState(null);

  // Check if can go back/forward
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  // Navigate to an entry (adds to history)
  const navigateToEntry = useCallback(
    (entry, skipHistory = false) => {
      setCurrentEntry(entry);
      setCurrentView(VIEWS.ARTICLE);

      if (!skipHistory) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ type: HISTORY_TYPES.ARTICLE, entry });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    },
    [history, historyIndex]
  );

  // Navigate to a view (without history for non-article views)
  const navigateToView = useCallback((view, entry = null) => {
    setCurrentView(view);
    if (entry) {
      setCurrentEntry(entry);
    }
  }, []);

  // Go back in history
  const goBack = useCallback(() => {
    if (canGoBack) {
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];

      if (prevState.type === HISTORY_TYPES.ARTICLE) {
        setCurrentEntry(prevState.entry);
        setCurrentView(VIEWS.ARTICLE);
        setHistoryIndex(prevIndex);
      }
    }
  }, [canGoBack, history, historyIndex]);

  // Go forward in history
  const goForward = useCallback(() => {
    if (canGoForward) {
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];

      if (nextState.type === HISTORY_TYPES.ARTICLE) {
        setCurrentEntry(nextState.entry);
        setCurrentView(VIEWS.ARTICLE);
        setHistoryIndex(nextIndex);
      }
    }
  }, [canGoForward, history, historyIndex]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  // Reset to dashboard
  const goToDashboard = useCallback(() => {
    setCurrentView(VIEWS.DASHBOARD);
    setCurrentEntry(null);
  }, []);

  return {
    // State
    history,
    historyIndex,
    currentView,
    currentEntry,
    canGoBack,
    canGoForward,
    // Actions
    navigateToEntry,
    navigateToView,
    goBack,
    goForward,
    clearHistory,
    goToDashboard,
    setCurrentView,
    setCurrentEntry,
  };
}

export default useNavigation;
