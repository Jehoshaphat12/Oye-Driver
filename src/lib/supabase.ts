import { createClient } from '@supabase/supabase-js';

// Same Supabase project as the React Native app
const SUPABASE_URL = 'https://edcldvqbqpvckooolngw.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkY2xkdnFicXB2Y2tvb29sbmd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAwOTE1MywiZXhwIjoyMDczNTg1MTUzfQ.Vf1vYpYNMLfquaKaP-gpgu4bx7m9KQbEzL8EeYsm_yk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Same bucket used in the mobile app
export const PROFILE_PICTURES_BUCKET = 'oye-profile-pictures';

/**
 * Upload a profile picture File to Supabase Storage.
 * Path mirrors the mobile app: drivers/{userId}/profile.{ext}
 * Returns the public URL.
 */
export async function uploadProfilePicture(
  file: File,
  userId: string,
  oldImageUrl?: string,
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentType = file.type || `image/${ext === 'png' ? 'png' : 'jpeg'}`;
  const filePath = `drivers/${userId}/profile.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_PICTURES_BUCKET)
    .upload(filePath, file, { contentType, upsert: true });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data } = supabase.storage
    .from(PROFILE_PICTURES_BUCKET)
    .getPublicUrl(filePath);

  const publicUrl = data.publicUrl;
  if (!publicUrl) throw new Error('Failed to retrieve public URL after upload');

  // Optionally delete old image
  if (oldImageUrl) {
    try {
      const oldPath = extractStoragePath(oldImageUrl);
      if (oldPath) await supabase.storage.from(PROFILE_PICTURES_BUCKET).remove([oldPath]);
    } catch { /* non-critical */ }
  }

  return publicUrl;
}

function extractStoragePath(publicUrl: string): string | null {
  try {
    const urlObj = new URL(publicUrl);
    const parts = urlObj.pathname.split('/');
    const publicIndex = parts.indexOf('public');
    if (publicIndex === -1 || publicIndex + 2 >= parts.length) return null;
    return parts.slice(publicIndex + 2).join('/');
  } catch { return null; }
}
