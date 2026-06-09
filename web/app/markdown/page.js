'use client';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import mermaid from 'mermaid';

const Mermaid = ({ chart }) => {
  const ref = useRef(null);
  
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
    if (ref.current && chart) {
      mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart)
        .then(({ svg }) => {
          if (ref.current) ref.current.innerHTML = svg;
        })
        .catch(err => {
          console.error("Mermaid render error:", err);
          if (ref.current) ref.current.innerHTML = `<div style="color: red; padding: 1rem; border: 1px solid red; border-radius: 8px;">Failed to render Mermaid chart</div>`;
        });
    }
  }, [chart]);
  
  return <div ref={ref} className="mermaid-container" style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0', background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: '8px' }} />;
};

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
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            Auto-syncing to <code style={{ background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', margin: '0 0.5rem' }}>/home/erikyu/dev/mes/quick-memo/notes.md</code>
            <button 
              onClick={() => navigator.clipboard.writeText('/home/erikyu/dev/mes/quick-memo/notes.md')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, padding: '2px 4px' }}
              title="Copy path"
              onMouseEnter={(e) => e.target.style.opacity = 1}
              onMouseLeave={(e) => e.target.style.opacity = 0.7}
            >
              📋
            </button>
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
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    if (!inline && match && match[1] === 'mermaid') {
                      return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                    }
                    return <code className={className} style={{ background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px' }} {...props}>{children}</code>;
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
