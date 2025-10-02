import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

// Removed edge runtime to enable static generation

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const entityType = searchParams.get('entityType'); // 'project' or 'item'
    const entityName = searchParams.get('entityName'); // project/item name
    const projectName = searchParams.get('projectName'); // project name for folder organization

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    if (!request.body) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read the request body as a Blob
    const fileBlob = await request.blob();

    // Generate a meaningful filename with folder structure
    const fileExtension = filename.split('.').pop();
    const timestamp = Date.now();

    let newFilename = filename;

    // Sanitize names for use in paths
    const sanitizeName = (name: string) =>
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    if (projectName) {
      // Create folder structure: projects/project-name/entity-type/filename
      const sanitizedProject = sanitizeName(projectName);

      // Use entity name if available, otherwise use original filename without extension
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || 'file';
      const sanitizedEntity = entityName ? sanitizeName(entityName) : sanitizeName(nameWithoutExt);

      if (entityType === 'project') {
        // Format: projects/project-name/project-name-timestamp.ext
        newFilename = `projects/${sanitizedProject}/${sanitizedProject}-${timestamp}.${fileExtension}`;
      } else if (entityType === 'item') {
        // Format: projects/project-name/items/item-name-timestamp.ext
        newFilename = `projects/${sanitizedProject}/items/${sanitizedEntity}-${timestamp}.${fileExtension}`;
      } else {
        // Fallback with project folder
        newFilename = `projects/${sanitizedProject}/${sanitizedEntity}-${timestamp}.${fileExtension}`;
      }
    } else if (entityType && entityName) {
      // No project specified, use flat structure with entity type
      const sanitizedName = sanitizeName(entityName);
      newFilename = `${entityType}-${sanitizedName}-${timestamp}.${fileExtension}`;
    } else {
      // Fallback: just add timestamp to original filename
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
      newFilename = `${nameWithoutExt}-${timestamp}.${fileExtension}`;
    }

    // Upload to Vercel Blob
    const blob = await put(newFilename, fileBlob, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
