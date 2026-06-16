'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function IosRemindersApp() {
  const [memos, setMemos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'list'
  const [activeList, setActiveList] = useState(null); 
  
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
    
    const isCustomCat = activeList && activeList !== 'All' && activeList !== 'Completed';
    const content = isCustomCat ? `${newMemo} #${activeList}` : newMemo;
    
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

  // Data processing
  const grouped = { 'All': memos, ...categories.reduce((acc, cat) => ({...acc, [cat.name]: []}), {}) };
  memos.forEach(m => {
    if (m.categories) {
      m.categories.filter(c => c !== 'Uncategorized').forEach(c => {
        if (!grouped[c]) grouped[c] = [];
        grouped[c].push(m);
      });
    }
  });

  const activeAll = memos.filter(m => !m.is_completed);
  const completedAll = memos.filter(m => m.is_completed);

  // Define iOS Colors
  const UI_COLORS = {
    red: '#ff3b30', green: '#34c759', yellow: '#ffcc00', 
    blue: '#007aff', magenta: '#af52de', cyan: '#5ac8fa'
  };

  const getColor = (colorName) => UI_COLORS[colorName?.toLowerCase()] || '#8a8a8e';

  // Screen Rendering
  if (currentScreen === 'home') {
    return (
      <div className="ios-bg">
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '15px' }}>
          <Link href="/dashboard" style={{ color: '#007aff', textDecoration: 'none', fontSize: '17px' }}>Desktop</Link>
        </div>

        {/* Smart Lists Grid */}
        <div className="ios-grid">
          <div className="ios-grid-card" onClick={() => { setActiveList('All'); setCurrentScreen('list'); }}>
            <div className="ios-grid-icon-row">
              <div className="ios-grid-icon" style={{ background: '#007aff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <div className="ios-grid-count">{activeAll.length}</div>
            </div>
            <div className="ios-grid-title">All</div>
          </div>
          
          <div className="ios-grid-card" onClick={() => { setActiveList('Completed'); setCurrentScreen('list'); }}>
            <div className="ios-grid-icon-row">
              <div className="ios-grid-icon" style={{ background: '#8a8a8e' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div className="ios-grid-count">{completedAll.length}</div>
            </div>
            <div className="ios-grid-title">Completed</div>
          </div>
        </div>

        {/* My Lists Section */}
        <h2 className="ios-list-header">My Lists</h2>
        <div className="ios-list-group">
          {categories.map(cat => {
            const catItems = grouped[cat.name]?.filter(m => !m.is_completed) || [];
            return (
              <div key={cat.name} className="ios-list-row" onClick={() => { setActiveList(cat.name); setCurrentScreen('list'); }}>
                <div className="ios-list-icon" style={{ background: getColor(cat.color) }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                </div>
                <div className="ios-list-text">{cat.name}</div>
                <div className="ios-list-count">{catItems.length}</div>
                <div className="ios-list-chevron">›</div>
              </div>
            );
          })}
          {categories.length === 0 && (
            <div className="ios-list-row">
              <div className="ios-list-text" style={{ color: '#8a8a8e' }}>No custom lists.</div>
            </div>
          )}
        </div>
        
        {/* Bottom Toolbar */}
        <div className="ios-toolbar">
          <button className="ios-new-btn" onClick={() => { setActiveList('All'); setCurrentScreen('list'); setShowAddForm(true); }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            New Reminder
          </button>
        </div>
      </div>
    );
  }

  // List Screen Data Preparation
  let displayItems = [];
  if (activeList === 'All') {
    displayItems = memos.filter(m => !m.is_completed);
  } else if (activeList === 'Completed') {
    displayItems = memos.filter(m => m.is_completed);
  } else {
    displayItems = (grouped[activeList] || []).filter(m => !m.is_completed);
  }
  displayItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  let listColor = '#007aff';
  if (activeList === 'Completed') listColor = '#8a8a8e';
  else if (activeList !== 'All') {
    const catObj = categories.find(c => c.name === activeList);
    listColor = getColor(catObj?.color);
  }

  return (
    <div className="ios-bg">
      {/* Navbar */}
      <div className="ios-nav-bar">
        <button className="ios-back-btn" onClick={() => { setCurrentScreen('home'); setShowAddForm(false); }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Lists
        </button>
      </div>

      <h1 className="ios-large-title" style={{ color: listColor }}>{activeList}</h1>

      {/* Task List */}
      <div className="ios-list-group" style={{ marginTop: '10px' }}>
        {displayItems.length === 0 && !showAddForm && (
          <div className="ios-task-row">
            <div className="ios-task-content">
              <div className="ios-task-title" style={{ color: '#8a8a8e' }}>No reminders</div>
            </div>
          </div>
        )}

        {displayItems.map(item => (
          <div key={item.id} className="ios-task-row">
            <input 
              type="checkbox" 
              className="ios-checkbox"
              checked={item.is_completed}
              onChange={() => toggleComplete(item)}
            />
            <div className="ios-task-content">
              <div className="ios-task-title" style={{ textDecoration: item.is_completed ? 'line-through' : 'none', color: item.is_completed ? '#8a8a8e' : '#000' }}>
                {item.content}
              </div>
              <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: listColor }}>P{item.priority}</span>
                {item.categories && item.categories.filter(c => c !== 'Uncategorized').map(cat => (
                  <span key={cat} style={{ fontSize: '12px', color: '#8a8a8e' }}>#{cat}</span>
                ))}
              </div>
            </div>
            {/* Delete button masquerading as info or we just swipe. Since we can't swipe easily, we put a small trash icon */}
            <button onClick={() => deleteMemo(item.id)} style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '18px', padding: '0 15px', opacity: 0.8 }}>×</button>
          </div>
        ))}
        
        {/* Inline Add Form */}
        {showAddForm && (
          <div className="ios-task-row">
            <div className="ios-checkbox" style={{ opacity: 0.3 }}></div>
            <div className="ios-task-content">
              <form onSubmit={handleAdd} style={{ width: '100%' }}>
                <input 
                  type="text" 
                  value={newMemo}
                  onChange={e => setNewMemo(e.target.value)}
                  placeholder="Title"
                  className="ios-add-input"
                  autoFocus
                  onBlur={() => {
                    if (!newMemo.trim()) setShowAddForm(false);
                  }}
                />
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      <div className="ios-toolbar">
        <button className="ios-new-btn" onClick={() => setShowAddForm(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          New Reminder
        </button>
      </div>
    </div>
  );
}
