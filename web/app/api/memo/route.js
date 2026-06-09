import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';

// Initialize OpenAI client only if API key is provided
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

export async function POST(req) {
  try {
    const { text, priority, categories: manualCategories } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    let categories = Array.isArray(manualCategories) && manualCategories.length > 0 ? manualCategories : ['Uncategorized'];
    let processedText = text.trim();
    
    // Check if user explicitly wants AI categorization
    const useAI = processedText.toLowerCase().startsWith('/ai ') || processedText.toLowerCase() === '/ai';
    if (useAI) {
      processedText = processedText.replace(/^\/ai\s*/i, '');
    }
    
    let finalPriority = priority;
    
    // AI Processing if requested and OpenAI is configured
    if (useAI && openai) {
      try {
        let categoryPrompt = `Choose 1 to 3 relevant single word categories (e.g. Work, Personal). If it doesn't fit any obvious category, output ["Uncategorized"]. Return an array of strings.`;
        if (process.env.POSTGRES_URL) {
          try {
            const catRows = await sql`SELECT name FROM categories`;
            const existingCategories = catRows.rows.map(r => r.name);
            if (existingCategories.length > 0) {
              categoryPrompt = `Choose 1 to 3 relevant categories from this list of your existing categories: [${existingCategories.join(', ')}]. If the task does NOT fit any of these, output ["Uncategorized"]. Return an array of strings.`;
            }
          } catch (e) {
            console.error('Failed to fetch existing categories for AI prompt:', e);
          }
        }

        const aiRes = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: `You are an intelligent task assistant. Analyze the task and return a JSON object with three fields:\n1. "categories": ${categoryPrompt}\n2. "priority": An integer from 1 (lowest) to 5 (highest) based on urgency.\n3. "content": The user's description, but grammatically corrected, simplified, and concise.\nOutput ONLY valid JSON. Do NOT wrap in markdown.` 
            },
            { role: 'user', content: processedText }
          ],
          max_tokens: 150,
          temperature: 0.1
        });
        
        try {
            const aiData = JSON.parse(aiRes.choices[0].message.content.trim());
            if (Array.isArray(aiData.categories)) categories = aiData.categories;
            else if (aiData.category) categories = [aiData.category];
            if (aiData.priority) finalPriority = aiData.priority;
            if (aiData.content) processedText = aiData.content;
        } catch (parseErr) {
            console.error('Failed to parse AI JSON:', aiRes.choices[0].message.content, parseErr);
        }
      } catch (err) {
        console.error('AI Categorization failed:', err);
      }
    }

    const categoryString = categories.join(',');

    // Save to Postgres if configured
    if (process.env.POSTGRES_URL) {
      // NOTE: Ensure table 'memos' exists. Schema: id SERIAL PRIMARY KEY, content TEXT, priority INT, category TEXT, created_at TIMESTAMP DEFAULT NOW()
      await sql`
        INSERT INTO memos (content, priority, category) 
        VALUES (${processedText}, ${finalPriority}, ${categoryString})
      `;
    } else {
      console.warn('POSTGRES_URL is not set. Skipping database insert.', { text, priority, categories });
    }

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Failed to create memo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ memos: [], warning: 'No database configured' });
    }
    
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    
    let rows;
    if (q) {
      const queryStr = `%${q}%`;
      const result = await sql`SELECT * FROM memos WHERE content ILIKE ${queryStr} ORDER BY id DESC LIMIT 50`;
      rows = result.rows;
    } else {
      const result = await sql`SELECT * FROM memos ORDER BY id DESC LIMIT 50`;
      rows = result.rows;
    }
    
    // Map the comma-separated category string to an array for clients
    const formattedRows = rows.map(r => ({
      ...r,
      categories: r.category ? r.category.split(',').map(c => c.trim()) : ['Uncategorized']
    }));
    
    return NextResponse.json({ memos: formattedRows });
  } catch (error) {
    console.error('Failed to fetch memos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, is_completed, content, priority, categories } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    if (is_completed !== undefined) {
      await sql`UPDATE memos SET is_completed = ${is_completed} WHERE id = ${id}`;
    }
    if (content !== undefined) {
      await sql`UPDATE memos SET content = ${content} WHERE id = ${id}`;
    }
    if (priority !== undefined) {
      await sql`UPDATE memos SET priority = ${priority} WHERE id = ${id}`;
    }
    if (categories !== undefined) {
      const categoryString = categories.join(',');
      await sql`UPDATE memos SET category = ${categoryString} WHERE id = ${id}`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update memo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await sql`DELETE FROM memos WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete memo:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
