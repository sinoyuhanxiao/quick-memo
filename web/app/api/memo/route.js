import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';

// Initialize OpenAI client only if API key is provided
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

export async function POST(req) {
  try {
    const { text, priority, category: manualCategory } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    let category = manualCategory || 'Uncategorized';
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
        let categoryPrompt = `Choose a single word category (e.g. Work, Personal). If it doesn't fit any obvious category, output "Uncategorized".`;
        if (process.env.POSTGRES_URL) {
          try {
            const { rows } = await sql`SELECT DISTINCT category FROM memos WHERE category IS NOT NULL AND category != 'Uncategorized'`;
            const existingCategories = rows.map(r => r.category).filter(Boolean);
            if (existingCategories.length > 0) {
              categoryPrompt = `Choose EXACTLY ONE from this list of your existing categories: [${existingCategories.join(', ')}]. If the task does NOT fit any of these existing categories, output "Uncategorized".`;
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
              content: `You are an intelligent task assistant. Analyze the task and return a JSON object with three fields:\n1. "category": ${categoryPrompt}\n2. "priority": An integer from 1 (lowest) to 5 (highest) based on urgency.\n3. "content": The user's description, but grammatically corrected, simplified, and concise.\nOutput ONLY valid JSON. Do NOT wrap in markdown.` 
            },
            { role: 'user', content: processedText }
          ],
          max_tokens: 150,
          temperature: 0.1
        });
        
        try {
            const aiData = JSON.parse(aiRes.choices[0].message.content.trim());
            if (aiData.category) category = aiData.category;
            if (aiData.priority) finalPriority = aiData.priority;
            if (aiData.content) processedText = aiData.content;
        } catch (parseErr) {
            console.error('Failed to parse AI JSON:', aiRes.choices[0].message.content, parseErr);
        }
      } catch (err) {
        console.error('AI Categorization failed:', err);
      }
    }

    // Save to Postgres if configured
    if (process.env.POSTGRES_URL) {
      // NOTE: Ensure table 'memos' exists. Schema: id SERIAL PRIMARY KEY, content TEXT, priority INT, category TEXT, created_at TIMESTAMP DEFAULT NOW()
      await sql`
        INSERT INTO memos (content, priority, category) 
        VALUES (${processedText}, ${finalPriority}, ${category})
      `;
    } else {
      console.warn('POSTGRES_URL is not set. Skipping database insert.', { text, priority, category });
    }

    return NextResponse.json({ success: true, category });
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
    
    return NextResponse.json({ memos: rows });
  } catch (error) {
    console.error('Failed to fetch memos:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, is_completed, content, priority, category } = await req.json();
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
    if (category !== undefined) {
      await sql`UPDATE memos SET category = ${category} WHERE id = ${id}`;
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
