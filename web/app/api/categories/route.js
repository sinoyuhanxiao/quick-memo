import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ categories: [], warning: 'No database configured' });
    }
    
    const { rows } = await sql`SELECT * FROM categories ORDER BY name ASC`;
    return NextResponse.json({ categories: rows });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, color } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    await sql`
      INSERT INTO categories (name, color) 
      VALUES (${formattedName}, ${color || null})
      ON CONFLICT DO NOTHING
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { oldName, newName, color } = await req.json();
    if (!oldName) return NextResponse.json({ error: 'oldName is required' }, { status: 400 });

    const formattedOldName = oldName.charAt(0).toUpperCase() + oldName.slice(1).toLowerCase();
    const formattedNewName = newName ? newName.charAt(0).toUpperCase() + newName.slice(1).toLowerCase() : formattedOldName;

    // 1. Rename in categories table and update color
    if (color !== undefined) {
      await sql`UPDATE categories SET name = ${formattedNewName}, color = ${color} WHERE name = ${formattedOldName}`;
    } else {
      await sql`UPDATE categories SET name = ${formattedNewName} WHERE name = ${formattedOldName}`;
    }
    
    // 2. Update all associated memos by replacing the value in the CSV string (only if name changed)
    if (formattedOldName !== formattedNewName) {
      await sql`
        UPDATE memos 
        SET category = array_to_string(array_replace(string_to_array(category, ','), ${formattedOldName}, ${formattedNewName}), ',')
        WHERE ${formattedOldName} = ANY(string_to_array(category, ','))
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to rename category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    // 1. Delete from categories table
    await sql`DELETE FROM categories WHERE name = ${formattedName}`;

    // 2. Remove the category from the CSV string, and fallback to 'Uncategorized' if the resulting string is empty
    await sql`
      UPDATE memos 
      SET category = COALESCE(NULLIF(array_to_string(array_remove(string_to_array(category, ','), ${formattedName}), ','), ''), 'Uncategorized')
      WHERE ${formattedName} = ANY(string_to_array(category, ','))
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
