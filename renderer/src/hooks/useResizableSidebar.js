import { useState, useRef, useCallback, useEffect } from 'react';
import { UI } from '../constants';

/**
 * Custom hook for managing a resizable sidebar
 *
 * @param {Object} options - Configuration options
 * @param {number} options.initialWidth - Initial sidebar width
 * @param {number} options.minWidth - Minimum sidebar width
 * @param {number} options.maxWidth - Maximum sidebar width
 * @returns {Object} - Sidebar state and handlers
 */
export function useResizableSidebar({
  initialWidth = UI.SIDEBAR_DEFAULT_WIDTH,
  minWidth = UI.SIDEBAR_MIN_WIDTH,
  maxWidth = UI.SIDEBAR_MAX_WIDTH,
} = {}) {
  const [width, setWidth] = useState(initialWidth);
  const isResizing = useRef(false);

  // Handle resize movement
  const resize = useCallback(
    (e) => {
      if (isResizing.current) {
        const newWidth = document.body.clientWidth - e.clientX;
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setWidth(newWidth);
        }
      }
    },
    [minWidth, maxWidth]
  );

  // Stop resizing
  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, [resize]);

  // Start resizing
  const startResizing = useCallback(
    (e) => {
      isResizing.current = true;
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    },
    [resize, stopResizing]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  // Reset to default width
  const resetWidth = useCallback(() => {
    setWidth(initialWidth);
  }, [initialWidth]);

  return {
    width,
    startResizing,
    resetWidth,
    setWidth,
  };
}

export default useResizableSidebar;
