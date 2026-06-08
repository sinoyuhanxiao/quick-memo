'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [memos, setMemos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'priority'
  const [filterCategory, setFilterCategory] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchData();

    // Auto-refresh when window regains focus (Option 2)
    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchData = () => {
    Promise.all([
      fetch('/api/memo').then(res => res.json()),
      fetch('/api/categories').then(res => res.json())
    ]).then(([memoData, catData]) => {
      if (memoData.memos) setMemos(memoData.memos);
      if (catData.categories) setCategories(catData.categories.map(c => c.name));
      setLoading(false);
    });
  };

  const toggleComplete = async (memo) => {
    // Optimistic UI update
    setMemos(prev => prev.map(m => m.id === memo.id ? { ...m, is_completed: !m.is_completed } : m));
    await fetch('/api/memo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: memo.id, is_completed: !memo.is_completed })
    });
  };

  const deleteMemo = async (id) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;
    setMemos(prev => prev.filter(m => m.id !== id));
    await fetch('/api/memo', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  };

  const startEdit = (memo) => {
    setEditingId(memo.id);
    setEditContent(memo.content);
  };

  const saveEdit = async (id) => {
    setMemos(prev => prev.map(m => m.id === id ? { ...m, content: editContent } : m));
    setEditingId(null);
    await fetch('/api/memo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, content: editContent })
    });
  };

  // Sort and group
  const sortedMemos = [...memos].sort((a, b) => {
    if (sortBy === 'priority') {
      return b.priority - a.priority;
    }
    // Newest is default (assuming id represents insertion order)
    return b.id - a.id;
  });

  const grouped = sortedMemos.reduce((acc, memo) => {
    const cat = memo.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(memo);
    return acc;
  }, {});

  // Combine DB categories with any orphaned categories still in memos just in case
  const uniqueCats = new Set([...categories, ...Object.keys(grouped)]);
  const allCategories = ['All', ...Array.from(uniqueCats).sort()];

  return (
    <main className="container page-container-narrow">
      <div className="dashboard-header">
        <h1>My Ideas Dashboard</h1>
        <div className="dashboard-controls">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Sort by Newest</option>
            <option value="priority">Sort by Priority (High to Low)</option>
          </select>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="sort-select"
          >
            {allCategories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
          <Link href="/learning" className="nav-link" style={{ marginRight: '1rem' }}>
            🧠 Learning Zone
          </Link>
          <Link href="/" className="nav-link">
            + New Idea
          </Link>
        </div>
      </div>
      
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading your genius ideas...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No ideas saved yet.</p>
          <Link href="/" style={{ color: 'var(--accent-color)', display: 'inline-block', marginTop: '1rem' }}>
            Go create one!
          </Link>
        </div>
      ) : (
        Object.entries(grouped)
          .filter(([cat]) => filterCategory === 'All' || cat === filterCategory)
          .map(([cat, items]) => {
          const activeItems = items.filter(i => !i.is_completed);
          const completedItems = items.filter(i => i.is_completed);
          
          return (
            <div key={cat} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>{cat} <span style={{fontSize:'0.9rem', color:'var(--text-secondary)'}}>({activeItems.length})</span></h2>
              
              <div className="todo-list">
                {activeItems.map(item => (
                  <MemoRow 
                    key={item.id} item={item} 
                    toggleComplete={() => toggleComplete(item)}
                    deleteMemo={() => deleteMemo(item.id)}
                    startEdit={() => startEdit(item)}
                    saveEdit={() => saveEdit(item.id)}
                    isEditing={editingId === item.id}
                    editContent={editContent}
                    setEditContent={setEditContent}
                  />
                ))}
                
                {completedItems.length > 0 && (
                  <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem' }}>
                    <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Completed</h4>
                    <div className="todo-list" style={{ gap: '0.5rem' }}>
                      {completedItems.map(item => (
                        <MemoRow 
                          key={item.id} item={item} 
                          toggleComplete={() => toggleComplete(item)}
                          deleteMemo={() => deleteMemo(item.id)}
                          isEditing={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </main>
  );
}

function MemoRow({ item, toggleComplete, deleteMemo, startEdit, saveEdit, isEditing, editContent, setEditContent }) {
  return (
    <div className="todo-row" style={{ opacity: item.is_completed ? 0.6 : 1 }}>
      <div className="todo-content-wrapper">
        <input 
          type="checkbox" 
          checked={item.is_completed} 
          onChange={toggleComplete}
          className="todo-checkbox"
        />
        
        {isEditing ? (
          <input 
            type="text"
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); }}
            onBlur={saveEdit}
            autoFocus
            className="todo-input"
          />
        ) : (
          <span 
            onClick={!item.is_completed ? startEdit : undefined}
            className="todo-text"
            style={{ 
              textDecoration: item.is_completed ? 'line-through' : 'none',
              cursor: item.is_completed ? 'default' : 'text'
            }}>
            {item.content}
          </span>
        )}
      </div>

      <div className="todo-actions">
        <span className="todo-priority-badge" style={{ background: `var(--priority-${item.priority})` }}>
          P{item.priority}
        </span>
        <button 
          onClick={deleteMemo}
          className="todo-delete-btn"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
