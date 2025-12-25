import React, { useEffect, useState } from 'react';

const ArticleReader = ({ onPinToAI, pinnedIds = [] }) => {
  const [entries, setEntries] = useState([]);

  // Load entries from the local vault on mount
  const loadEntries = async () => {
    const data = await window.wikiAPI.getEntries();
    setEntries(data);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handlePublish = async (entryId) => {
    const res = await window.wikiAPI.publishEntry(entryId);
    if (res.success) {
      alert(`Successfully published to the Private Swarm!\nCID: ${res.cid}`);
      loadEntries(); // Refresh to show the new CID
    } else {
      alert('Publication failed: ' + res.message);
    }
  };

  return (
    <div className="wiki-container" style={{ padding: '20px', flex: 1 }}>
      <h1 style={{ borderBottom: '1px solid #a2a9b1', fontFamily: 'serif', paddingBottom: '10px' }}>
        Political Archive
      </h1>

      {entries.length === 0 && <p>No research entries found in the local vault.</p>}

      {entries.map((entry) => (
        <article
          key={entry.id}
          style={{ marginBottom: '40px', borderBottom: '1px shadow #eee', paddingBottom: '20px' }}
        >
          <h2 style={{ marginBottom: '5px' }}>{entry.title}</h2>

          <div
            style={{
              display: 'flex',
              gap: '15px',
              fontSize: '0.85em',
              color: '#54595d',
              marginBottom: '15px',
            }}
          >
            <span>
              Hash:{' '}
              <code style={{ background: '#f8f9fa', padding: '2px 4px' }}>
                {entry.sha256_hash?.substring(0, 12)}...
              </code>
            </span>
            {entry.ipfs_cid && (
              <span style={{ color: '#00a82d' }}>
                🌐 Published: <code>{entry.ipfs_cid.substring(0, 12)}...</code>
              </span>
            )}
          </div>

          <div className="content" style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {entry.content}
          </div>

          {entry.asset_path && (
            <div style={{ marginTop: '15px' }}>
              <img
                src={`wiki-asset://${entry.asset_path}`}
                alt="Evidence"
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                }}
              />
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* AI Context Button */}
            <button
              onClick={() => onPinToAI(entry)}
              style={{
                padding: '6px 12px',
                backgroundColor: pinnedIds.includes(entry.id) ? '#eaf3ff' : '#fff',
                border: pinnedIds.includes(entry.id) ? '1px solid #36c' : '1px solid #a2a9b1',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '0.9em',
              }}
            >
              {pinnedIds.includes(entry.id) ? '✅ Pinned to AI' : '📌 Pin to AI Context'}
            </button>

            {/* IPFS Publish Button */}
            {!entry.ipfs_cid ? (
              <button
                onClick={() => handlePublish(entry.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #a2a9b1',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontSize: '0.9em',
                }}
              >
                🚀 Verify & Publish to Swarm
              </button>
            ) : (
              <span style={{ fontSize: '0.85em', color: '#72777d', fontStyle: 'italic' }}>
                Verification Complete (Pinned to Swarm)
              </span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

export default ArticleReader;
