import React, { useState, useRef, useEffect } from 'react';
import TagInput from './TagInput';
import FormTabs from './FormTabs';
import HashtagDropdown from './HashtagDropdown';
import InfoboxEditor from './InfoboxEditor';
import AttachmentsSection from './AttachmentsSection';
import WebSnapshotTab from './WebSnapshotTab';
import { ENTRY_FORM_TABS, ENTRY_FORM_MODES, DEBOUNCE } from '../../constants';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';

const EntryForm = ({
  onComplete,
  initialTitle = '',
  mode = ENTRY_FORM_MODES.CREATE,
  entry = null,
}) => {
  // Form state
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [eventDate, setEventDate] = useState(''); // Date for "On This Day" feature
  const [files, setFiles] = useState([]);
  const [existingAssets, setExistingAssets] = useState([]);
  const [removedAssetIds, setRemovedAssetIds] = useState([]);
  const [infobox, setInfobox] = useState([]);
  const [activeTab, setActiveTab] = useState(ENTRY_FORM_TABS.WRITE);

  // Hashtag autocomplete state
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [hashtagPosition, setHashtagPosition] = useState({ top: 0, left: 0 });
  const [selectedHashtagIndex, setSelectedHashtagIndex] = useState(0);
  const [allTags, setAllTags] = useState([]);
  const [activeField, setActiveField] = useState('');

  // Refs
  const hashtagDebounceRef = useRef(null);
  const textareaRef = useRef(null);
  const titleInputRef = useRef(null);

  // Load existing tags for autocomplete
  useEffect(() => {
    const loadTags = async () => {
      const tagList = await window.wikiAPI.getAllTags();
      setAllTags(tagList);
    };
    loadTags();
  }, []);

  // Load existing entry data in edit mode
  useEffect(() => {
    if (mode === ENTRY_FORM_MODES.EDIT && entry) {
      setTitle(entry.title || '');
      setContent(entry.content || '');
      // Format eventDate for date input (YYYY-MM-DD)
      if (entry.event_date) {
        const date = new Date(entry.event_date);
        setEventDate(date.toISOString().split('T')[0]);
      }

      const loadEntryData = async () => {
        try {
          const entryTags = await window.wikiAPI.getEntryTags(entry.id);
          setTags(entryTags.map((t) => t.tag_name));

          const assets = await window.wikiAPI.getEntryAssets(entry.id);
          setExistingAssets(assets || []);

          const infoboxData = await window.wikiAPI.getEntryInfobox(entry.id);
          setInfobox(infoboxData || []);
        } catch (error) {
          console.error('Failed to load entry data:', error);
        }
      };

      loadEntryData();
    }
  }, [mode, entry]);

  // Hashtag detection
  const detectHashtag = (text, cursorPos, field) => {
    const textBeforeCursor = text.substring(0, cursorPos);
    const hashtagMatch = textBeforeCursor.match(/#([\w_]*)$/);

    if (hashtagMatch) {
      const query = hashtagMatch[1];
      setHashtagQuery(query);
      setActiveField(field);

      if (hashtagDebounceRef.current) {
        clearTimeout(hashtagDebounceRef.current);
      }

      hashtagDebounceRef.current = setTimeout(() => {
        // Combine database tags with newly added tags from current form
        const currentFormTags = tags.map((t) => ({ name: t, count: 0, isNew: true }));
        const combinedTags = [
          ...currentFormTags,
          ...allTags.filter((dbTag) => !tags.includes(dbTag.name)),
        ];

        const filtered = combinedTags
          .filter((t) => t.name.toLowerCase().startsWith(query.toLowerCase()))
          .slice(0, 5);

        setHashtagSuggestions(filtered);
        setShowHashtagSuggestions(filtered.length > 0);
        setSelectedHashtagIndex(0);
      }, DEBOUNCE.HASHTAG);

      if (field === 'content' && textareaRef.current) {
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines.length;
        const lineHeight = 20;
        setHashtagPosition({ top: currentLine * lineHeight, left: 20 });
      } else {
        setHashtagPosition({ top: 0, left: 0 });
      }
    } else {
      setShowHashtagSuggestions(false);
      if (hashtagDebounceRef.current) {
        clearTimeout(hashtagDebounceRef.current);
      }
    }
  };

  // Handlers
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    detectHashtag(newTitle, e.target.selectionStart, 'title');
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    detectHashtag(newContent, e.target.selectionStart, 'content');
  };

  const handleKeyDown = (e) => {
    if (showHashtagSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedHashtagIndex((prev) => Math.min(prev + 1, hashtagSuggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedHashtagIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && hashtagSuggestions.length > 0) {
        e.preventDefault();
        insertHashtag(hashtagSuggestions[selectedHashtagIndex].name);
      } else if (e.key === 'Escape') {
        setShowHashtagSuggestions(false);
      }
    }
  };

  const insertHashtag = (tagName) => {
    const isTitle = activeField === 'title';
    const inputRef = isTitle ? titleInputRef : textareaRef;
    const currentText = isTitle ? title : content;
    const setText = isTitle ? setTitle : setContent;

    const cursorPos = inputRef.current.selectionStart;
    const textBefore = currentText.substring(0, cursorPos);
    const textAfter = currentText.substring(cursorPos);

    const hashPos = textBefore.lastIndexOf('#');
    const hashtagFormat = tagName.replace(/ /g, '_');
    const newText = textBefore.substring(0, hashPos + 1) + hashtagFormat + textAfter;

    setText(newText);
    setShowHashtagSuggestions(false);

    setTimeout(() => {
      const newPos = hashPos + 1 + hashtagFormat.length;
      inputRef.current.selectionStart = newPos;
      inputRef.current.selectionEnd = newPos;
      inputRef.current.focus();
    }, 0);
  };

  const scanHashtags = () => {
    const hashtagRegex = /#([\w_]+)(?=\s|$|[^\w_])/g;
    const matches = [...content.matchAll(hashtagRegex)];
    const extractedTags = matches.map((match) => match[1].replace(/_/g, ' '));

    let newTagsCount = 0;
    extractedTags.forEach((tag) => {
      if (!tags.includes(tag)) {
        setTags((prev) => [...prev, tag]);
        newTagsCount++;
      }
    });

    if (newTagsCount > 0) {
      alert(`Found ${newTagsCount} new hashtag(s) in your content!`);
    } else if (extractedTags.length > 0) {
      alert('All hashtags are already in your tags list.');
    } else {
      alert('No hashtags found in content.\n\nTip: Use #hashtag or #Multi_Word_Tag format.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Process Title: Extract hashtags, add to tags, and clean title
    let processedTitle = title;
    const titleTags = [];
    const titleHashtagRegex = /#([\w_]+)/g;

    // Find all hashtags in title
    const matches = [...processedTitle.matchAll(titleHashtagRegex)];
    matches.forEach((match) => {
      titleTags.push(match[1].replace(/_/g, ' '));
    });

    // Remove hashtags from title string for the final save
    // We replace #Tag with Tag (just remove the hash) to keep the word in the title
    // OR we can remove the whole word if it's purely a tag container.
    // User request: "it should be test with different color" -> implies keeping the text.
    // Let's remove the '#' symbol but keep the text.
    processedTitle = processedTitle.replace(/#([\w_]+)/g, '$1').trim();

    // Merge title tags with existing tags (unique only)
    const finalTags = [...new Set([...tags, ...titleTags])];

    try {
      if (mode === ENTRY_FORM_MODES.EDIT) {
        const updateResult = await window.wikiAPI.updateEntry({
          entryId: entry.id,
          title: processedTitle,
          content,
          tags: finalTags,
          eventDate: eventDate || null,
          infobox: infobox.map((item, index) => ({
            key: item.field_key || item.key,
            value: item.field_value || item.value,
            displayOrder: index,
          })),
          removedAssetIds,
        });

        if (!updateResult.success) {
          alert('Error updating entry: ' + updateResult.message);
          return;
        }

        if (files.length > 0) {
          const filePaths = files.map((f) => f.path).filter(Boolean);

          if (filePaths.length < files.length) {
            console.warn('Some files were skipped due to missing paths');
          }

          if (filePaths.length > 0) {
            const assetsResult = await window.wikiAPI.addEntryAssets({
              entryId: entry.id,
              filePaths,
            });

            if (!assetsResult.success) {
              alert('Warning: Entry updated but failed to add new assets: ' + assetsResult.message);
            }
          }
        }

        alert('Entry updated successfully!');
        onComplete();
      } else {
        const filePaths = files.map((f) => f.path).filter(Boolean);

        const result = await window.wikiAPI.saveEntry({
          title: processedTitle,
          content,
          filePaths,
          tags: finalTags,
          eventDate: eventDate || null,
          infobox: infobox.map((item, index) => ({
            key: item.key,
            value: item.value,
            displayOrder: index,
          })),
        });

        if (result.success) {
          alert('Research Locked & Hashed.');
          onComplete();
        } else {
          alert('Error: ' + result.message);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleCapture = async (url) => {
    try {
      const result = await window.wikiAPI.captureWebSnapshot(url);
      if (result.success) {
        setFiles((prev) => [...prev, { path: result.filePath, name: 'Web_Snapshot.pdf' }]);
        if (!content) setContent(`Source: ${url}`);
        setActiveTab(ENTRY_FORM_TABS.WRITE);
        alert('Snapshot captured securely.');
      } else {
        alert('Snapshot failed: ' + result.message);
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  // Infobox handlers
  const addInfoboxField = () => setInfobox((prev) => [...prev, { key: '', value: '' }]);

  const updateInfoboxField = (index, field, value) => {
    setInfobox((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeInfoboxField = (index) => {
    setInfobox((prev) => prev.filter((_, i) => i !== index));
  };

  // Asset handlers
  const handleRemoveExistingAsset = (assetId) => {
    setRemovedAssetIds((prev) => [...prev, assetId]);
    setExistingAssets((prev) => prev.filter((a) => a.id !== assetId));
  };

  const handleRemoveNewFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    // Use setTimeout to prevent UI blocking during file processing
    setTimeout(() => {
      setFiles((prev) => [...prev, ...selectedFiles]);
    }, 0);
  };

  const updateAssetCaption = async (assetId, caption) => {
    try {
      await window.wikiAPI.updateAssetCaption({ assetId, caption });
      setExistingAssets((prev) =>
        prev.map((asset) => (asset.id === assetId ? { ...asset, caption } : asset))
      );
    } catch (error) {
      console.error('Failed to update caption:', error);
      alert('Error updating caption');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h1 style={styles.header}>
          {mode === ENTRY_FORM_MODES.EDIT ? 'Edit Research Entry' : 'New Research Entry'}
        </h1>

        <FormTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Title Input */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Entry Title
              <span style={styles.hint}>
                (Tip: Type <b>#</b> for tag suggestions)
              </span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              placeholder="Entry Title"
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleKeyDown}
              required
              style={styles.titleInput}
            />
            {showHashtagSuggestions && activeField === 'title' && (
              <HashtagDropdown
                suggestions={hashtagSuggestions}
                selectedIndex={selectedHashtagIndex}
                position={{ top: 80, left: 0 }}
                onSelect={insertHashtag}
                onMouseEnter={setSelectedHashtagIndex}
              />
            )}
          </div>

          {/* Tags Section */}
          <div style={styles.fieldGroup}>
            <div style={styles.tagsHeader}>
              <label style={styles.label}>Tags / Keywords</label>
              <button type="button" onClick={scanHashtags} style={styles.scanButton}>
                Scan Tags from Content
              </button>
            </div>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          {/* Event Date - for "On This Day" feature */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Event Date
              <span style={styles.hint}>
                (Optional: When did this event occur? Used for "On This Day" feature)
              </span>
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              style={styles.dateInput}
            />
          </div>

          {/* Tab Content */}
          {activeTab === ENTRY_FORM_TABS.WRITE && (
            <div style={styles.writeTab}>
              <div style={styles.contentHeader}>
                <label style={styles.label}>Dossier Content (Markdown)</label>
                <span style={styles.hint}>
                  Tip: Use <b>[[Title]]</b> to link. Type <b>#</b> for tag suggestions.
                </span>
              </div>
              <textarea
                ref={textareaRef}
                placeholder="Enter research data..."
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                required
                style={styles.textarea}
              />
              {showHashtagSuggestions && activeField === 'content' && (
                <HashtagDropdown
                  suggestions={hashtagSuggestions}
                  selectedIndex={selectedHashtagIndex}
                  position={{ top: hashtagPosition.top + 80, left: hashtagPosition.left }}
                  onSelect={insertHashtag}
                  onMouseEnter={setSelectedHashtagIndex}
                />
              )}
            </div>
          )}

          {activeTab === ENTRY_FORM_TABS.PREVIEW && (
            <div style={styles.previewBox}>
              <h1 style={styles.previewTitle}>{title || 'Untitled Entry'}</h1>
              {tags.length > 0 && (
                <div style={styles.previewTags}>
                  {tags.map((tag, i) => (
                    <span key={i} style={styles.previewTag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div style={styles.previewContent}>{content || 'Nothing to preview...'}</div>
            </div>
          )}

          {activeTab === ENTRY_FORM_TABS.INFOBOX && (
            <InfoboxEditor
              fields={infobox}
              onAdd={addInfoboxField}
              onUpdate={updateInfoboxField}
              onRemove={removeInfoboxField}
            />
          )}

          {activeTab === ENTRY_FORM_TABS.SNAPSHOT && <WebSnapshotTab onCapture={handleCapture} />}

          {/* Attachments */}
          <AttachmentsSection
            existingAssets={existingAssets}
            newFiles={files}
            onFileSelect={handleFileSelect}
            onRemoveExisting={handleRemoveExistingAsset}
            onRemoveNew={handleRemoveNewFile}
            onUpdateCaption={updateAssetCaption}
          />

          {/* Submit */}
          <div style={styles.submitRow}>
            <button type="submit" style={styles.submitButton}>
              {mode === ENTRY_FORM_MODES.EDIT ? 'Update Entry' : 'Harden & Save to Vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: spacing['3xl'],
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  formCard: {
    backgroundColor: colors.white,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.lg,
    padding: spacing['5xl'],
    width: '100%',
    height: '100%',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize['3xl'],
    margin: `0 0 ${spacing['2xl']} 0`,
    color: colors.text,
    borderBottom: 'none',
    paddingBottom: spacing.md,
    fontWeight: typography.fontWeight.medium,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  fieldGroup: {
    marginBottom: spacing['2xl'],
    position: 'relative',
  },
  label: {
    display: 'block',
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    color: colors.textMuted,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
    letterSpacing: '1px',
  },
  hint: {
    fontSize: '0.85em',
    color: colors.textLight,
    marginLeft: spacing.md,
    fontWeight: typography.fontWeight.normal,
    textTransform: 'none',
  },
  titleInput: {
    width: '100%',
    padding: `${spacing.xl} ${spacing.lg}`,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.primary,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    outline: 'none',
    backgroundColor: colors.white,
    color: colors.text,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  dateInput: {
    padding: `${spacing.lg} ${spacing.xl}`,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.secondary,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    outline: 'none',
    backgroundColor: colors.white,
    color: colors.text,
    cursor: 'pointer',
    minWidth: '200px',
  },
  tagsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scanButton: {
    padding: `${spacing.md} ${spacing['2xl']}`,
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    transition: 'background-color 0.2s',
  },
  writeTab: {
    marginBottom: spacing['2xl'],
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  textarea: {
    width: '100%',
    height: '100%',
    minHeight: '300px',
    padding: spacing['2xl'],
    fontFamily: typography.fontFamily.monospace,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.lg,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.relaxed,
    resize: 'none',
    backgroundColor: '#fafbfc',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  previewBox: {
    flex: 1,
    padding: spacing['4xl'],
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    color: colors.text,
    display: 'flex',
    flexDirection: 'column',
    userSelect: 'text',
    cursor: 'text',
    minHeight: '300px',
  },
  previewTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: '1.8em',
    marginBottom: spacing['2xl'],
    color: colors.text,
  },
  previewTags: {
    display: 'flex',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
    flexWrap: 'wrap',
  },
  previewTag: {
    padding: `${spacing.sm} ${spacing.xl}`,
    backgroundColor: 'rgba(255, 193, 7, 0.25)',
    color: '#b8860b',
    borderRadius: borderRadius['2xl'],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    border: '1px solid rgba(255, 193, 7, 0.4)',
  },
  previewContent: {
    whiteSpace: 'pre-wrap',
    fontFamily: typography.fontFamily.primary,
    lineHeight: typography.lineHeight.relaxed,
    flex: 1,
    overflowY: 'auto',
    color: colors.textSecondary,
  },
  submitRow: {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: spacing['2xl'],
  },
  submitButton: {
    padding: `${spacing.xl} ${spacing['4xl']}`,
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.base,
    boxShadow: '0 2px 8px rgba(51, 102, 204, 0.3)',
    transition: 'background-color 0.2s, transform 0.1s',
  },
};

export default EntryForm;
