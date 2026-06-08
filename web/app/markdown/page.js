'use client';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export default function MarkdownEditor() {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'preview'
  const saveTimeoutRef = useRef(null);
  const isSavingRef = useRef(false);

  // Keep ref in sync with state for access inside the interval
  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    const fetchMarkdown = () => {
      // Skip fetching if the user is actively typing or if a save is currently in flight
      if (saveTimeoutRef.current || isSavingRef.current) return;
      
      fetch('/api/markdown')
        .then(res => res.json())
        .then(data => {
          if (data.content !== undefined) {
            setContent(prev => prev !== data.content ? data.content : prev);
          }
        })
        .catch(err => console.error("Polling error:", err));
    };

    fetchMarkdown(); // Fetch immediately on load
    const intervalId = setInterval(fetchMarkdown, 2000); // Poll every 2 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      fetch('/api/markdown', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      }).finally(() => {
        setIsSaving(false);
        saveTimeoutRef.current = null; // Clear the ref so polling can resume
        setLastSaved(new Date().toLocaleTimeString());
      });
    }, 1000);
  };

  const handleEmailDraft = () => {
    const subject = encodeURIComponent('Quick Memo - Markdown Notes');
    const body = encodeURIComponent(content);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
  return (
    <div className="page-container" style={{ padding: '0 4rem' }}>
      
      {/* Header section */}
      <div className="page-header">
        <div>
          <div className="nav-links" style={{ marginBottom: '1rem' }}>
            <Link href="/dashboard" className="nav-link">
              ← Back to Dashboard
            </Link>
            <Link href="/learning" className="nav-link">
              🧠 Learning Zone
            </Link>
          </div>
          <h1 className="page-title">
            📝 Markdown Workspace
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>
            Auto-syncing to <code style={{ background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>/home/erikyu/dev/mes/quick-memo/notes.md</code>
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {/* Email Draft Button */}
          <button 
            onClick={handleEmailDraft}
            className="submit-btn"
            style={{ padding: '0.6rem 1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--priority-1)' }}
            title="Open in default email client"
          >
            ✉️ Email Draft
          </button>

          {/* Toggle Switch */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <button 
              onClick={() => setViewMode('edit')}
              style={{ padding: '0.6rem 1.5rem', background: viewMode === 'edit' ? 'var(--accent-color)' : 'transparent', color: viewMode === 'edit' ? 'white' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
            >
              Raw Edit
            </button>
            <button 
              onClick={() => setViewMode('preview')}
              style={{ padding: '0.6rem 1.5rem', background: viewMode === 'preview' ? 'var(--accent-color)' : 'transparent', color: viewMode === 'preview' ? 'white' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
            >
              Live Preview
            </button>
          </div>

          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold', minWidth: '150px', textAlign: 'right' }}>
            {isSaving ? '⏳ Saving...' : lastSaved ? `✅ Saved at ${lastSaved}` : '✅ Synchronized'}
          </div>
        </div>
      </div>

      {/* Unified Editor / Preview Pane */}
      <div className="md-split-pane">
        
        {viewMode === 'edit' ? (
          <div className="glass-panel md-pane" style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
            <div className="md-pane-header">
              Raw Markdown
            </div>
            <textarea
              className="md-textarea"
              value={content}
              onChange={handleChange}
              placeholder="Start typing your markdown here..."
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="glass-panel md-pane" style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
            <div className="md-pane-header">
              Live Preview
            </div>
            <div className="md-preview">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
