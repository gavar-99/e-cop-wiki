import { useState, useEffect, useRef, useCallback } from 'react';
import { DEBOUNCE, UI } from '../constants';

/**
 * Custom hook for search autocomplete functionality
 * Handles debounced search, keyboard navigation, and dropdown state
 *
 * @param {Object} options - Configuration options
 * @param {number} options.minChars - Minimum characters to trigger search (default: 1)
 * @param {number} options.debounceDelay - Debounce delay in ms (default: 300)
 * @param {Function} options.onSelect - Callback when suggestion is selected
 * @param {Function} options.onSearch - Callback when search is submitted without selection
 * @returns {Object} - Search state and handlers
 */
export function useSearch({
  minChars = UI.SEARCH_MIN_CHARS,
  debounceDelay = DEBOUNCE.SEARCH,
  onSelect,
  onSearch,
} = {}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= minChars) {
        setIsLoading(true);
        try {
          const results = await window.wikiAPI.searchAutocomplete(query);
          setSuggestions(results || []);
          setShowDropdown(results && results.length > 0);
          setSelectedIndex(0);
        } catch (error) {
          console.error('Search autocomplete error:', error);
          setSuggestions([]);
          setShowDropdown(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [query, minChars, debounceDelay]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (showDropdown && suggestions.length > 0) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev < suggestions.length - 1 ? prev + 1 : prev
            );
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
            break;
          case 'Enter':
            e.preventDefault();
            if (suggestions[selectedIndex]) {
              handleSelectSuggestion(suggestions[selectedIndex]);
            }
            break;
          case 'Escape':
            setShowDropdown(false);
            break;
          default:
            break;
        }
      } else if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        onSearch?.(query.trim());
      }
    },
    [showDropdown, suggestions, selectedIndex, query, onSearch]
  );

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback(
    (suggestion) => {
      setQuery(suggestion.title);
      setShowDropdown(false);
      onSelect?.(suggestion);
    },
    [onSelect]
  );

  // Handle input change
  const handleChange = useCallback((e) => {
    setQuery(e.target.value);
  }, []);

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (query.trim().length >= minChars && suggestions.length > 0) {
      setShowDropdown(true);
    }
  }, [query, minChars, suggestions.length]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
  }, []);

  return {
    // State
    query,
    suggestions,
    showDropdown,
    selectedIndex,
    isLoading,
    // Refs
    inputRef,
    dropdownRef,
    // Handlers
    handleChange,
    handleKeyDown,
    handleFocus,
    handleSelectSuggestion,
    setSelectedIndex,
    clearSearch,
    setQuery,
  };
}

export default useSearch;
