import { supabase, STORAGE_BUCKETS } from "@/integrations/supabase/client";

// Mock file URLs removed - we'll always use real storage

/**
 * Creates storage buckets if they don't exist
 * This should be called once on app initialization
 */
export const initializeStorageBuckets = async () => {
  console.log('Initializing storage buckets...');
  
  try {
    // Get existing buckets
    const { data: existingBuckets, error: listError } = await supabase
      .storage
      .listBuckets();
      
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    console.log('Existing buckets:', existingBuckets);
    
    // Create buckets if they don't exist
    const bucketNames = Object.values(STORAGE_BUCKETS);
    for (const bucketName of bucketNames) {
      // Check if bucket already exists
      const bucketExists = existingBuckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        try {
          const { error } = await supabase
            .storage
            .createBucket(bucketName, {
              public: false,
              allowedMimeTypes: ['image/*', 'application/pdf'],
              fileSizeLimit: 52428800 // 50MB
            });
            
          if (error) {
            console.error(`Error creating bucket ${bucketName}:`, error);
          } else {
            console.log(`Created bucket ${bucketName}`);
          }
        } catch (error) {
          console.error(`Error creating bucket ${bucketName}:`, error);
        }
      } else {
        console.log(`Bucket ${bucketName} already exists`);
      }
    }
    
    console.log('Storage buckets initialization completed');
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
  }
};

/**
 * Get a public URL for a file in Supabase Storage
 */
export async function getPublicStorageUrl(
  bucket: string,
  filePath: string
): Promise<string> {
  try {
    console.log(`Getting public URL for bucket: ${bucket}, path: ${filePath}`);
    
    // Get the public URL from Supabase
    const { data } = await supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error(`Error getting storage URL for ${bucket}/${filePath}:`, error);
    return '';
  }
}
