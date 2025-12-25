import React, { useState } from 'react';

const GeminiSidebar = ({ contextEntries, onClearContext }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const askAI = async (presetQuery = null) => {
    setLoading(true);
    const finalQuery = presetQuery || query;
    const aiResponse = await window.wikiAPI.askGemini(finalQuery, contextEntries);
    setResponse(aiResponse);
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>AI Analyst</h3>
        <button
          onClick={onClearContext}
          style={{
            fontSize: '0.7em',
            color: '#d33',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          Clear Context
        </button>
      </div>

      <p style={{ fontSize: '0.85em', color: '#54595d' }}>
        {contextEntries.length} articles selected as context.
      </p>

      {/* Preset Actions */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <button
          onClick={() => askAI('Summarize the main connections between these entities.')}
          style={actionBtnStyle}
        >
          🔗 Find Links
        </button>
        <button
          onClick={() => askAI('Identify any conflicting information or risks.')}
          style={actionBtnStyle}
        >
          ⚠️ Risk Audit
        </button>
      </div>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask a custom question..."
        style={{ width: '100%', height: '100px', marginBottom: '10px', padding: '8px' }}
      />

      <button
        onClick={() => askAI()}
        disabled={loading || contextEntries.length === 0}
        style={{
          padding: '10px',
          backgroundColor: '#36c',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          opacity: loading || contextEntries.length === 0 ? 0.5 : 1,
        }}
      >
        {loading ? 'Processing...' : 'Analyze Selection'}
      </button>

      <div
        style={{
          marginTop: '20px',
          flex: 1,
          overflowY: 'auto',
          fontSize: '0.9em',
          lineHeight: '1.5',
          borderTop: '1px solid #ddd',
          paddingTop: '15px',
        }}
      >
        {response}
      </div>
    </div>
  );
};

const actionBtnStyle = {
  fontSize: '0.75em',
  padding: '4px 8px',
  borderRadius: '12px',
  border: '1px solid #36c',
  background: '#fff',
  color: '#36c',
  cursor: 'pointer',
};

export default GeminiSidebar;
