import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const chats = db.prepare('SELECT * FROM chats ORDER BY updatedAt DESC').all();
        return NextResponse.json(chats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { id, title, updatedAt } = await request.json();
        db.prepare('INSERT INTO chats (id, title, updatedAt) VALUES (?, ?, ?)').run(id, title, updatedAt);
        return NextResponse.json({ id, title, updatedAt });
    } catch (error) {
        console.error('Error creating chat:', error);
        return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
    }
}
