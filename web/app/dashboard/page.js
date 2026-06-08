'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'priority'
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
    fetch('/api/memo')
      .then(res => res.json())
      .then(data => {
        if (data.memos) setMemos(data.memos);
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

  return (
    <main className="container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <h1>My Ideas Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
          >
            <option value="newest">Sort by Newest</option>
            <option value="priority">Sort by Priority (High to Low)</option>
          </select>
          <Link href="/learning" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 'bold', marginRight: '1rem' }}>
            🧠 Learning Zone
          </Link>
          <Link href="/" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 'bold' }}>
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
        Object.entries(grouped).map(([cat, items]) => {
          const activeItems = items.filter(i => !i.is_completed);
          const completedItems = items.filter(i => i.is_completed);
          
          return (
            <div key={cat} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>{cat} <span style={{fontSize:'0.9rem', color:'var(--text-secondary)'}}>({activeItems.length})</span></h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '0.8rem 1rem', 
      background: 'rgba(255,255,255,0.3)', 
      borderRadius: '12px', 
      border: '1px solid var(--glass-border)',
      opacity: item.is_completed ? 0.6 : 1,
      transition: 'all 0.2s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
        <input 
          type="checkbox" 
          checked={item.is_completed} 
          onChange={toggleComplete}
          style={{ transform: 'scale(1.2)', cursor: 'pointer', accentColor: 'var(--accent-color)' }}
        />
        
        {isEditing ? (
          <input 
            type="text"
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); }}
            onBlur={saveEdit}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--accent-color)',
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              outline: 'none'
            }}
          />
        ) : (
          <span 
            onClick={!item.is_completed ? startEdit : undefined}
            style={{ 
              fontSize: '1.1rem', 
              wordBreak: 'break-word', 
              textDecoration: item.is_completed ? 'line-through' : 'none',
              cursor: item.is_completed ? 'default' : 'text',
              flex: 1
            }}>
            {item.content}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginLeft: '1rem' }}>
        <span style={{ 
          padding: '0.2rem 0.6rem', 
          borderRadius: '20px', 
          fontSize: '0.8rem',
          background: `var(--priority-${item.priority})`,
          color: '#fff',
          fontWeight: 'bold'
        }}>
          P{item.priority}
        </span>
        <button 
          onClick={deleteMemo}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--priority-5)',
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: '0 0.2rem',
            opacity: 0.7
          }}
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
