import React, { useState, useEffect, useRef, useCallback } from 'react';
import Dashboard from './components/Wiki/Dashboard';
import ArticleView from './components/Wiki/ArticleView';
import EntryForm from './components/Wiki/EntryForm';
import GeminiSidebar from './components/Sidebar/GeminiSidebar';
import Login from './components/Auth/Login';
import TitleBar from './components/Layout/TitleBar';
import UserManagement from './components/Admin/UserManagement';

const App = () => {
  const [entries, setEntries] = useState([]);
  const [pinnedEntries, setPinnedEntries] = useState([]);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'article', 'add'
  const [currentEntry, setCurrentEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [integrityIssues, setIntegrityIssues] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  
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

  const startResizing = useCallback((e) => {
    isResizing.current = true;
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  }, [resize, stopResizing]);

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

  const handleLogout = async () => {
      await window.wikiAPI.logout();
      setCurrentUser(null);
  };

  const handleNavigate = (title) => {
      const entry = entries.find(e => e.title.toLowerCase() === title.toLowerCase());
      if (entry) {
          setCurrentEntry(entry);
          setView('article');
      } else {
          if (canEdit) {
              // If not found, switch to creation mode with this title
              setDraftTitle(title);
              setView('add');
          } else {
              alert(`Entry "${title}" not found.`);
          }
      }
  };

  const handlePin = (entry) => {
    setPinnedEntries((prev) =>
        prev.find((e) => e.id === entry.id)
        ? prev.filter((e) => e.id !== entry.id)
        : [...prev, entry]
    );
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
          <UserManagement onClose={() => setShowSettings(false)} />
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
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
          {/* Navigation Bar */}
          <nav style={topNavStyle}>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <span style={{ 
                fontFamily: 'Milker', 
                fontSize: '2.2em', 
                marginRight: '10px', 
                color: '#202122',
                letterSpacing: '1px',
                position: 'relative',
                top: '2px',
                cursor: 'pointer'
            }} onClick={() => setView('dashboard')}>
              E-Cop Wiki
            </span>
            <div style={{display: 'flex', gap: '15px'}}>
                <button onClick={() => setView('dashboard')} style={navLinkStyle(view === 'dashboard')}>
                Home
                </button>
                {canEdit && (
                    <button onClick={() => setView('add')} style={navLinkStyle(view === 'add')}>
                    + Create
                    </button>
                )}
            </div>
            <div style={searchContainerStyle}>
                <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                    if(e.key === 'Enter') handleNavigate(searchQuery);
                }}
                style={searchFieldStyle}
                />
            </div>
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <div style={{
                fontSize: '0.85em', 
                color: '#555', 
                backgroundColor: '#f0f2f5', 
                padding: '6px 12px', 
                borderRadius: '20px',
                border: '1px solid #e1e4e8',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
            }}>
                <span style={{width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4caf50', display: 'inline-block'}}></span>
                <strong>{currentUser.username}</strong>
            </div>
            <button onClick={handleLogout} style={logoutBtnStyle}>
                Logout
            </button>
          </div>
        </nav>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {view === 'dashboard' ? (
            <Dashboard 
                entries={entries} 
                onNavigate={handleNavigate} 
            />
          ) : view === 'article' ? (
             <ArticleView 
                entry={currentEntry}
                allEntries={entries} // Pass full list for backlink analysis
                onNavigate={handleNavigate}
                onPinToAI={handlePin}
                isPinned={pinnedEntries.some(e => e.id === currentEntry?.id)}
                userRole={currentUser.role}
             />
          ) : (
            canEdit ? <EntryForm initialTitle={draftTitle} onComplete={() => { loadEntries(); setView('dashboard'); setDraftTitle(''); }} /> : <div>Access Denied</div>
          )}
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
            zIndex: 10
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#36c'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#e1e4e8'}
      />

      {/* AI Sidebar */}
      <aside
        style={{ width: `${sidebarWidth}px`, backgroundColor: '#f8f9fa' }}
      >
        <GeminiSidebar contextEntries={pinnedEntries} onClearContext={() => setPinnedEntries([])} />
      </aside>
      </div>
    </div>
  );
};

const topNavStyle = {
  padding: '0 30px',
  height: '64px',
  backgroundColor: '#fff',
  borderBottom: '1px solid #e1e4e8',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  zIndex: 10
};

const navLinkStyle = (active) => ({
  background: 'none',
  border: 'none',
  borderBottom: active ? '3px solid #36c' : '3px solid transparent',
  cursor: 'pointer',
  height: '64px',
  padding: '0 5px',
  color: active ? '#36c' : '#555',
  fontFamily: 'sans-serif',
  fontSize: '1em',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  letterSpacing: '0.5px',
  fontWeight: '500'
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
    fontSize: '0.95em'
};

const logoutBtnStyle = {
    background: 'none',
    border: '1px solid #ffcdd2',
    color: '#d32f2f',
    borderRadius: '6px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '0.85em',
    fontWeight: 'bold',
    transition: 'background 0.2s'
};

export default App;