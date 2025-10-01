# Vercel Blob Storage Setup Guide

## Step 1: Get Your Vercel Blob Token

### Option A: Using Vercel Dashboard (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Click "Generate Token" or create one from Storage tab
5. Save the variable

### Option B: Using Vercel CLI
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Link your project
vercel link

# Create a blob store (if not exists)
vercel blob create

# The token will be automatically added to your project
```

## Step 2: Add Token to Local Environment

Create or update `.env.local` file:

```env
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx

# Your existing DATABASE_URL
DATABASE_URL=postgresql://...
```

## Step 3: Run Database Migration

```bash
# Generate Prisma client with new schema
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_image_and_measure_fields

# Or if you want to push without creating migration files
npx prisma db push
```

## Step 4: Verify Setup

Test the upload API:

```bash
# Start your dev server
npm run dev

# The upload endpoint should be available at:
# http://localhost:3000/api/upload
```

## Usage in Your Application

### In Item Forms:
```tsx
import ImageUpload from '@/components/forms/ImageUpload';

// In your form component
const [imageUrl, setImageUrl] = useState<string | null>(null);
const [measure, setMeasure] = useState<string>('');

<ImageUpload
  label="Item Image"
  currentImageUrl={imageUrl}
  onImageUploaded={(url) => setImageUrl(url)}
  onImageRemoved={() => setImageUrl(null)}
/>

<input
  type="text"
  placeholder="Measurements (e.g., 10cm x 5cm x 2cm)"
  value={measure}
  onChange={(e) => setMeasure(e.target.value)}
/>
```

### In Project Forms:
```tsx
<ImageUpload
  label="Project Image"
  currentImageUrl={project.imageUrl}
  onImageUploaded={(url) => setImageUrl(url)}
  onImageRemoved={() => setImageUrl(null)}
/>
```

## API Endpoints

### Upload Image
```
POST /api/upload?filename=my-image.jpg
Content-Type: image/jpeg
Body: [binary image data]

Response:
{
  "url": "https://xxxxx.public.blob.vercel-storage.com/my-image.jpg",
  "pathname": "my-image.jpg",
  "contentType": "image/jpeg",
  "contentDisposition": "inline; filename=\"my-image.jpg\""
}
```

## Pricing (Vercel Blob)

### Free Tier (Hobby):
- ✅ 500MB storage
- ✅ 5GB bandwidth/month
- ✅ Perfect for development and small projects

### Pro Tier:
- 100GB storage
- 1TB bandwidth/month
- $0.15/GB storage beyond limit
- $0.10/GB bandwidth beyond limit

## Troubleshooting

### "BLOB_READ_WRITE_TOKEN is not defined"
- Make sure `.env.local` exists and contains the token
- Restart your dev server after adding the token
- Check that the variable name is exactly `BLOB_READ_WRITE_TOKEN`

### "Failed to upload file"
- Check file size (max 5MB in current implementation)
- Verify file is an image type
- Check network connection
- Verify token has write permissions

### Images not loading
- Check that `imageUrl` is being saved to database
- Verify the URL is publicly accessible
- Check browser console for CORS errors

## Security Notes

- ✅ Images are stored with public access (good for product images)
- ✅ Upload endpoint should be protected in production (add authentication)
- ✅ File size limits are enforced (5MB default)
- ✅ File type validation is in place (images only)

## Next Steps

1. ✅ Schema updated with `imageUrl` and `measure` fields
2. ✅ Upload API route created
3. ✅ ImageUpload component ready to use
4. ⏳ Update Item forms to include new fields
5. ⏳ Update Project forms to include image upload
6. ⏳ Run database migration
7. ⏳ Add BLOB_READ_WRITE_TOKEN to environment

Happy uploading! 🚀
