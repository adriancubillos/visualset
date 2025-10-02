import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { logger } from '@/utils/logger';

export const runtime = 'edge';

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Delete from Vercel Blob
    await del(url);

    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    logger.error('Error deleting file from Vercel Blob', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
