import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Dashboard from './components/Wiki/Dashboard';
import ArticleView from './components/Wiki/ArticleView';
import EntryForm from './components/Wiki/EntryForm';
import GeminiSidebar from './components/Sidebar/GeminiSidebar';
import Login from './components/Auth/Login';
import TitleBar from './components/Layout/TitleBar';
import Settings from './components/Admin/Settings';

const App = () => {
  const [entries, setEntries] = useState([]);
  const [pinnedEntries, setPinnedEntries] = useState([]);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'article', 'add', 'edit'
  const [currentEntry, setCurrentEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null); // Entry being edited
  const [searchQuery, setSearchQuery] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [integrityIssues, setIntegrityIssues] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Search autocomplete state
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const searchInputRef = useRef(null);

  // Navigation history state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const isResizing = useRef(false);

  const resize = useCallback((e) => {
    if (isResizing.current) {
      const newWidth = document.body.clientWidth - e.clientX;
      if (newWidth > 250 && newWidth < 800) {
        setSidebarWidth(newWidth);
      }
    }
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, [resize]);

  const startResizing = useCallback(
    (e) => {
      isResizing.current = true;
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      e.preventDefault();
    },
    [resize, stopResizing]
  );

  const loadEntries = async () => {
    const data = await window.wikiAPI.getEntries();
    setEntries(data);
  };

  useEffect(() => {
    if (currentUser) {
      loadEntries();
      window.wikiAPI.verifyIntegrity().then((issues) => {
        if (issues && issues.length > 0) {
          setIntegrityIssues(issues);
        }
      });
    }
  }, [currentUser]);

  // Listen for menu events
  useEffect(() => {
    if (window.wikiAPI.onOpenUserManagement) {
      window.wikiAPI.onOpenUserManagement(() => {
        setShowSettings(true);
      });
    }
    if (window.wikiAPI.onLogout) {
      window.wikiAPI.onLogout(() => {
        handleLogout();
      });
    }
  }, []);

  // Search autocomplete with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        try {
          const suggestions = await window.wikiAPI.searchAutocomplete(searchQuery);
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

  const handleLogout = async () => {
    await window.wikiAPI.logout();
    setCurrentUser(null);
  };

  const handleSearchKeyDown = (e) => {
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
    } else if (e.key === 'Enter') {
      handleNavigate(searchQuery);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.title);
    setShowSearchDropdown(false);
    handleNavigate(suggestion.title);
  };

  const handleNavigate = async (titleOrQuery, skipHistory = false) => {
    // First try exact title match
    const exactMatch = entries.find((e) => e.title.toLowerCase() === titleOrQuery.toLowerCase());

    if (exactMatch) {
      setCurrentEntry(exactMatch);
      setView('article');

      // Add to history
      if (!skipHistory) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ type: 'article', entry: exactMatch });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    } else {
      // Try FTS5 search
      const searchResults = await window.wikiAPI.searchEntries(titleOrQuery);

      if (searchResults.length > 0) {
        // Update entries with search results
        setEntries(searchResults);
        setView('dashboard');
      } else {
        if (canEdit) {
          // If not found, switch to creation mode with this title
          setDraftTitle(titleOrQuery);
          setView('add');
        } else {
          alert(`No entries found for "${titleOrQuery}".`);
        }
      }
    }
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];

      if (prevState.type === 'article') {
        setCurrentEntry(prevState.entry);
        setView('article');
        setHistoryIndex(prevIndex);
      }
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];

      if (nextState.type === 'article') {
        setCurrentEntry(nextState.entry);
        setView('article');
        setHistoryIndex(nextIndex);
      }
    }
  };

  const handlePin = (entry) => {
    setPinnedEntries((prev) =>
      prev.find((e) => e.id === entry.id) ? prev.filter((e) => e.id !== entry.id) : [...prev, entry]
    );
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setView('edit');
  };

  const handleDelete = async (entryId) => {
    try {
      const result = await window.wikiAPI.deleteEntry(entryId);
      if (result.success) {
        alert('Entry deleted successfully');
        await loadEntries();
        setView('dashboard');
        setCurrentEntry(null);
      } else {
        alert('Error deleting entry: ' + result.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting entry: ' + error.message);
    }
  };

  if (!currentUser) {
    return (
      <>
        <TitleBar transparent={true} />
        <Login onLogin={setCurrentUser} />
      </>
    );
  }

  const canEdit = ['admin', 'editor'].includes(currentUser.role);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>
      <TitleBar
        transparent={false}
        userRole={currentUser.role}
        onManageUsers={() => setShowSettings(true)}
        onExit={() => window.wikiAPI.close()}
      />
      {showSettings && currentUser.role === 'admin' && (
        <Settings onClose={() => setShowSettings(false)} currentUser={currentUser} />
      )}
      <div style={{ height: '32px' }} /> {/* Spacer for TitleBar */}
      {integrityIssues.length > 0 && (
        <div
          style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '10px',
            textAlign: 'center',
            borderBottom: '1px solid #ef9a9a',
            fontWeight: 'bold',
          }}
        >
          ⚠️ SECURITY ALERT: {integrityIssues.length} research entries have failed integrity checks.
        </div>
      )}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <main
          style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}
        >
          {/* Navigation Bar */}
          <nav style={topNavStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              {/* Top Row: Logo, Nav Links, Search, User Status */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #e1e4e8',
                }}
              >
                {/* Logo and Nav Links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                  <span
                    style={{
                      fontFamily: 'Milker',
                      fontSize: '2.5em',
                      color: '#202122',
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      lineHeight: '1',
                    }}
                    onClick={() => setView('dashboard')}
                  >
                    E-Cop Wiki
                  </span>

                  {/* Navigation Links */}
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button
                      onClick={() => setView('dashboard')}
                      style={navLinkStyle(view === 'dashboard')}
                    >
                      Home
                    </button>
                    {canEdit && (
                      <button onClick={() => setView('add')} style={navLinkStyle(view === 'add')}>
                        Create
                      </button>
                    )}
                  </div>
                </div>

                {/* User Status */}
                <div
                  style={{
                    fontSize: '0.85em',
                    color: '#555',
                    backgroundColor: '#f0f2f5',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid #e1e4e8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#4caf50',
                      display: 'inline-block',
                    }}
                  ></span>
                  <strong>{currentUser.username}</strong>
                  {currentUser.username.toLowerCase() !== currentUser.role.toLowerCase() && (
                    <>
                      <span style={{ color: '#999' }}>·</span>
                      <span
                        style={{
                          backgroundColor: currentUser.role === 'admin' ? '#e3f2fd' : '#f3e5f5',
                          color: currentUser.role === 'admin' ? '#1565c0' : '#7b1fa2',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.9em',
                          fontWeight: '500',
                        }}
                      >
                        {currentUser.role}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Bottom Row: Back/Forward Navigation */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingTop: '8px' }}>
                <button
                  onClick={goBack}
                  disabled={historyIndex <= 0}
                  title="Go Back"
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
                    fontSize: '1.1em',
                    color: historyIndex <= 0 ? '#ccc' : '#36c',
                    transition: 'color 0.15s',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => historyIndex > 0 && (e.target.style.color = '#1565c0')}
                  onMouseLeave={(e) => historyIndex > 0 && (e.target.style.color = '#36c')}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={goForward}
                  disabled={historyIndex >= history.length - 1}
                  title="Go Forward"
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '1.1em',
                    color: historyIndex >= history.length - 1 ? '#ccc' : '#36c',
                    transition: 'color 0.15s',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) =>
                    historyIndex < history.length - 1 && (e.target.style.color = '#1565c0')
                  }
                  onMouseLeave={(e) =>
                    historyIndex < history.length - 1 && (e.target.style.color = '#36c')
                  }
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </nav>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {view === 'dashboard' ? (
              <Dashboard entries={entries} onNavigate={handleNavigate} />
            ) : view === 'article' ? (
              <ArticleView
                entry={currentEntry}
                allEntries={entries} // Pass full list for backlink analysis
                onNavigate={handleNavigate}
                onPinToAI={handlePin}
                isPinned={pinnedEntries.some((e) => e.id === currentEntry?.id)}
                userRole={currentUser.role}
                currentUsername={currentUser.username}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ) : view === 'add' || view === 'edit' ? (
              canEdit ? (
                <EntryForm
                  mode={view === 'edit' ? 'edit' : 'create'}
                  entry={editingEntry}
                  userRole={currentUser.role}
                  initialTitle={draftTitle}
                  onComplete={() => {
                    loadEntries();
                    setView('dashboard');
                    setDraftTitle('');
                    setEditingEntry(null);
                  }}
                />
              ) : (
                <div>Access Denied</div>
              )
            ) : null}
          </div>
        </main>

        {/* Resizer Handle */}
        <div
          onMouseDown={startResizing}
          style={{
            width: '4px',
            cursor: 'col-resize',
            backgroundColor: '#e1e4e8',
            transition: 'background-color 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#36c')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#e1e4e8')}
        />

        {/* AI Sidebar */}
        <aside style={{ width: `${sidebarWidth}px`, backgroundColor: '#f8f9fa' }}>
          <GeminiSidebar
            contextEntries={pinnedEntries}
            onClearContext={() => setPinnedEntries([])}
          />
        </aside>
      </div>
    </div>
  );
};

