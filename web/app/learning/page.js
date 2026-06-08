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
    <main className="page-container-narrow" style={{ padding: '2rem', minHeight: '100vh' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">🧠 Learning Zone</h1>
        <div className="nav-links">
          <Link href="/dashboard" className="submit-btn nav-link-btn">
            Todos
          </Link>
          <Link href="/markdown" className="submit-btn nav-link-btn">
            Markdown
          </Link>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '3rem' }}>
        <form onSubmit={addLearning} className="learning-input-form">
          <textarea
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="What did you learn today?..."
            className="learning-textarea"
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
        <div className="learning-list">
          {Object.keys(groupedLearnings).sort((a,b) => new Date(b) - new Date(a)).map(date => (
            <div key={date} className="glass-panel learning-date-group">
              <h2 className="learning-date-title">
                📅 {date}
              </h2>
              <div className="learning-items">
                {groupedLearnings[date].map(item => (
                  <div key={item.id} className="learning-item">
                    <span className="learning-content">{item.content}</span>
                    <button 
                      onClick={() => deleteLearning(item.id)}
                      className="learning-delete-btn"
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
