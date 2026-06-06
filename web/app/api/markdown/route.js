import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const filePath = '/home/erikyu/dev/mes/quick-memo/notes.md';

export async function GET() {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return NextResponse.json({ content });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ content: '' });
    }
    console.error('Failed to read markdown file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { content } = await req.json();
    if (content === undefined) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    await fs.writeFile(filePath, content, 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to write markdown file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
