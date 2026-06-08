'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LearningZone() {
  const [learnings, setLearnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputContent, setInputContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch('/api/learning')
      .then(res => res.json())
      .then(data => {
        if (data.learnings) setLearnings(data.learnings);
        setLoading(false);
      });
  };

  const addLearning = async (e) => {
    e.preventDefault();
    if (!inputContent.trim()) return;
    setIsSubmitting(true);
    
    await fetch('/api/learning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: inputContent })
    });
    
    setInputContent('');
    setIsSubmitting(false);
    fetchData();
  };

  const deleteLearning = async (id) => {
    if (!confirm('Are you sure you want to delete this learning note?')) return;
    setLearnings(prev => prev.filter(l => l.id !== id));
    await fetch('/api/learning', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  };

  // Group learnings by date
  const groupedLearnings = learnings.reduce((acc, curr) => {
    if (!acc[curr.date_category]) acc[curr.date_category] = [];
    acc[curr.date_category].push(curr);
    return acc;
  }, {});

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>🧠 Learning Zone</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/dashboard" className="submit-btn" style={{ textDecoration: 'none', background: 'transparent', color: 'var(--accent-color)', border: '1px solid var(--accent-color)' }}>
            Todos
          </Link>
          <Link href="/markdown" className="submit-btn" style={{ textDecoration: 'none', background: 'transparent', color: 'var(--accent-color)', border: '1px solid var(--accent-color)' }}>
            Markdown
          </Link>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '3rem' }}>
        <form onSubmit={addLearning} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <textarea
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="What did you learn today?..."
            style={{
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.5)',
              color: 'var(--text-primary)',
              minHeight: '100px',
              resize: 'vertical',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <button type="submit" className="submit-btn" disabled={isSubmitting || !inputContent.trim()}>
            {isSubmitting ? 'Recording...' : 'Record Learning'}
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading your learnings...</div>
      ) : Object.keys(groupedLearnings).length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No learnings recorded yet. Start learning!</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.keys(groupedLearnings).sort((a,b) => new Date(b) - new Date(a)).map(date => (
            <div key={date} className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--accent-color)', borderBottom: '2px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: 0 }}>
                📅 {date}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {groupedLearnings[date].map(item => (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    padding: '0.8rem 1rem', 
                    background: 'rgba(255,255,255,0.3)', 
                    borderRadius: '8px', 
                    border: '1px solid var(--glass-border)'
                  }}>
                    <span style={{ fontSize: '1.05rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{item.content}</span>
                    <button 
                      onClick={() => deleteLearning(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--priority-5)',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        opacity: 0.5,
                        marginLeft: '1rem'
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
