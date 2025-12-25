import React, { useState, useEffect } from 'react';

const ArticleView = ({ entry, allEntries = [], onNavigate, onPinToAI, isPinned, userRole }) => {
  if (!entry) return <div>Entry not found.</div>;

  // Calculate Backlinks (What links here?)
  const backlinks = allEntries.filter(e => 
      e.id !== entry.id && e.content.includes(`[[${entry.title}]]`)
  );

  const handlePublish = async (id) => {
      const res = await window.wikiAPI.publishEntry(id);
      if(res.success) {
          alert('Published! CID: ' + res.cid);
      } else {
          alert('Error: ' + res.message);
      }
  };

  // Helper to render WikiLinks
  const renderContent = (text) => {
      const parts = text.split(/(\[\[.*?\]\])/g);
      return parts.map((part, index) => {
          if (part.startsWith('[[') && part.endsWith(']]')) {
              const link = part.slice(2, -2);
              return (
                  <span 
                    key={index} 
                    onClick={() => onNavigate(link)}
                    title={`Jump to ${link}`}
                    style={{ 
                        color: '#36c', 
                        cursor: 'pointer', 
                        textDecoration: 'none',
                        borderBottom: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => e.target.style.borderBottom = '1px solid #36c'}
                    onMouseLeave={(e) => e.target.style.borderBottom = '1px solid transparent'}
                  >
                      {link}
                  </span>
              );
          }
          return part;
      });
  };

  return (
    <div style={{ padding: '25px', width: '100%', backgroundColor: '#fff', minHeight: '100%' }}>
      
      {/* Title Header */}
      <h1 style={{ 
          fontFamily: "'Linux Libertine', Georgia, serif", 
          fontSize: '2.5em', 
          borderBottom: '1px solid #a2a9b1', 
          paddingBottom: '5px', 
          marginBottom: '20px',
          fontWeight: 'normal',
          color: '#000'
      }}>
        {entry.title}
      </h1>

      {/* Metadata / Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #eaecf0', borderRadius: '2px' }}>
         <div style={{ fontSize: '0.85em', color: '#555' }}>
            <strong>SHA-256:</strong> <code>{entry.sha256_hash?.substring(0, 12)}...</code>
         </div>
         <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => onPinToAI(entry)}
              style={{
                padding: '6px 12px',
                background: isPinned ? '#e3f2fd' : 'white',
                border: '1px solid #0645ad',
                color: '#0645ad',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '0.85em',
                fontWeight: 'bold'
              }}
            >
              {isPinned ? '✅ Pinned' : '📌 Pin to AI'}
            </button>
            {['admin', 'editor'].includes(userRole) && !entry.ipfs_cid && (
                 <button
                 onClick={() => handlePublish(entry.id)}
                 style={{
                   padding: '6px 12px',
                   background: '#fff',
                   border: '1px solid #28a745',
                   color: '#28a745',
                   borderRadius: '2px',
                   cursor: 'pointer',
                   fontSize: '0.85em',
                   fontWeight: 'bold'
                 }}
               >
                 🚀 Publish
               </button>
            )}
         </div>
      </div>

      {/* Main Content */}
      <div style={{ lineHeight: '1.6', fontSize: '1.05em', color: '#202122', fontFamily: 'sans-serif', maxWidth: '100%' }}>
        {renderContent(entry.content)}
      </div>

      {/* Assets */}
      {entry.asset_path && (
        <div style={{ marginTop: '20px', padding: '5px', border: '1px solid #ccc', display: 'inline-block', backgroundColor: '#f8f9fa', float: 'right', marginLeft: '20px', marginBottom: '10px' }}>
          <img
            src={`wiki-asset://${entry.asset_path}`}
            alt="Evidence"
            style={{ maxWidth: '300px', maxHeight: '300px' }}
          />
          <div style={{fontSize: '0.8em', color: '#666', marginTop: '2px', textAlign: 'center'}}>Attached Evidence</div>
        </div>
      )}

      {/* Backlinks Section */}
      {backlinks.length > 0 && (
        <div style={{ marginTop: '40px', borderTop: '1px solid #a2a9b1', paddingTop: '15px', clear: 'both' }}>
            <h3 style={{ fontFamily: "'Linux Libertine', Georgia, serif", color: '#54595d', fontSize: '1.2em' }}>Connected Intelligence (Backlinks)</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {backlinks.map(link => (
                    <div 
                        key={link.id}
                        onClick={() => onNavigate(link.title)}
                        style={{
                            padding: '6px 10px',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #a2a9b1',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            color: '#0645ad',
                            fontSize: '0.9em'
                        }}
                    >
                        ↳ {link.title}
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default ArticleView;
