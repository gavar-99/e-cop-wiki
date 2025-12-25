import React, { useState } from 'react';
import ArticleReader from './components/Wiki/ArticleReader';
import EntryForm from './components/Wiki/EntryForm';
import GeminiSidebar from './components/Sidebar/GeminiSidebar';

const App = () => {
  const [pinnedEntries, setPinnedEntries] = useState([]);
  const [view, setView] = useState('reader');
  const [searchQuery, setSearchQuery] = useState(''); // NEW: Discovery State

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Navigation Bar */}
        <nav style={topNavStyle}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.2em', marginRight: '20px' }}>
              E-Cop Wiki
            </span>
            <button onClick={() => setView('reader')} style={navLinkStyle(view === 'reader')}>
              Read
            </button>
            <button onClick={() => setView('add')} style={navLinkStyle(view === 'add')}>
              + Create
            </button>
          </div>

          <div style={searchContainerStyle}>
            <input
              type="text"
              placeholder="Search local archive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchFieldStyle}
            />
          </div>
        </nav>

        <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
          {view === 'reader' ? (
            <ArticleReader
              onPinToAI={(entry) =>
                setPinnedEntries((prev) =>
                  prev.find((e) => e.id === entry.id)
                    ? prev.filter((e) => e.id !== entry.id)
                    : [...prev, entry]
                )
              }
              pinnedIds={pinnedEntries.map((e) => e.id)}
              filter={searchQuery} // Pass filter to the reader
            />
          ) : (
            <EntryForm onComplete={() => setView('reader')} />
          )}
        </div>
      </main>

      {/* AI Sidebar */}
      <aside
        style={{ width: '350px', borderLeft: '1px solid #a2a9b1', backgroundColor: '#f8f9fa' }}
      >
        <GeminiSidebar contextEntries={pinnedEntries} onClearContext={() => setPinnedEntries([])} />
      </aside>
    </div>
  );
};

const topNavStyle = {
  padding: '0 20px',
  height: '50px',
  backgroundColor: '#fff',
  borderBottom: '1px solid #a2a9b1',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};
const navLinkStyle = (active) => ({
  background: 'none',
  border: 'none',
  borderBottom: active ? '3px solid #36c' : 'none',
  cursor: 'pointer',
  height: '100%',
  padding: '0 10px',
  color: active ? '#36c' : '#202122',
});
const searchContainerStyle = {
  border: '1px solid #a2a9b1',
  padding: '4px 8px',
  borderRadius: '2px',
};
const searchFieldStyle = { border: 'none', outline: 'none', width: '200px' };

export default App;
