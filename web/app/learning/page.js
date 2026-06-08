'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LearningZone() {
  const [learnings, setLearnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  const editLearning = async (id, newContent) => {
    if (!newContent.trim()) return;
    
    // Optimistic UI update
    setLearnings(prev => prev.map(l => l.id === id ? { ...l, content: newContent } : l));
    
    await fetch('/api/learning', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, content: newContent })
    });
  };

  // Group learnings by date
  const processedLearnings = learnings.filter(l => 
    !searchQuery || l.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedLearnings = processedLearnings.reduce((acc, curr) => {
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

      <div className="search-container" style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="🔍 Search learnings..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(139, 115, 85, 0.2)', background: 'rgba(255, 255, 255, 0.5)', outline: 'none', color: '#4a3f35', fontSize: '1rem' }}
        />
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
                  <LearningRow 
                    key={item.id} 
                    item={item} 
                    deleteLearning={deleteLearning} 
                    editLearning={editLearning} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function LearningRow({ item, deleteLearning, editLearning }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);

  const saveEdit = () => {
    setIsEditing(false);
    if (editContent !== item.content) {
      editLearning(item.id, editContent);
    }
  };

  return (
    <div className="learning-item">
      {isEditing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={saveEdit}
          autoFocus
          className="learning-textarea"
          style={{ flex: 1, minHeight: '60px', padding: '0.5rem', marginBottom: 0 }}
        />
      ) : (
        <span 
          className="learning-content" 
          onClick={() => setIsEditing(true)}
          style={{ cursor: 'text', flex: 1 }}
        >
          {item.content}
        </span>
      )}
      <button 
        onClick={() => deleteLearning(item.id)}
        className="learning-delete-btn"
        title="Delete"
      >
        🗑️
      </button>
    </div>
  );
}
