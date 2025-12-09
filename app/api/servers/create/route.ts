import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import path from 'path';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const imageFile = formData.get('imageFile') as File;

    if (!name || !imageFile) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public/uploads');
    await mkdir(uploadDir, { recursive: true });

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const ext = imageFile.name.split('.').pop();
    const filename = `server-${userId}-${timestamp}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const imageUrl = `/uploads/${filename}`;
    
    // TODO: сохранить в PostgreSQL
    console.log('Сервер создан:', { name, imageUrl });

    return NextResponse.json({ 
      name, 
      imageUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
