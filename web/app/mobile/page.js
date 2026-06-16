'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MinimalMobileApp() {
  const [memos, setMemos] = useState([]);
  const [categories, setCategories] = useState([]);
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
    });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newMemo.trim()) return;
    
    const content = newMemo;
    const tempId = Date.now();
    setMemos(prev => [{ id: tempId, content, priority: 3, is_completed: false, created_at: new Date().toISOString() }, ...prev]);
    setNewMemo('');
    
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

  // Group memos
  const grouped = { 'Uncategorized': [] };
  categories.forEach(c => grouped[c.name] = []);
  
  memos.forEach(m => {
    let hasCat = false;
    if (m.categories) {
      m.categories.forEach(c => {
        if (c !== 'Uncategorized') {
          if (!grouped[c]) grouped[c] = [];
          grouped[c].push(m);
          hasCat = true;
        }
      });
    }
    if (!hasCat) grouped['Uncategorized'].push(m);
  });

  return (
    <div className="min-app-bg">
      {/* Top Nav */}
      <div className="min-top-nav">
        <div className="min-nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        </div>
        <div className="min-nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        </div>
        <div className="min-nav-title">All Tasks</div>
        <div className="min-nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        </div>
        <div className="min-nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-content">
        {Object.entries(grouped).map(([groupName, groupMemos]) => {
          if (groupMemos.length === 0) return null;
          
          return (
            <div key={groupName}>
              <div className="min-group-header">{groupName === 'Uncategorized' ? 'Tasks' : groupName}</div>
              
              {groupMemos.map(item => (
                <div key={item.id} className={`min-task-row ${item.is_completed ? 'completed' : ''}`}>
                  <input 
                    type="checkbox" 
                    className="min-checkbox"
                    checked={item.is_completed}
                    onChange={() => toggleComplete(item)}
                  />
                  <div className="min-task-text">{item.content}</div>
                  {item.is_completed && (
                    <button className="min-delete-btn" onClick={() => deleteMemo(item.id)}>✕</button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Add Task Area */}
      <div className="min-add-area">
        <div className="min-input-wrapper">
          <form onSubmit={handleAdd} style={{ width: '100%', margin: 0, padding: 0 }}>
            <input 
              type="text" 
              className="min-add-input"
              placeholder="I want to..."
              value={newMemo}
              onChange={e => setNewMemo(e.target.value)}
            />
          </form>
        </div>
        <button className="min-add-btn" onClick={handleAdd}>+</button>
      </div>

      {/* Bottom Tab Nav */}
      <div className="min-bottom-nav">
        <div className="min-tab active">
          <div className="min-tab-icon" style={{ background: '#333', color: 'white' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          Tasks
        </div>
        <div className="min-tab">
          <div className="min-tab-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          Calendar
        </div>
        <div className="min-tab">
          <div className="min-tab-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          Moment
        </div>
      </div>
    </div>
  );
}