const topNavStyle = {
  padding: '15px 30px',
  backgroundColor: '#fff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  zIndex: 10,
};

const navLinkStyle = (active) => ({
  background: 'none',
  border: 'none',
  borderBottom: active ? '2px solid #36c' : '2px solid transparent',
  cursor: 'pointer',
  padding: '8px 5px',
  color: active ? '#36c' : '#555',
  fontFamily: 'sans-serif',
  fontSize: '1em',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  letterSpacing: '0.5px',
  fontWeight: '500',
});

const searchContainerStyle = {
  border: '1px solid #e1e4e8',
  padding: '6px 12px',
  borderRadius: '20px',
  backgroundColor: '#f8f9fa',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  display: 'flex',
  alignItems: 'center',
};

const searchFieldStyle = {
  border: 'none',
  outline: 'none',
  width: '500px',
  backgroundColor: 'transparent',
  fontSize: '0.95em',
};

const searchDropdownStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: '4px',
  backgroundColor: '#fff',
  border: '1px solid #e1e4e8',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  maxHeight: '400px',
  overflowY: 'auto',
  zIndex: 1000,
};

const searchSuggestionItemStyle = {
  padding: '10px 14px',
  cursor: 'pointer',
  borderBottom: '1px solid #f0f2f5',
  transition: 'background-color 0.15s',
};

export default App;
