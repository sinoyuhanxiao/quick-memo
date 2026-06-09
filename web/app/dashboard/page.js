'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [memos, setMemos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'priority'
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);

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
      if (catData.categories) setCategories(catData.categories);
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

  // Sort and filter
  const processedMemos = [...memos]
    .filter(m => !searchQuery || m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'priority') {
        return b.priority - a.priority;
      }
      return b.id - a.id;
    });

  const grouped = processedMemos.reduce((acc, memo) => {
    const cats = memo.categories && memo.categories.length > 0 ? memo.categories : ['Uncategorized'];
    cats.forEach(cat => {
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(memo);
    });
    return acc;
  }, {});

  // Combine DB categories with any orphaned categories still in memos just in case
  const uniqueCats = new Set([...categories.map(c => c.name), ...Object.keys(grouped)]);
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
            className="filter-select"
          >
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
            ))}
          </select>
          <button 
            onClick={() => setShowManageModal(true)} 
            className="nav-link" 
            style={{ marginRight: '1rem', background: 'none', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
          >
            ⚙️ Manage Tags
          </button>
          <Link href="/learning" className="nav-link" style={{ marginRight: '1rem' }}>
            🧠 Learning Zone
          </Link>
          <Link href="/" className="nav-link">
            + New Idea
          </Link>
        </div>
      </div>
      <div className="search-container" style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="🔍 Search ideas..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(139, 115, 85, 0.2)', background: 'rgba(255, 255, 255, 0.5)', outline: 'none', color: '#4a3f35', fontSize: '1rem' }}
        />
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
                    categories={categories}
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
                          categories={categories}
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
      
      {showManageModal && (
        <ManageCategoriesModal 
          categories={categories} 
          onClose={() => setShowManageModal(false)} 
          onRefresh={fetchData} 
        />
      )}
    </main>
  );
}

function ManageCategoriesModal({ categories, onClose, onRefresh }) {
  const [editingCat, setEditingCat] = useState(null);
  const [editName, setEditName] = useState('');
  
  const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'];

  const handleDelete = async (name) => {
    if (!confirm(`Delete category "${name}"? Memos will become Uncategorized.`)) return;
    await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    onRefresh();
  };

  const handleUpdate = async (oldName, newName, color) => {
    await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldName, newName, color })
    });
    setEditingCat(null);
    onRefresh();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="glass-panel" style={{ width: '400px', padding: '2rem', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--accent-color)', margin: 0 }}>Manage Tags</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
        </div>
        
        {categories.length === 0 ? <p>No categories yet.</p> : null}
        
        {categories.map(cat => (
          <div key={cat.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
            {editingCat === cat.name ? (
              <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center' }}>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={{ flex: 1, padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--glass-border)' }} />
                <button onClick={() => handleUpdate(cat.name, editName, cat.color)} style={{ padding: '0.3rem 0.6rem', cursor: 'pointer', borderRadius: '4px', border: 'none', background: 'var(--accent-color)', color: 'white' }}>Save</button>
                <button onClick={() => setEditingCat(null)} style={{ padding: '0.3rem 0.6rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'transparent' }}>Cancel</button>
              </div>
            ) : (
              <>
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{cat.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select 
                    value={cat.color || ''} 
                    onChange={e => handleUpdate(cat.name, cat.name, e.target.value)}
                    style={{ padding: '0.2rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                  >
                    <option value="">Default</option>
                    {colors.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => { setEditingCat(cat.name); setEditName(cat.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => handleDelete(cat.name)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MemoRow({ item, toggleComplete, deleteMemo, startEdit, saveEdit, isEditing, editContent, setEditContent, categories }) {
  const UI_COLORS = {
    red: { bg: '#fee2e2', text: '#ef4444' },
    green: { bg: '#d1fae5', text: '#10b981' },
    yellow: { bg: '#fef3c7', text: '#f59e0b' },
    blue: { bg: '#dbeafe', text: '#3b82f6' },
    magenta: { bg: '#fae8ff', text: '#d946ef' },
    cyan: { bg: '#cffafe', text: '#06b6d4' }
  };

  const getBadgeStyle = (catName) => {
    const catObj = categories && categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    if (catObj && catObj.color && UI_COLORS[catObj.color.toLowerCase()]) {
      return { background: UI_COLORS[catObj.color.toLowerCase()].bg, color: UI_COLORS[catObj.color.toLowerCase()].text };
    }
    return { background: 'rgba(139, 115, 85, 0.1)', color: 'var(--text-secondary)' };
  };

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

      <div className="todo-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {item.categories && item.categories.filter(c => c !== 'Uncategorized').map(cat => (
          <span key={cat} className="todo-category-badge" style={{ ...getBadgeStyle(cat), padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {cat}
          </span>
        ))}
        <span className="todo-priority-badge" style={{ background: `var(--priority-${item.priority})`, padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: 'white', fontWeight: 'bold' }}>
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
