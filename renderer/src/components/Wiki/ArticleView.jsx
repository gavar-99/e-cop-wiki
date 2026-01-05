import React, { useState, useEffect } from 'react';

const ArticleView = ({
  entry,
  allEntries = [],
  onNavigate,
  onPinToAI,
  isPinned,
  userRole,
  currentUsername = '',
  onEdit = null,
  onDelete = null,
}) => {
  const [assets, setAssets] = useState([]);
  const [infobox, setInfobox] = useState([]);

  if (!entry) return <div>Entry not found.</div>;

  // Load assets and infobox data
  useEffect(() => {
    const loadData = async () => {
      try {
        const assetsData = await window.wikiAPI.getEntryAssets(entry.id);
        setAssets(assetsData || []);

        const infoboxData = await window.wikiAPI.getEntryInfobox(entry.id);
        setInfobox(infoboxData || []);
      } catch (error) {
        console.error('Failed to load entry data:', error);
      }
    };

    loadData();
  }, [entry.id]);

  // Calculate Backlinks (What links here?)
  const backlinks = allEntries.filter(
    (e) => e.id !== entry.id && e.content.includes(`[[${entry.title}]]`)
  );

  const handlePublish = async (id) => {
    const res = await window.wikiAPI.publishEntry(id);
    if (res.success) {
      alert('Published! CID: ' + res.cid);
    } else {
      alert('Error: ' + res.message);
    }
  };

  const handleDeleteClick = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${entry.title}"? This action can be reversed by admins.`
      )
    ) {
      return;
    }

    if (onDelete) {
      onDelete(entry.id);
    }
  };

  // Permission check: admin can edit/delete all, editor can only edit/delete own entries
  const canEditDelete =
    userRole === 'admin' || (userRole === 'editor' && entry.author_username === currentUsername);

  // Helper to render WikiLinks and #hashtags (supports underscores for multi-word tags)
  const renderContent = (text) => {
    // Split by WikiLinks and hashtags (including those with underscores)
    const parts = text.split(/(\[\[.*?\]\]|#[\w_]+)/g);
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
              borderBottom: '1px solid transparent',
            }}
            onMouseEnter={(e) => (e.target.style.borderBottom = '1px solid #36c')}
            onMouseLeave={(e) => (e.target.style.borderBottom = '1px solid transparent')}
          >
            {link}
          </span>
        );
      } else if (part.startsWith('#') && /^#[\w_]+$/.test(part)) {
        const tag = part.slice(1);
        // Convert underscores to spaces for searching (tags are stored with spaces)
        const searchTag = tag.replace(/_/g, ' ');
        return (
          <span
            key={index}
            onClick={() => onNavigate(searchTag)}
            title={`Search for ${searchTag}`}
            style={{
              color: '#1565c0',
              cursor: 'pointer',
              fontWeight: '500',
              backgroundColor: 'rgba(255, 193, 7, 0.3)',
              padding: '2px 6px',
              borderRadius: '3px',
            }}
          >
            {tag}
          </span>
        );
      }
      return part;
    });
  };

  // Check if this article IS a keyword article
  // Logic: 1. Exact match (Title == Tag)
  //        2. Contained match (Title contains Tag as whole word)
  const isKeywordArticle = entry.tags?.some((tag) => {
    if (tag.toLowerCase() === entry.title.toLowerCase()) return true;
    const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tagRegex = new RegExp(`\\b${escapedTag}\\b`, 'i');
    return tagRegex.test(entry.title);
  });

  return (
    <div style={{ padding: '25px', width: '100%', backgroundColor: '#fff', minHeight: '100%' }}>
      {/* Title Header */}
      <h1
        style={{
          fontFamily: "'Linux Libertine', Georgia, serif",
          fontSize: '2.5em',
          borderBottom: '1px solid #a2a9b1',
          paddingBottom: '5px',
          marginBottom: '20px',
          fontWeight: 'normal',
          color: isKeywordArticle ? '#1565c0' : '#000', // Highlight keyword articles
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {entry.title}
        {isKeywordArticle && (
          <span
            style={{
              fontSize: '0.4em',
              backgroundColor: '#ffc107',
              color: '#000',
              padding: '3px 10px',
              borderRadius: '4px',
              verticalAlign: 'middle',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              fontWeight: 'bold',
            }}
          >
            Tag
          </span>
        )}
      </h1>

      {/* Tags Display */}
      {entry.tags && entry.tags.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '15px',
            paddingBottom: '15px',
            borderBottom: '1px solid #eaecf0',
          }}
        >
          {entry.tags.map((tag, index) => (
            <span
              key={index}
              onClick={() => onNavigate(tag)}
              style={{
                padding: '5px 12px',
                backgroundColor: '#e3f2fd',
                color: '#1565c0',
                borderRadius: '16px',
                fontSize: '0.85em',
                fontWeight: '500',
                cursor: 'pointer',
                border: '1px solid #90caf9',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#bbdefb')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#e3f2fd')}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Metadata / Actions Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #eaecf0',
          borderRadius: '2px',
        }}
      >
        <div style={{ fontSize: '0.85em', color: '#555' }}>
          <strong>SHA-256:</strong> <code>{entry.sha256_hash?.substring(0, 12)}...</code>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {canEditDelete && onEdit && (
            <button
              onClick={() => onEdit(entry)}
              style={{
                padding: '6px 12px',
                background: '#fff',
                border: '1px solid #0645ad',
                color: '#0645ad',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '0.85em',
                fontWeight: 'bold',
              }}
            >
              ✏️ Edit
            </button>
          )}
          {canEditDelete && onDelete && (
            <button
              onClick={handleDeleteClick}
              style={{
                padding: '6px 12px',
                background: '#fff',
                border: '1px solid #dc3545',
                color: '#dc3545',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '0.85em',
                fontWeight: 'bold',
              }}
            >
              🗑️ Delete
            </button>
          )}
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
              fontWeight: 'bold',
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
                fontWeight: 'bold',
              }}
            >
              🚀 Publish
            </button>
          )}
        </div>
      </div>

      {/* Infobox (Wikipedia-style) */}
      {infobox.length > 0 && (
        <table
          style={{
            float: 'right',
            marginLeft: '20px',
            marginBottom: '10px',
            border: '1px solid #a2a9b1',
            backgroundColor: '#f8f9fa',
            width: '300px',
            fontSize: '0.9em',
            borderCollapse: 'collapse',
          }}
        >
          <tbody>
            {infobox.map((field, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #a2a9b1' }}>
                <th
                  style={{
                    padding: '8px',
                    backgroundColor: '#eaecf0',
                    fontWeight: '600',
                    textAlign: 'right',
                    verticalAlign: 'top',
                    width: '35%',
                    color: '#202122',
                    borderRight: '1px solid #a2a9b1',
                  }}
                >
                  {field.field_key}
                </th>
                <td
                  style={{
                    padding: '8px',
                    color: '#202122',
                    verticalAlign: 'top',
                  }}
                >
                  {field.field_value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Main Content */}
      <div
        style={{
          lineHeight: '1.6',
          fontSize: '1.05em',
          color: '#202122',
          fontFamily: 'sans-serif',
          maxWidth: '100%',
          userSelect: 'text',
          cursor: 'text',
        }}
      >
        {renderContent(entry.content)}
      </div>

      {/* Multiple Assets Section */}
      {assets.length > 0 && (
        <div style={{ marginTop: '30px', clear: 'both' }}>
          <h3
            style={{
              fontFamily: "'Linux Libertine', Georgia, serif",
              color: '#54595d',
              fontSize: '1.2em',
              borderBottom: '1px solid #a2a9b1',
              paddingBottom: '5px',
              marginBottom: '15px',
            }}
          >
            Attached Evidence
          </h3>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              marginTop: '15px',
            }}
          >
            {assets.map((asset, index) => {
              const ext = asset.asset_path.split('.').pop().toLowerCase();
              const isPdf = ext === 'pdf';
              const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
              const fileName = asset.asset_path.split(/[/\\]/).pop();

              return (
                <div
                  key={asset.id}
                  style={{
                    border: '1px solid #c8ccd1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  }}
                >
                  {/* Header with filename and actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: '#f8f9fa',
                      borderBottom: '1px solid #e1e4e8',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2em' }}>
                        {isPdf ? '📄' : isImage ? '🖼️' : '📁'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.95em',
                          fontWeight: '500',
                          color: '#24292f',
                          maxWidth: '400px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {fileName}
                      </span>
                    </div>
                    <button
                      onClick={() => window.open(`wiki-asset://${asset.asset_path}`, '_blank')}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: '#0645ad',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.85em',
                        cursor: 'pointer',
                        fontWeight: '500',
                      }}
                    >
                      Open Full Size
                    </button>
                  </div>

                  {/* Content area */}
                  {isImage ? (
                    <div
                      style={{
                        padding: '20px',
                        backgroundColor: '#f5f5f5',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '400px',
                      }}
                    >
                      <img
                        src={`wiki-asset://${asset.asset_path}`}
                        alt={asset.caption || 'Evidence'}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '600px',
                          objectFit: 'contain',
                          display: 'block',
                          cursor: 'zoom-in',
                          borderRadius: '4px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                        onClick={() => window.open(`wiki-asset://${asset.asset_path}`, '_blank')}
                      />
                    </div>
                  ) : isPdf ? (
                    <div
                      style={{
                        position: 'relative',
                        height: '700px',
                        backgroundColor: '#525659',
                      }}
                    >
                      <embed
                        src={`wiki-asset://${asset.asset_path}`}
                        type="application/pdf"
                        width="100%"
                        height="100%"
                        style={{ display: 'block' }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f8f9fa',
                        cursor: 'pointer',
                      }}
                      onClick={() => window.open(`wiki-asset://${asset.asset_path}`, '_blank')}
                    >
                      <span style={{ fontSize: '4em', marginBottom: '10px' }}>📄</span>
                      <span style={{ fontSize: '1em', color: '#555', fontWeight: '500' }}>
                        Click to open file
                      </span>
                    </div>
                  )}

                  {/* Caption */}
                  {asset.caption && (
                    <div
                      style={{
                        padding: '12px 16px',
                        fontSize: '0.9em',
                        color: '#54595d',
                        lineHeight: '1.5',
                        borderTop: '1px solid #e1e4e8',
                        backgroundColor: '#fafbfc',
                      }}
                    >
                      <strong style={{ color: '#24292f' }}>Caption:</strong> {asset.caption}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Backlinks Section */}
      {backlinks.length > 0 && (
        <div
          style={{
            marginTop: '40px',
            borderTop: '1px solid #a2a9b1',
            paddingTop: '15px',
            clear: 'both',
          }}
        >
          <h3
            style={{
              fontFamily: "'Linux Libertine', Georgia, serif",
              color: '#54595d',
              fontSize: '1.2em',
            }}
          >
            Connected Intelligence (Backlinks)
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {backlinks.map((link) => (
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
                  fontSize: '0.9em',
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
