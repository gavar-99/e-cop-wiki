import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Calendar, Clock, Tag, Search } from 'lucide-react';

const Dashboard = ({ entries, onNavigate }) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Search autocomplete with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          console.log('Searching for:', searchQuery);
          const suggestions = await window.wikiAPI.searchAutocomplete(searchQuery);
          console.log('Search results:', suggestions);
          setSearchSuggestions(suggestions || []);
          setShowSearchDropdown(suggestions && suggestions.length > 0);
          setSelectedSearchIndex(0);
        } catch (error) {
          console.error('Search autocomplete error:', error);
          setSearchSuggestions([]);
          setShowSearchDropdown(false);
        }
      } else {
        setSearchSuggestions([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchKeyDown = async (e) => {
    if (showSearchDropdown && searchSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSearchIndex((prev) => (prev < searchSuggestions.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSearchIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchSuggestions[selectedSearchIndex]) {
          handleSelectSuggestion(searchSuggestions[selectedSearchIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSearchDropdown(false);
      }
    } else if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      // First check if there's an exact match
      const exactMatch = entries.find(
        (entry) => entry.title.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (exactMatch) {
        onNavigate(exactMatch.title);
      } else {
        // Try to get search results first
        try {
          const results = await window.wikiAPI.searchAutocomplete(searchQuery);
          if (results && results.length > 0) {
            // Navigate to the first result
            onNavigate(results[0].title);
          }
        } catch (error) {
          console.error('Search error:', error);
        }
      }
      setSearchQuery('');
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    onNavigate(suggestion.title);
  };
  // Improved featured logic - prioritize entries with substantial content
  const featured = useMemo(() => {
    const candidates = entries.filter((e) => e.content && e.content.length > 500);
    return candidates.length > 0 ? candidates[0] : entries.length > 0 ? entries[0] : null;
  }, [entries]);

  // Recent entries - increased from 3 to 5
  const recent = useMemo(() => {
    return [...entries].sort((a, b) => b.id - a.id).slice(0, 5);
  }, [entries]);

  // On This Day - improved algorithm with real date matching
  const onThisDay = useMemo(() => {
    const today = new Date();
    const month = today.toLocaleString('en', { month: 'long' });
    const day = today.getDate();

    // Extract dates from content (e.g., "June 6", "6 June", "June 6, 1944")
    const datePattern = new RegExp(`(${month}\\s+${day}|${day}\\s+${month})`, 'i');

    const matches = entries.filter((e) => e.content && datePattern.test(e.content));

    if (matches.length > 0) return matches.slice(0, 3);

    // Fallback: random entries
    const shuffled = [...entries].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  }, [entries]);

  // Helper function to extract first paragraph
  const getFirstParagraph = (content) => {
    if (!content) return '';
    const paragraphs = content.split('\n\n');
    const firstPara = paragraphs[0] || content;
    return firstPara.substring(0, 400) + (firstPara.length > 400 ? '...' : '');
  };

  return (
    <div style={{ padding: '30px 40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Main Search Bar */}
      <div style={mainSearchContainerStyle}>
        <div style={searchWrapperStyle} ref={dropdownRef}>
          <Search size={18} style={{ color: '#72777d', marginRight: '10px' }} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search titles, content, and tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() =>
              searchQuery.trim().length >= 2 &&
              searchSuggestions.length > 0 &&
              setShowSearchDropdown(true)
            }
            style={mainSearchInputStyle}
          />
          {/* Search Results Dropdown */}
          {showSearchDropdown && searchSuggestions.length > 0 && (
            <div style={mainSearchDropdownStyle}>
              {searchSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  style={{
                    ...searchResultItemStyle,
                    backgroundColor: index === selectedSearchIndex ? '#f0f6ff' : '#fff',
                  }}
                  onMouseEnter={() => setSelectedSearchIndex(index)}
                >
                  <div
                    style={{
                      fontWeight: '600',
                      color: '#0645ad',
                      marginBottom: '4px',
                      fontSize: '1.05em',
                    }}
                  >
                    {suggestion.title}
                  </div>
                  {suggestion.snippet && (
                    <div
                      style={{
                        fontSize: '0.9em',
                        color: '#54595d',
                        marginBottom: '6px',
                        lineHeight: '1.4',
                      }}
                    >
                      {suggestion.snippet.substring(0, 120)}...
                    </div>
                  )}
                  {suggestion.tags && suggestion.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {suggestion.tags.slice(0, 4).map((tag, i) => (
                        <span key={i} style={searchTagStyle}>
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

      {/* Highlights Section - Full Width */}
      {featured && (
        <section style={highlightsSectionStyle}>
          <h2 style={highlightsTitleStyle}>Highlights</h2>
          <div style={featuredCardStyle}>
            <h1 style={featuredTitleStyle} onClick={() => onNavigate(featured.title)}>
              {featured.title}
            </h1>
            {featured.tags && featured.tags.length > 0 && (
              <div style={tagContainerStyle}>
                {featured.tags.map((tag) => (
                  <span key={tag} style={tagBadgeStyle}>
                    <Tag size={12} style={{ marginRight: '4px' }} /> {tag}
                  </span>
                ))}
              </div>
            )}
            <p style={featuredExcerptStyle}>{getFirstParagraph(featured.content)}</p>
            <button
              onClick={() => onNavigate(featured.title)}
              style={readMoreButtonStyle}
              onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
            >
              Read Full Briefing →
            </button>
          </div>
        </section>
      )}

      {/* Two-Column Grid */}
      <div style={gridContainerStyle}>
        {/* Latest Section */}
        <section style={sectionCardStyle}>
          <h3 style={sectionHeaderStyle}>
            <Clock size={18} style={{ marginRight: '8px' }} /> Latest
          </h3>
          <ul style={listStyle}>
            {recent.map((e) => (
              <li key={e.id} style={listItemStyle}>
                <a
                  href="#"
                  onClick={(evt) => {
                    evt.preventDefault();
                    onNavigate(e.title);
                  }}
                  style={linkStyle}
                  onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
                >
                  {e.title}
                </a>
                <div style={metaStyle}>
                  {e.timestamp &&
                    new Date(e.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                </div>
                <div style={excerptStyle}>
                  {e.content ? e.content.substring(0, 120) + '...' : ''}
                </div>
                {e.tags && e.tags.length > 0 && (
                  <div style={tagContainerSmallStyle}>
                    {e.tags.slice(0, 3).map((tag) => (
                      <span key={tag} style={tagBadgeSmallStyle}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* On This Day Section */}
        <section style={sectionCardStyle}>
          <h3 style={sectionHeaderStyle}>
            <Calendar size={18} style={{ marginRight: '8px' }} /> On This Day
          </h3>
          <p style={onThisDayDateStyle}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
          <ul style={listStyle}>
            {onThisDay.map((e) => (
              <li key={e.id} style={listItemOnThisDayStyle}>
                <a
                  href="#"
                  onClick={(evt) => {
                    evt.preventDefault();
                    onNavigate(e.title);
                  }}
                  style={linkStyle}
                  onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
                >
                  {e.title}
                </a>
                <div style={excerptStyle}>
                  {e.content ? e.content.substring(0, 100) + '...' : ''}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

// Styles
const highlightsSectionStyle = {
  marginBottom: '40px',
  padding: '25px',
  backgroundColor: '#f8f9fa',
  border: '1px solid #e1e4e8',
  borderRadius: '4px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const highlightsTitleStyle = {
  fontFamily: 'sans-serif',
  fontSize: '0.9em',
  color: '#72777d',
  borderBottom: '2px solid #36c',
  paddingBottom: '10px',
  marginBottom: '20px',
  textTransform: 'uppercase',
  fontWeight: '600',
  letterSpacing: '0.5px',
};

const featuredCardStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '4px',
};

const featuredTitleStyle = {
  fontFamily: "'Linux Libertine', Georgia, serif",
  fontSize: '2.2em',
  margin: '0 0 10px 0',
  cursor: 'pointer',
  color: '#000',
  transition: 'color 0.2s',
};

const tagContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginBottom: '15px',
};

const tagBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: '#e3f2fd',
  color: '#1565c0',
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '0.85em',
  fontWeight: '500',
};

const featuredExcerptStyle = {
  fontSize: '1.05em',
  lineHeight: '1.6',
  color: '#202122',
  userSelect: 'text',
  cursor: 'text',
  marginBottom: '15px',
};

const readMoreButtonStyle = {
  color: '#0645ad',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.95em',
  fontWeight: 'bold',
  padding: 0,
  transition: 'text-decoration 0.2s',
};

const gridContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
  gap: '30px',
  marginTop: '30px',
};

const sectionCardStyle = {
  border: '1px solid #e1e4e8',
  padding: '20px',
  backgroundColor: '#fff',
  borderRadius: '4px',
  minHeight: '400px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const sectionHeaderStyle = {
  fontFamily: 'sans-serif',
  fontSize: '1.1em',
  color: '#202122',
  borderBottom: '2px solid #36c',
  paddingBottom: '10px',
  marginBottom: '20px',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
};

const listStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const listItemStyle = {
  marginBottom: '20px',
  paddingBottom: '20px',
  borderBottom: '1px solid #eaecf0',
};

const listItemOnThisDayStyle = {
  marginBottom: '20px',
  paddingBottom: '15px',
  borderBottom: '1px solid #eaecf0',
};

const linkStyle = {
  fontSize: '1.05em',
  fontWeight: 'bold',
  color: '#0645ad',
  textDecoration: 'none',
  fontFamily: "'Linux Libertine', Georgia, serif",
  cursor: 'pointer',
  transition: 'text-decoration 0.2s',
};

const metaStyle = {
  fontSize: '0.85em',
  color: '#72777d',
  marginTop: '4px',
  marginBottom: '6px',
};

const excerptStyle = {
  fontSize: '0.9em',
  color: '#54595d',
  marginTop: '6px',
  lineHeight: '1.4',
  userSelect: 'text',
};

const tagContainerSmallStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginTop: '8px',
};

const tagBadgeSmallStyle = {
  backgroundColor: '#f0f0f0',
  color: '#555',
  padding: '2px 8px',
  borderRadius: '10px',
  fontSize: '0.75em',
  fontWeight: '500',
};

const onThisDayDateStyle = {
  fontSize: '0.95em',
  color: '#36c',
  fontWeight: '600',
  marginBottom: '15px',
  paddingBottom: '10px',
  borderBottom: '1px solid #eaecf0',
};

// Main Search Bar Styles
const mainSearchContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '40px',
};

const searchWrapperStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  maxWidth: '700px',
  border: '1px solid #a2a9b1',
  borderRadius: '24px',
  padding: '12px 20px',
  backgroundColor: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const mainSearchInputStyle = {
  flex: 1,
  border: 'none',
  outline: 'none',
  fontSize: '1.05em',
  backgroundColor: 'transparent',
  color: '#202122',
};

const mainSearchDropdownStyle = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: 0,
  right: 0,
  backgroundColor: '#fff',
  border: '1px solid #e1e4e8',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  maxHeight: '450px',
  overflowY: 'auto',
  zIndex: 1000,
};

const searchResultItemStyle = {
  padding: '14px 18px',
  cursor: 'pointer',
  borderBottom: '1px solid #f0f2f5',
  transition: 'background-color 0.15s',
};

const searchTagStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '0.8em',
  padding: '3px 8px',
  backgroundColor: '#e3f2fd',
  color: '#1565c0',
  borderRadius: '12px',
};

export default Dashboard;
