'use client';
import { useEffect, useState } from 'react';

export default function MinimalMobileApp() {
  const [memos, setMemos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newMemo, setNewMemo] = useState('');

  function fetchData() {
    Promise.all([
      fetch('/api/memo').then(res => res.json()),
      fetch('/api/categories').then(res => res.json())
    ]).then(([memoData, catData]) => {
      if (memoData.memos) setMemos(memoData.memos);
      if (catData.categories) setCategories(catData.categories);
    });
  }

  useEffect(() => {
    fetchData();
    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

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

  const totalTasks = memos.length;
  const openTasks = memos.filter(m => !m.is_completed).length;
  const completedTasks = totalTasks - openTasks;

  return (
    <div className="min-app-bg">
      {/* Top Nav */}
      <div className="min-top-nav">
        <div>
          <div className="min-kicker">Quick Memo</div>
          <div className="min-nav-title">Today&apos;s Tasks</div>
        </div>
        <div className="min-count-pill">
          <span>{openTasks}</span>
          open
        </div>
      </div>

      {/* Content Area */}
      <div className="min-content">
        <section className="min-hero-card">
          <div>
            <div className="min-hero-label">Progress</div>
            <div className="min-hero-title">{completedTasks} done, {openTasks} left</div>
          </div>
          <div className="min-hero-meter">
            <div
              className="min-hero-meter-fill"
              style={{ width: totalTasks ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%' }}
            />
          </div>
        </section>

        {totalTasks === 0 && (
          <div className="min-empty-state">
            <div className="min-empty-icon">+</div>
            <div className="min-empty-title">No tasks yet</div>
            <div className="min-empty-copy">Add a quick memo below and it will show up here.</div>
          </div>
        )}

        {Object.entries(grouped).map(([groupName, groupMemos]) => {
          if (groupMemos.length === 0) return null;
          
          return (
            <section key={groupName} className="min-group-card">
              <div className="min-group-header">
                <span>{groupName === 'Uncategorized' ? 'Inbox' : groupName}</span>
                <span>{groupMemos.length}</span>
              </div>
              
              {groupMemos.map(item => (
                <div key={item.id} className={`min-task-row ${item.is_completed ? 'completed' : ''}`}>
                  <input 
                    type="checkbox" 
                    className="min-checkbox"
                    checked={item.is_completed}
                    onChange={() => toggleComplete(item)}
                  />
                  <div className="min-task-body">
                    <div className="min-task-text">{item.content}</div>
                    {item.categories?.length > 0 && (
                      <div className="min-task-meta">
                        {item.categories.map(category => (
                          <span key={category}>{category}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {item.is_completed && (
                    <button className="min-delete-btn" onClick={() => deleteMemo(item.id)}>✕</button>
                  )}
                </div>
              ))}
            </section>
          );
        })}
      </div>

      {/* Add Task Area */}
      <div className="min-add-area">
        <form onSubmit={handleAdd} className="min-input-wrapper">
            <input 
              type="text" 
              className="min-add-input"
              placeholder="Add a task..."
              value={newMemo}
              onChange={e => setNewMemo(e.target.value)}
            />
        </form>
        <button className="min-add-btn" onClick={handleAdd}>+</button>
      </div>

      {/* Bottom Tab Nav */}
      <div className="min-bottom-nav">
        <div className="min-tab active">
          <div className="min-tab-icon">
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
