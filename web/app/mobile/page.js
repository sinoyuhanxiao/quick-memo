'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MobileApp() {
  const [memos, setMemos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemo, setNewMemo] = useState('');

  useEffect(() => {
    fetchData();
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

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newMemo.trim()) return;
    
    // Auto-assign category if filtered
    const content = filterCategory !== 'All' ? `${newMemo} #${filterCategory}` : newMemo;
    
    // Optimistic UI
    const tempId = Date.now();
    setMemos(prev => [{ id: tempId, content, priority: 3, is_completed: false, created_at: new Date().toISOString() }, ...prev]);
    setNewMemo('');
    setShowAddForm(false);
    
    await fetch('/api/memo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, priority: 3 })
    });
    fetchData();
  };

  const toggleComplete = async (memo) => {
    setMemos(prev => prev.map(m => m.id === memo.id ? { ...m, is_completed: !m.is_completed } : m));
    await fetch('/api/memo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: memo.id, is_completed: !memo.is_completed })
    });
  };

  const deleteMemo = async (id) => {
    setMemos(prev => prev.filter(m => m.id !== id));
    await fetch('/api/memo', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  };

  const grouped = { 'All': memos, ...categories.reduce((acc, cat) => ({...acc, [cat.name]: []}), {}) };
  memos.forEach(m => {
    if (m.categories) {
      m.categories.filter(c => c !== 'Uncategorized').forEach(c => {
        if (!grouped[c]) grouped[c] = [];
        grouped[c].push(m);
      });
    }
  });

  const displayItems = filterCategory === 'All' ? memos : (grouped[filterCategory] || []);
  const activeItems = displayItems.filter(i => !i.is_completed).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const completedItems = displayItems.filter(i => i.is_completed).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const UI_COLORS = {
    red: { bg: '#fee2e2', text: '#ef4444' }, green: { bg: '#d1fae5', text: '#10b981' },
    yellow: { bg: '#fef3c7', text: '#f59e0b' }, blue: { bg: '#dbeafe', text: '#3b82f6' },
    magenta: { bg: '#fae8ff', text: '#d946ef' }, cyan: { bg: '#cffafe', text: '#06b6d4' }
  };

  const getBadgeStyle = (catName) => {
    const catObj = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    if (catObj && catObj.color && UI_COLORS[catObj.color.toLowerCase()]) {
      return { background: UI_COLORS[catObj.color.toLowerCase()].bg, color: UI_COLORS[catObj.color.toLowerCase()].text };
    }
    return { background: 'rgba(139, 115, 85, 0.1)', color: 'var(--text-secondary)' };
  };

  return (
    <div className="mobile-app-container">
      {/* Sticky Header */}
      <header className="mobile-header-sticky">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="mobile-title">QuickMemo</h1>
          <Link href="/dashboard" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Desktop View</Link>
        </div>
        
        {/* Horizontal Category Scroller */}
        <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          <button onClick={() => setFilterCategory('All')} className={`mobile-tab-btn ${filterCategory === 'All' ? 'active' : ''}`}>All</button>
          {categories.map(cat => (
            <button key={cat.name} onClick={() => setFilterCategory(cat.name)} className={`mobile-tab-btn ${filterCategory === cat.name ? 'active' : ''}`}>{cat.name}</button>
          ))}
        </div>
      </header>

      {/* Add Form Overlay / Inline */}
      {showAddForm && (
        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.8)', borderBottom: '1px solid var(--glass-border)' }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={newMemo} 
              onChange={e => setNewMemo(e.target.value)} 
              placeholder={`Add to ${filterCategory}...`}
              style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--glass-border)', fontSize: '1rem', outline: 'none' }}
              autoFocus
            />
            <button type="submit" style={{ background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '12px', padding: '0 1rem', fontWeight: 'bold' }}>Add</button>
          </form>
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingTop: '1rem' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>Loading ideas...</p>
        ) : (
          <>
            {activeItems.length === 0 && completedItems.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '3rem' }}>No ideas here yet. Tap + to add one.</p>
            )}

            {/* Active Items */}
            {activeItems.map(item => (
              <div key={item.id} className="mobile-card animate-in">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <input 
                    type="checkbox" 
                    checked={item.is_completed} 
                    onChange={() => toggleComplete(item)}
                    style={{ marginTop: '0.4rem', width: '20px', height: '20px', accentColor: 'var(--accent-color)' }}
                  />
                  <span className="mobile-card-text">{item.content}</span>
                </div>
                
                <div className="mobile-card-footer">
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {item.categories && item.categories.filter(c => c !== 'Uncategorized').map(cat => (
                      <span key={cat} style={{ ...getBadgeStyle(cat), padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {cat}
                      </span>
                    ))}
                    <span style={{ background: `var(--priority-${item.priority})`, padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', color: 'white', fontWeight: 'bold' }}>
                      P{item.priority}
                    </span>
                  </div>
                  <button onClick={() => deleteMemo(item.id)} style={{ background: 'none', border: 'none', color: 'var(--priority-5)', fontSize: '1.2rem', padding: '0.5rem' }}>🗑️</button>
                </div>
              </div>
            ))}

            {/* Completed Items */}
            {completedItems.length > 0 && (
              <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px dashed rgba(139, 115, 85, 0.2)' }}>
                <h4 style={{ color: 'var(--text-secondary)', margin: '0 1.5rem 1rem 1.5rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Completed</h4>
                {completedItems.map(item => (
                  <div key={item.id} className="mobile-card" style={{ opacity: 0.6 }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <input 
                        type="checkbox" 
                        checked={item.is_completed} 
                        onChange={() => toggleComplete(item)}
                        style={{ marginTop: '0.4rem', width: '20px', height: '20px', accentColor: 'var(--accent-color)' }}
                      />
                      <span className="mobile-card-text" style={{ textDecoration: 'line-through' }}>{item.content}</span>
                    </div>
                    <div className="mobile-card-footer">
                      <button onClick={() => deleteMemo(item.id)} style={{ background: 'none', border: 'none', color: 'var(--priority-5)', fontSize: '1.2rem', padding: '0.5rem', marginLeft: 'auto' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Action Button */}
      <button 
        className="mobile-fab" 
        onClick={() => {
          setShowAddForm(!showAddForm);
          if (!showAddForm) window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        {showAddForm ? '×' : '+'}
      </button>
    </div>
  );
}
