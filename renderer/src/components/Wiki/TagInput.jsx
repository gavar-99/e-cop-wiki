import React, { useState, useEffect, useRef } from 'react';

const TagInput = ({ tags = [], onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    // Load all existing tags for autocomplete
    const loadTags = async () => {
      const tagList = await window.wikiAPI.getAllTags();
      setAllTags(tagList);
    };
    loadTags();
  }, []);

  useEffect(() => {
    // Filter suggestions based on input
    if (inputValue.trim()) {
      const filtered = allTags
        .filter(
          (t) => t.name.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(t.name)
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, tags, allTags]);

  const addTag = (tagName) => {
    const normalized = tagName.trim();
    if (normalized && !tags.includes(normalized)) {
      onChange([...tags, normalized]);
      setInputValue('');
      setShowSuggestions(false);

      // Check if this is a new tag
      const isNewTag = !allTags.find((t) => t.name.toLowerCase() === normalized.toLowerCase());
      if (isNewTag) {
        console.log(`✨ Creating new tag: "${normalized}"`);
      }
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && suggestions[selectedIndex]) {
        addTag(suggestions[selectedIndex].name);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={containerStyle}>
        {tags.map((tag, index) => (
          <div key={index} style={chipStyle}>
            <span>{tag}</span>
            <button onClick={() => removeTag(tag)} style={removeButtonStyle} type="button">
              ×
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowSuggestions(suggestions.length > 0)}
          placeholder={tags.length === 0 ? 'Add tags (e.g., WW2, Joe Biden, Military)...' : ''}
          style={inputStyle}
        />
      </div>

      {showSuggestions && (
        <div style={suggestionsContainerStyle}>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onClick={() => addTag(suggestion.name)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                ...suggestionItemStyle,
                backgroundColor: index === selectedIndex ? '#e3f2fd' : '#fff',
              }}
            >
              <span style={{ fontWeight: 'bold' }}>{suggestion.name}</span>
              <span style={{ fontSize: '0.85em', color: '#666', marginLeft: '8px' }}>
                ({suggestion.count} {suggestion.count === 1 ? 'entry' : 'entries'})
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
        Press <strong>Enter</strong> or <strong>comma</strong> to add tag. Multi-word tags are
        supported (e.g., "Joe Biden").
      </div>
    </div>
  );
};

// Styles
const containerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  padding: '10px 12px',
  border: '1px solid #e1e4e8',
  borderRadius: '8px',
  backgroundColor: '#fafbfc',
  minHeight: '46px',
  alignItems: 'center',
  cursor: 'text',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const chipStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '5px 12px',
  backgroundColor: '#1565c0',
  color: '#fff',
  borderRadius: '20px',
  fontSize: '0.85em',
  fontWeight: '600',
  whiteSpace: 'nowrap',
  boxShadow: '0 1px 3px rgba(21, 101, 192, 0.3)',
};

const removeButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'rgba(255,255,255,0.8)',
  fontSize: '1.2em',
  cursor: 'pointer',
  padding: '0',
  lineHeight: '1',
  fontWeight: 'bold',
  marginLeft: '2px',
  transition: 'color 0.15s',
};

const inputStyle = {
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  fontSize: '0.9em',
  flex: 1,
  minWidth: '150px',
  padding: '4px',
  color: '#202122',
};

const suggestionsContainerStyle = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  backgroundColor: '#fff',
  border: '1px solid #e1e4e8',
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  zIndex: 1000,
  maxHeight: '200px',
  overflowY: 'auto',
};

const suggestionItemStyle = {
  padding: '12px 14px',
  cursor: 'pointer',
  borderBottom: '1px solid #f0f2f5',
  transition: 'background-color 0.15s',
};

export default TagInput;
