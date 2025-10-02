import { logger } from './logger';

interface CleanupImageOnCancelParams {
  newUploadedImageUrl: string | null;
  originalImageUrl: string | null;
  currentImageUrl: string | null;
  entityId: string;
  entityType: 'item' | 'project';
  formData: Record<string, any>;
}

/**
 * Handles image cleanup when user cancels form edit
 * - Deletes newly uploaded images from storage
 * - Updates database to remove broken references for deleted images
 */
export async function cleanupImageOnCancel({
  newUploadedImageUrl,
  originalImageUrl,
  currentImageUrl,
  entityId,
  entityType,
  formData,
}: CleanupImageOnCancelParams): Promise<void> {
  try {
    // Scenario 1: Clean up newly uploaded image if user cancels without saving
    if (newUploadedImageUrl && newUploadedImageUrl !== originalImageUrl) {
      await fetch(`/api/upload/delete?url=${encodeURIComponent(newUploadedImageUrl)}`, {
        method: 'DELETE',
      });
    }

    // Scenario 2: If user removed original image (now deleted from storage) but cancelled,
    // update the database to remove the broken reference
    if (originalImageUrl && !currentImageUrl) {
      const endpoint = entityType === 'item' ? `/api/items/${entityId}` : `/api/projects/${entityId}`;
      
      await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: null, // Clear the broken reference
        }),
      });
    }
  } catch (error) {
    logger.error(`Error during ${entityType} cancel cleanup`, error);
    // Don't throw - allow navigation to proceed
  }
}
