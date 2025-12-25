import React, { useState, useEffect } from 'react';

const GeminiSidebar = ({ contextEntries, onClearContext }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [peerId, setPeerId] = useState(null);

  useEffect(() => {
    window.wikiAPI.getPeerId().then((res) => {
      if (res.success) setPeerId(res.id);
    });
  }, []);

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

      {contextEntries.length === 0 && (
        <div style={{ 
            backgroundColor: '#e3f2fd', 
            borderLeft: '3px solid #36c', 
            padding: '10px', 
            fontSize: '0.8em', 
            marginBottom: '15px', 
            color: '#0d47a1' 
        }}>
            <strong>AI Context:</strong> By "Pinning" multiple entries found through a keyword search to the AI Sidebar, you are telling Gemini to analyze the connections between those specific documents (e.g., "Find the common names mentioned across these three files").
        </div>
      )}

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

      <div style={{ borderTop: '2px solid #a2a9b1', marginTop: '10px', paddingTop: '10px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9em' }}>Private Swarm Network</h4>
        
        {peerId ? (
             <div style={{fontSize: '0.75em', marginBottom: '10px', wordBreak: 'break-all', color: '#008000'}}>
                <strong>Online Identity:</strong> {peerId}
             </div>
        ) : (
             <div style={{fontSize: '0.75em', marginBottom: '10px', color: '#d33'}}>
                <strong>Offline / Connecting...</strong>
             </div>
        )}

        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="/ip4/..."
            id="multiaddr"
            style={{ flex: 1, fontSize: '0.75em', padding: '4px' }}
          />
          <button
            onClick={async () => {
              const addr = document.getElementById('multiaddr').value;
              if (!addr) return;
              const res = await window.wikiAPI.connectSwarm(addr);
              alert(res.message);
            }}
            style={{ fontSize: '0.75em', cursor: 'pointer' }}
          >
            Connect
          </button>
        </div>

        <button 
            onClick={async () => {
                if(confirm('Generates a new shared secret key for a private network. This will overwrite existing keys. Continue?')) {
                   const res = await window.wikiAPI.createPrivateSwarm();
                   alert(res.message);
                }
            }}
            style={{width: '100%', fontSize: '0.75em', cursor: 'pointer', backgroundColor: '#eee', border: '1px solid #ccc'}}
        >
            🛠 Generate New Network Key
        </button>
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
