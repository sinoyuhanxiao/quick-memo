import readline from 'readline';

const API_URL = 'http://localhost:3000/api/memo';
const LEARNING_API_URL = 'http://localhost:3000/api/learning';
const CATEGORY_API_URL = 'http://localhost:3000/api/categories';

// ANSI Color Codes
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    italic: '\x1b[3m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgBlack: '\x1b[40m'
};

let tasks = [];
let learnings = [];
let categories = [];
let currentSort = 'priority';
let showHelp = false;
let viewMode = 'pending'; // 'pending', 'completed', or 'learnings'
let filterCategory = null;

// Fetch from Next.js Cloud API
async function fetchTasks() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        if (data.memos) {
            tasks = data.memos;
        }
    } catch (err) {
        console.log(`\n${c.red}Error: Cannot connect to Web API at ${API_URL}${c.reset}`);
        console.log(`${c.dim}Make sure 'npm run dev' is running in the /web folder.${c.reset}\n`);
    }
}

async function fetchLearnings() {
    try {
        const res = await fetch(LEARNING_API_URL);
        const data = await res.json();
        if (data.learnings) {
            learnings = data.learnings;
        }
    } catch (err) {}
}

async function fetchCategories() {
    try {
        const res = await fetch(CATEGORY_API_URL);
        const data = await res.json();
        if (data.categories) categories = data.categories.map(c => c.name);
    } catch (e) {}
}

async function addTask(text, priority, category) {
    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, priority, category })
        });
        await fetchTasks();
    } catch (e) {}
}

async function addLearning(content) {
    try {
        await fetch(LEARNING_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        await fetchLearnings();
    } catch (e) {}
}

async function updateTask(id, is_completed, content, priority, category) {
    try {
        const body = { id };
        if (is_completed !== undefined) body.is_completed = is_completed;
        if (content !== undefined) body.content = content;
        if (priority !== undefined) body.priority = priority;
        if (category !== undefined) body.category = category;

        await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        await fetchTasks();
    } catch (e) {}
}

async function deleteTasks(ids) {
    try {
        for (const id of ids) {
            await fetch(API_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
        }
        await fetchTasks();
    } catch (e) {}
}

async function deleteLearnings(ids) {
    try {
        for (const id of ids) {
            await fetch(LEARNING_API_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
        }
        await fetchLearnings();
    } catch (e) {}
}

async function updateLearning(id, content) {
    try {
        await fetch(LEARNING_API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, content })
        });
        await fetchLearnings();
    } catch (e) {}
}

// Command Hints
const COMMAND_HINTS = [
    { cmd: '/learn <text>', desc: 'Record a new learning for today' },
    { cmd: '/learnings', desc: 'Switch view to your Learning Zone' },
    { cmd: '/todos', desc: 'Switch view to your Todos (pending)' },
    { cmd: '/completed', desc: 'Switch view to your completed Todos' },
    { cmd: '/filter <cat>', desc: 'Filter tasks by Category (e.g. /filter Work). Use /filter all to clear.' },
    { cmd: '/categories', desc: 'List all existing categories' },
    { cmd: '/categories create <n>', desc: 'Create an empty category' },
    { cmd: '/categories rename <o> <n>', desc: 'Rename a category globally' },
    { cmd: '/categories delete <n>', desc: 'Delete a category globally' },
    { cmd: '/ai <text>', desc: 'Call AI to automatically categorize the memo' },
    { cmd: '/done <ids>', desc: 'Mark one or more tasks as completed' },
    { cmd: '/undo <ids>', desc: 'Mark completed tasks as pending again' },
    { cmd: '/delete <ids>', desc: 'Permanently remove one or more tasks' },
    { cmd: '/edit <id> <text>', desc: 'Modify the text of an existing task' },
    { cmd: '/history', desc: 'Toggle view between pending and completed tasks' },
    { cmd: '/sort', desc: 'Toggle sorting between Priority and Newest' },
    { cmd: '/refresh', desc: 'Sync data manually with the server' },
    { cmd: '/help', desc: 'Toggle this command list visibility' },
    { cmd: '/exit', desc: 'Close the Q-TODO terminal' }
];

