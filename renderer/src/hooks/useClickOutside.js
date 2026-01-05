import { useEffect, useRef } from 'react';

/**
 * Custom hook that triggers a callback when clicking outside specified element(s)
 *
 * @param {Function} callback - Callback to execute when clicking outside
 * @param {boolean} enabled - Whether the hook is active (default: true)
 * @returns {Object} - Ref to attach to the element
 */
export function useClickOutside(callback, enabled = true) {
  const ref = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [callback, enabled]);

  return ref;
}

export default useClickOutside;
