import { useState, useRef, useCallback, useEffect } from 'react';
import { DEBOUNCE, UI } from '../constants';

/**
 * Custom hook for hashtag autocomplete in text inputs/textareas
 * Detects #hashtag patterns and provides autocomplete suggestions
 *
 * @param {Object} options - Configuration options
 * @param {Array} options.allTags - Array of available tags [{id, name, count}]
 * @param {Function} options.onInsert - Callback when tag is inserted
 * @returns {Object} - Hashtag autocomplete state and handlers
 */
export function useHashtagAutocomplete({ allTags = [], onInsert } = {}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [activeField, setActiveField] = useState('');

  const debounceRef = useRef(null);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Detect hashtag pattern in text
  const detectHashtag = useCallback(
    (text, cursorPos, field, inputRef) => {
      const textBeforeCursor = text.substring(0, cursorPos);
      const hashtagMatch = textBeforeCursor.match(/#([\w_]*)$/);

      if (hashtagMatch) {
        const query = hashtagMatch[1];
        setHashtagQuery(query);
        setActiveField(field);

        // Clear previous debounce timer
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }

        // Debounce the search
        debounceRef.current = setTimeout(() => {
          const filtered = allTags
            .filter((t) => t.name.toLowerCase().startsWith(query.toLowerCase()))
            .slice(0, UI.AUTOCOMPLETE_MAX_RESULTS);

          setSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
          setSelectedIndex(0);
        }, DEBOUNCE.HASHTAG);

        // Calculate position for dropdown
        if (inputRef?.current) {
          const lines = textBeforeCursor.split('\n');
          const currentLine = lines.length;
          const lineHeight = 20;
          setPosition({
            top: currentLine * lineHeight,
            left: 20,
          });
        }
      } else {
        setShowSuggestions(false);
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      }
    },
    [allTags]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!showSuggestions) return false;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, suggestions.length - 1)
          );
          return true;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          return true;
        case 'Enter':
          if (suggestions.length > 0) {
            e.preventDefault();
            insertHashtag(suggestions[selectedIndex].name);
            return true;
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          return true;
        default:
          break;
      }
      return false;
    },
    [showSuggestions, suggestions, selectedIndex]
  );

  // Insert selected hashtag
  const insertHashtag = useCallback(
    (tagName, currentText, cursorPos, setText) => {
      const textBefore = currentText.substring(0, cursorPos);
      const textAfter = currentText.substring(cursorPos);

      // Find the # position
      const hashPos = textBefore.lastIndexOf('#');
      // Replace spaces with underscores for hashtag format
      const hashtagFormat = tagName.replace(/ /g, '_');
      const newText =
        textBefore.substring(0, hashPos + 1) + hashtagFormat + textAfter;

      setText(newText);
      setShowSuggestions(false);

      // Return new cursor position
      const newPos = hashPos + 1 + hashtagFormat.length;
      onInsert?.(newPos);
      return newPos;
    },
    [onInsert]
  );

  // Close suggestions
  const closeSuggestions = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  return {
    // State
    showSuggestions,
    suggestions,
    selectedIndex,
    hashtagQuery,
    position,
    activeField,
    // Actions
    detectHashtag,
    handleKeyDown,
    insertHashtag,
    closeSuggestions,
    setSelectedIndex,
  };
}

export default useHashtagAutocomplete;