// Initialize Readline
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${c.bold}${c.cyan}❯${c.reset} `
});

function drawUI() {
    console.clear();
    
    // Header
    console.log(`${c.bold}${c.cyan}╔════════════════════════════════════════════════════════════════╗${c.reset}`);
    console.log(`${c.bold}${c.cyan}║${c.reset}${c.bold}               🔥 QUICK MEMO TERMINAL (SYNCED)                  ${c.cyan}║${c.reset}`);
    console.log(`${c.bold}${c.cyan}╚════════════════════════════════════════════════════════════════╝${c.reset}\n`);

    if (viewMode === 'learnings') {
        console.log(`  ${c.bold}LEARNING ZONE (Grouped by Date)${c.reset}\n`);
        
        if (learnings.length === 0) {
            console.log(`  ${c.dim}${c.italic}No learnings recorded yet. Start learning!${c.reset}\n`);
        } else {
            const grouped = learnings.reduce((acc, curr) => {
                if (!acc[curr.date_category]) acc[curr.date_category] = [];
                acc[curr.date_category].push(curr);
                return acc;
            }, {});
            
            Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a)).forEach(date => {
                console.log(`  ${c.bold}${c.magenta}📅 ${date}${c.reset}`);
                grouped[date].forEach(l => {
                    const idStr = `${c.bold}${c.cyan}${l.id.toString().padStart(3, ' ')}.${c.reset}`;
                    console.log(`    ${idStr} ${c.white}${l.content}${c.reset}`);
                });
                console.log('');
            });
        }
    } else {
        let displayTasks = viewMode === 'pending' ? tasks.filter(t => !t.is_completed) : tasks.filter(t => t.is_completed);
        
        if (filterCategory) {
            displayTasks = displayTasks.filter(t => (t.category || 'Uncategorized').toLowerCase() === filterCategory.toLowerCase());
        }

        if (displayTasks.length === 0) {
            if (filterCategory) {
                console.log(`  ${c.dim}${c.italic}No ${viewMode} tasks in category '${filterCategory}'.${c.reset}\n`);
            } else if (viewMode === 'pending') {
                console.log(`  ${c.dim}${c.italic}No pending tasks. You are all caught up!${c.reset}\n`);
            } else {
                console.log(`  ${c.dim}${c.italic}No completed tasks yet.${c.reset}\n`);
            }
        } else {
            if (currentSort === 'priority') {
                displayTasks.sort((a, b) => b.priority - a.priority);
            } else {
                displayTasks.sort((a, b) => b.id - a.id);
            }
            
            const title = viewMode === 'pending' ? 'PENDING IDEAS' : 'COMPLETED TASKS';
            const filterStr = filterCategory ? ` | Filter: ${filterCategory}` : '';
            console.log(`  ${c.bold}${title} (Sorted by: ${currentSort === 'priority' ? 'Priority' : 'Newest'}${filterStr}):${c.reset}\n`);
            
            displayTasks.forEach(t => {
                let prioBadge = '';
                if (t.priority === 5) prioBadge = `${c.bgBlack}${c.red}[P5 High]${c.reset}`;
                else if (t.priority === 4) prioBadge = `${c.bgBlack}${c.yellow}[P4 Med+]${c.reset}`;
                else if (t.priority === 3) prioBadge = `${c.bgBlack}${c.magenta}[P3 Med ]${c.reset}`;
                else if (t.priority === 2) prioBadge = `${c.bgBlack}${c.green}[P2 Low+]${c.reset}`;
                else if (t.priority === 1) prioBadge = `${c.bgBlack}${c.blue}[P1 Low ]${c.reset}`;
                else prioBadge = `${c.bgBlack}${c.magenta}[P3 Med ]${c.reset}`;

                const catBadge = t.category && t.category !== 'Uncategorized' ? `${c.dim}[${t.category}]${c.reset}` : '';
                const idStr = `${c.bold}${c.cyan}${t.id.toString().padStart(3, ' ')}.${c.reset}`;
                
                console.log(`  ${idStr} ${prioBadge} ${catBadge} ${c.white}${t.content}${c.reset}`);
            });
            console.log('');
        }
    }

    // Help text
    console.log(`${c.dim}──────────────────────────────────────────────────────────────────${c.reset}`);
    console.log(`${c.dim}💡 Type an idea to add it. Use !5 (High) to !1 (Low) to set priority.${c.reset}`);
    
    if (showHelp) {
        console.log(`${c.bold}${c.yellow}⚡ COMMANDS:${c.reset}`);
        COMMAND_HINTS.forEach(h => {
            console.log(`   ${c.cyan}${h.cmd.padEnd(15)}${c.reset} ${c.dim}- ${h.desc}${c.reset}`);
        });
        console.log(`   ${c.cyan}${'/help'.padEnd(15)}${c.reset} ${c.dim}- Hide this command list${c.reset}`);
    } else {
        console.log(`${c.dim}   (Type ${c.cyan}/help${c.dim} to see all available commands)${c.reset}`);
    }
    console.log(`${c.dim}──────────────────────────────────────────────────────────────────${c.reset}\n`);
    
    rl.prompt();
}

rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) {
        drawUI();
        return;
    }

    const parts = input.split(' ');
    const cmd = parts[0].toLowerCase();
    const localCommands = ['/exit', '/quit', '/done', '/undo', '/delete', '/rm', '/refresh', '/sort', '/edit', '/help', '/history', '/todos', '/completed', '/done-list', '/learnings', '/learn', '/filter', '/categories'];

    if (localCommands.includes(cmd)) {
        if (cmd === '/exit' || cmd === '/quit') {
            console.log(`\n${c.green}Goodbye!${c.reset}\n`);
            process.exit(0);
        } else if (cmd === '/done') {
            const ids = parts.slice(1).map(p => parseInt(p.replace(/,/g, ''))).filter(id => !isNaN(id));
            for (const id of ids) await updateTask(id, true);
        } else if (cmd === '/undo') {
            const ids = parts.slice(1).map(p => parseInt(p.replace(/,/g, ''))).filter(id => !isNaN(id));
            for (const id of ids) await updateTask(id, false);
        } else if (cmd === '/delete' || cmd === '/rm') {
            const ids = parts.slice(1).map(p => parseInt(p.replace(/,/g, ''))).filter(id => !isNaN(id));
            if (ids.length > 0) {
                if (viewMode === 'learnings') {
                    await deleteLearnings(ids);
                } else {
                    await deleteTasks(ids);
                }
            }
        } else if (cmd === '/refresh') {
            await fetchTasks();
        } else if (cmd === '/todos') {
            viewMode = 'pending';
        } else if (cmd === '/learnings') {
            viewMode = 'learnings';
        } else if (cmd === '/learn') {
            const content = parts.slice(1).join(' ').trim();
            if (content) {
                await addLearning(content);
            }
        } else if (cmd === '/sort') {
            currentSort = currentSort === 'priority' ? 'newest' : 'priority';
        } else if (cmd === '/filter') {
            const cat = parts.slice(1).join(' ').trim();
            if (!cat || cat.toLowerCase() === 'all' || cat.toLowerCase() === 'clear') {
                filterCategory = null;
            } else if (cat.toLowerCase() === 'none') {
                filterCategory = 'Uncategorized';
            } else {
                filterCategory = cat;
            }
        } else if (cmd === '/categories') {
            const commandStr = input.slice(cmd.length).trim();
            const args = [];
            const regex = /"([^"]+)"|'([^']+)'|(\S+)/g;
            let match;
            while ((match = regex.exec(commandStr)) !== null) {
                args.push(match[1] || match[2] || match[3]);
            }
            
            const action = args[0] ? args[0].toLowerCase() : null;
            if (action === 'create') {
                const name = args.slice(1).join(' ').trim();
                if (name) {
                    await fetch(CATEGORY_API_URL, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name }) });
                    await fetchCategories();
                }
            } else if (action === 'rename') {
                const oldName = args[1];
                const newName = args[2];
                if (oldName && newName) {
                    await fetch(CATEGORY_API_URL, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ oldName, newName }) });
                    await fetchCategories();
                    await fetchTasks();
                }
            } else if (action === 'delete') {
                const name = args.slice(1).join(' ').trim();
                if (name) {
                    await fetch(CATEGORY_API_URL, { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name }) });
                    await fetchCategories();
                    await fetchTasks();
                }
            }

            console.log(`\n  ${c.bold}EXISTING CATEGORIES:${c.reset}`);
            categories.forEach(cat => console.log(`  ${c.dim}-${c.reset} ${c.white}${cat}${c.reset}`));
            if (categories.length === 0) console.log(`  ${c.dim}No categories yet.${c.reset}`);
            console.log('');
            rl.prompt();
            return;
        } else if (cmd === '/help') {
            showHelp = !showHelp;
        } else if (cmd === '/history') {
            viewMode = viewMode === 'pending' ? 'completed' : 'pending';
        } else if (cmd === '/completed' || cmd === '/done-list') {
            viewMode = 'completed';
        } else if (cmd === '/edit') {
            const id = parseInt(parts[1]);
            let newText = parts.slice(2).join(' ').trim();
            if (id) {
                if (viewMode === 'learnings') {
                    if (newText) {
                        await updateLearning(id, newText);
                    } else {
                        const l = learnings.find(x => x.id === id);
                        if (l) {
                            drawUI();
                            rl.write(`/edit ${id} ${l.content}`);
                            return;
                        }
                    }
                } else {
                    let newPriority = undefined;
                    let newCategory = undefined;
                    
                    const prioMatch = newText.match(/!(1|2|3|4|5)\b/);
                    if (prioMatch) {
                        newPriority = parseInt(prioMatch[1]);
                        newText = newText.replace(prioMatch[0], '').trim();
                    }

                    const catMatch = newText.match(/#(\w+)/);
                    if (catMatch) {
                        newCategory = catMatch[1];
                        newCategory = newCategory.charAt(0).toUpperCase() + newCategory.slice(1).toLowerCase();
                        newText = newText.replace(catMatch[0], '').trim();
                    }

                    if (newText || newPriority !== undefined || newCategory !== undefined) {
                        await updateTask(id, undefined, newText || undefined, newPriority, newCategory);
                    } else {
                        const task = tasks.find(t => t.id === id);
                        if (task) {
                            drawUI();
                            const catTag = task.category && task.category !== 'Uncategorized' ? ` #${task.category}` : '';
                            rl.write(`/edit ${id} ${task.content} !${task.priority}${catTag}`);
                            return;
                        }
                    }
                }
            }
        }
        drawUI();
        return;
    }

    // Parse as a new task
    let priority = 3; // Default medium
    let category = undefined;
    let text = input;

    // Check for priority flag !1, !2, !3, !4, !5
    const prioMatch = text.match(/!(1|2|3|4|5)\b/);
    if (prioMatch) {
        priority = parseInt(prioMatch[1]);
        text = text.replace(prioMatch[0], '').trim();
    }
    
    // Check for category tag #CategoryName
    const catMatch = text.match(/#(\w+)/);
    if (catMatch) {
        category = catMatch[1];
        category = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
        text = text.replace(catMatch[0], '').trim();
    } else if (filterCategory) {
        category = filterCategory;
    }

    if (text) {
        await addTask(text, priority, category);
    } drawUI();
}).on('close', () => {
    console.log(`\n${c.green}Goodbye!${c.reset}\n`);
    process.exit(0);
});



// Start app
async function init() {
    await fetchTasks();
    await fetchLearnings();
    await fetchCategories();
    drawUI();
}

init();
