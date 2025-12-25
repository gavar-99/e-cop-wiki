import React, { useState } from 'react';
import ArticleReader from './components/Wiki/ArticleReader';
import EntryForm from './components/Wiki/EntryForm';
import GeminiSidebar from './components/Sidebar/GeminiSidebar';

const App = () => {
  // State to manage the "Context Bucket" for Gemini
  const [pinnedEntries, setPinnedEntries] = useState([]);
  const [view, setView] = useState('reader'); // 'reader' or 'add'

  // Logic to add/remove entries from the AI context
  const handlePinToAI = (entry) => {
    setPinnedEntries((prev) => {
      const exists = prev.find((e) => e.id === entry.id);
      if (exists) {
        // Remove if already pinned
        return prev.filter((e) => e.id !== entry.id);
      }
      // Add to bucket
      return [...prev, entry];
    });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Main Content Area: Wikipedia-style */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#fff',
          borderRight: '1px solid #e2e2e2',
        }}
      >
        <nav
          style={{
            padding: '10px 20px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #a2a9b1',
            display: 'flex',
            gap: '20px',
          }}
        >
          <button onClick={() => setView('reader')} style={navButtonStyle(view === 'reader')}>
            Read Wiki
          </button>
          <button onClick={() => setView('add')} style={navButtonStyle(view === 'add')}>
            + New Entry
          </button>
        </nav>

        <div style={{ padding: '20px' }}>
          {view === 'reader' ? (
            <ArticleReader onPinToAI={handlePinToAI} pinnedIds={pinnedEntries.map((e) => e.id)} />
          ) : (
            <EntryForm onComplete={() => setView('reader')} />
          )}
        </div>
      </main>

      {/* AI Sidebar Area */}
      <aside style={{ width: '350px', backgroundColor: '#f8f9fa' }}>
        <GeminiSidebar contextEntries={pinnedEntries} onClearContext={() => setPinnedEntries([])} />
      </aside>
    </div>
  );
};

const navButtonStyle = (isActive) => ({
  padding: '8px 16px',
  border: 'none',
  borderBottom: isActive ? '3px solid #36c' : 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  fontWeight: isActive ? 'bold' : 'normal',
  color: isActive ? '#36c' : '#202122',
});

export default App;
