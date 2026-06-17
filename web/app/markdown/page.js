'use client';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import mermaid from 'mermaid';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const Mermaid = ({ chart }) => {
  const [svgContent, setSvgContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
    if (chart) {
      mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart)
        .then(({ svg }) => {
          setSvgContent(svg);
        })
        .catch(err => {
          console.error("Mermaid render error:", err);
          setSvgContent(`<div style="color: red; padding: 1rem; border: 1px solid red; border-radius: 8px;">Failed to render Mermaid chart</div>`);
        });
    }
  }, [chart]);
  
  if (!svgContent) return <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Rendering chart...</div>;

  return (
    <>
      <div 
        onClick={() => setIsExpanded(true)}
        title="Click to enlarge"
        dangerouslySetInnerHTML={{ __html: svgContent }}
        className="mermaid-container hover-scale"
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          margin: '1rem 0', 
          background: 'rgba(255,255,255,0.7)', 
          padding: '1rem', 
          borderRadius: '8px',
          cursor: 'zoom-in',
          maxHeight: '300px',
          overflow: 'hidden',
          border: '1px solid rgba(139, 115, 85, 0.2)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
        }} 
      />
      
      {isExpanded && (
        <div 
          onClick={() => setIsExpanded(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            padding: '2rem',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fcfaf8',
              borderRadius: '16px',
              width: '95vw',
              height: '95vh',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              border: '1px solid rgba(139, 115, 85, 0.2)'
            }}
          >
            <button 
              onClick={() => setIsExpanded(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.05)', color: '#4a3f35', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold', zIndex: 10000 }}
              title="Close"
            >
              ✕
            </button>
            <TransformWrapper initialScale={1} minScale={0.1} maxScale={8} centerOnInit>
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', zIndex: 10000, background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '12px', backdropFilter: 'blur(4px)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <button onClick={() => zoomIn()} style={{ padding: '8px 16px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Zoom In ➕</button>
                    <button onClick={() => zoomOut()} style={{ padding: '8px 16px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Zoom Out ➖</button>
                    <button onClick={() => resetTransform()} style={{ padding: '8px 16px', background: 'transparent', color: '#4a3f35', border: '1px solid var(--accent-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Reset ↺</button>
                  </div>
                  <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab' }}>
                    <div dangerouslySetInnerHTML={{ __html: svgContent }} style={{ padding: '2rem' }} />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>
        </div>
      )}
    </>
  );
};

export default function MarkdownEditor() {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
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

          {/* Side-by-side mode active */}

          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold', minWidth: '150px', textAlign: 'right' }}>
            {isSaving ? '⏳ Saving...' : lastSaved ? `✅ Saved at ${lastSaved}` : '✅ Synchronized'}
          </div>
        </div>
      </div>

      {/* Side-by-Side Editor & Preview Pane */}
      <div className="md-split-pane">
        <div className="md-container">
          
          <div className="md-pane md-pane-left">
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

          <div className="md-pane">
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
          
        </div>

      </div>
    </div>
  );
}
