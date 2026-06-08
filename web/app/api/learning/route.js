import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Ensure the table exists
async function ensureTableExists() {
  if (process.env.POSTGRES_URL) {
    await sql`
      CREATE TABLE IF NOT EXISTS learnings (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        date_category VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
  }
}

export async function POST(req) {
  try {
    await ensureTableExists();
    const { content } = await req.json();
    
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Generate local date string YYYY-MM-DD
    const now = new Date();
    // Use user's local timezone assumption or server time.
    // For safety, we can use ISO string split by T to get YYYY-MM-DD,
    // but Date objects in node use UTC by default.
    // Let's create an offset or simply use frontend's provided date if possible.
    // Wait, let's just do an offset to PST (-7 hours for example) or just use local node time.
    // Actually, a simple new Date().toLocaleDateString('en-CA') gives YYYY-MM-DD in local time.
    // For consistency, let's just use the server's ISO date.
    const dateCategory = now.toISOString().split('T')[0];
    
    let processedContent = content.trim();

    if (process.env.POSTGRES_URL) {
      await sql`
        INSERT INTO learnings (content, date_category) 
        VALUES (${processedContent}, ${dateCategory})
      `;
    }

    return NextResponse.json({ success: true, date_category: dateCategory });
  } catch (error) {
    console.error('Failed to create learning:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await ensureTableExists();
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ learnings: [], warning: 'No database configured' });
    }
    
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    
    let rows;
    if (q) {
      const queryStr = `%${q}%`;
      const result = await sql`SELECT * FROM learnings WHERE content ILIKE ${queryStr} ORDER BY date_category DESC, id DESC LIMIT 100`;
      rows = result.rows;
    } else {
      const result = await sql`SELECT * FROM learnings ORDER BY date_category DESC, id DESC LIMIT 100`;
      rows = result.rows;
    }
    
    return NextResponse.json({ learnings: rows });
  } catch (error) {
    console.error('Failed to fetch learnings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await sql`DELETE FROM learnings WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete learning:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, content } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    if (content !== undefined) {
      await sql`UPDATE learnings SET content = ${content} WHERE id = ${id}`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update learning:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
