import React from 'react';
import { Search, Tag } from 'lucide-react';
import { useSearch } from '../../hooks';
import { UI } from '../../constants';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
} from '../../styles/theme';

const SearchBar = ({ entries, onNavigate, minChars = UI.DASHBOARD_SEARCH_MIN_CHARS }) => {
  const handleSelect = (suggestion) => {
    onNavigate(suggestion.title);
  };

  const handleSearch = async (query) => {
    const exactMatch = entries.find((entry) => entry.title.toLowerCase() === query.toLowerCase());
    if (exactMatch) {
      onNavigate(exactMatch.title);
    } else {
      try {
        const results = await window.wikiAPI.searchAutocomplete(query);
        if (results && results.length > 0) {
          onNavigate(results[0].title);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }
  };

  const {
    query,
    suggestions,
    showDropdown,
    selectedIndex,
    inputRef,
    dropdownRef,
    handleChange,
    handleKeyDown,
    handleFocus,
    handleSelectSuggestion,
    setSelectedIndex,
    clearSearch,
  } = useSearch({
    minChars,
    onSelect: handleSelect,
    onSearch: handleSearch,
  });

  return (
    <div style={styles.container}>
      <div style={styles.wrapper} ref={dropdownRef}>
        <Search size={18} style={{ color: colors.textMuted, marginRight: spacing.lg }} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search titles, content, and tags..."
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          style={styles.input}
        />
        {showDropdown && suggestions.length > 0 && (
          <div style={styles.dropdown}>
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                onClick={() => {
                  handleSelectSuggestion(suggestion);
                  clearSearch();
                }}
                style={{
                  ...styles.suggestionItem,
                  backgroundColor: index === selectedIndex ? colors.backgroundHover : colors.white,
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div style={styles.suggestionTitle}>{suggestion.title}</div>
                {suggestion.snippet && (
                  <div style={styles.suggestionSnippet}>
                    {suggestion.snippet.substring(0, 120)}...
                  </div>
                )}
                {suggestion.tags && suggestion.tags.length > 0 && (
                  <div style={styles.tagsContainer}>
                    {suggestion.tags.slice(0, 4).map((tag, i) => (
                      <span key={i} style={styles.tag}>
                        <Tag size={10} style={{ marginRight: '3px' }} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: spacing['5xl'],
  },
  wrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '650px',
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.full,
    padding: `${spacing.lg} ${spacing['3xl']}`,
    backgroundColor: colors.white,
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
    transition: `border-color ${transitions.normal}, box-shadow ${transitions.normal}`,
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: typography.fontSize.sm,
    backgroundColor: 'transparent',
    color: colors.text,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.lg,
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
    maxHeight: '400px',
    overflowY: 'auto',
    zIndex: 1000,
  },
  suggestionItem: {
    padding: `${spacing.xl} ${spacing['2xl']}`,
    cursor: 'pointer',
    borderBottom: `1px solid ${colors.borderLight}`,
    transition: `background-color ${transitions.fast}`,
  },
  suggestionTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.base,
  },
  suggestionSnippet: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: typography.lineHeight.snug,
  },
  tagsContainer: {
    display: 'flex',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.75em',
    padding: `2px ${spacing.md}`,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    color: '#b8860b',
    borderRadius: borderRadius['2xl'],
    fontWeight: typography.fontWeight.medium,
  },
};

export default SearchBar;
