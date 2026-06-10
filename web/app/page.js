'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState(3);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setIsSubmitting(true);
    setStatus({ type: '', msg: '' });

    try {
      let categories = [];
      let processedText = text;
      const catMatches = [...processedText.matchAll(/#(\w+)/g)];
      if (catMatches.length > 0) {
        catMatches.forEach(match => {
          const cat = match[1];
          categories.push(cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase());
          processedText = processedText.replace(match[0], '').trim();
        });
        categories = [...new Set(categories)];
      }

      const res = await fetch('/api/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: processedText, priority, categories: categories.length > 0 ? categories : undefined }),
      });

      if (!res.ok) throw new Error('Failed to save');

      setStatus({ type: 'success', msg: 'Idea saved! 🚀' });
      setText('');
      setPriority(3);
      
      // Clear success message after 2 seconds
      setTimeout(() => setStatus({ type: '', msg: '' }), 2000);
      
      // Keep focus on input for the next idea
      inputRef.current?.focus();
    } catch (error) {
      setStatus({ type: 'error', msg: 'Failed to save idea. Try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <main className="container">
      <div className="glass-panel animate-in">
        <textarea
          ref={inputRef}
          className="memo-input"
          placeholder="What's the idea?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isSubmitting}
        />

        <div className="priority-selector">
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              key={val}
              className={`priority-btn ${priority === val ? 'selected' : ''}`}
              data-val={val}
              onClick={() => setPriority(val)}
              disabled={isSubmitting}
            >
              {val}
            </button>
          ))}
        </div>

        <button 
          className="submit-btn" 
          onClick={handleSubmit}
          disabled={!text.trim() || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Idea'}
        </button>

        <div className={`status-msg ${status.type} ${status.msg ? 'show' : ''}`}>
          {status.msg}
        </div>
      </div>
      
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <a href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          View Dashboard ➔
        </a>
      </div>
    </main>
  );
}
