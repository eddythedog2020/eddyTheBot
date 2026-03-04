import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(request: Request, context: any) {
    try {
        const { id } = await Promise.resolve(context.params);
        db.prepare('DELETE FROM chats WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting chat:', error);
        return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
    }
}

export async function PATCH(request: Request, context: any) {
    try {
        const { id } = await Promise.resolve(context.params);
        const body = await request.json();

        if (body.title && body.updatedAt) {
            db.prepare('UPDATE chats SET title = ?, updatedAt = ? WHERE id = ?').run(body.title, body.updatedAt, id);
        } else if (body.title) {
            db.prepare('UPDATE chats SET title = ? WHERE id = ?').run(body.title, id);
        } else if (body.updatedAt) {
            db.prepare('UPDATE chats SET updatedAt = ? WHERE id = ?').run(body.updatedAt, id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating chat:', error);
        return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
    }
}
