import React, { useState } from 'react';

const EntryForm = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare data for the backend
    const result = await window.wikiAPI.saveEntry({
      title,
      content,
      filePath: file ? file.path : null,
    });

    if (result.success) {
      alert('Research Locked & Hashed.');
      onComplete();
    } else {
      alert('Error: ' + result.message);
    }
  };

  return (
    <div className="wiki-form-container">
      <h2>New Political Entry</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Entry Title (e.g., Politician Name)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Content / Evidence Data..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit">Harden & Save</button>
      </form>
    </div>
  );
};

export default EntryForm;
