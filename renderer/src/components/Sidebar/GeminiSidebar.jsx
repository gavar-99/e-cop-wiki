import React, { useState } from 'react';

const GeminiSidebar = ({ contextEntries }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    setLoading(true);
    const aiResponse = await window.wikiAPI.askGemini(query, contextEntries);
    setResponse(aiResponse);
    setLoading(false);
  };

  return (
    <div
      className="ai-sidebar"
      style={{
        width: '300px',
        background: '#f8f9fa',
        borderLeft: '1px solid #ccc',
        padding: '15px',
      }}
    >
      <h3>Gemini AI Analyst</h3>
      <p style={{ fontSize: '0.8em' }}>
        Context: <strong>{contextEntries.length} articles selected</strong>
      </p>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask about political patterns..."
        style={{ width: '100%', height: '80px', marginBottom: '10px' }}
      />
      <button onClick={askAI} disabled={loading || contextEntries.length === 0}>
        {loading ? 'Analyzing...' : 'Analyze Context'}
      </button>
      <div
        className="ai-response"
        style={{ marginTop: '20px', whiteSpace: 'pre-wrap', fontSize: '0.9em' }}
      >
        {response}
      </div>
    </div>
  );
};

export default GeminiSidebar;
