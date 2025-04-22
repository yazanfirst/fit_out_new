import { supabase, STORAGE_BUCKETS } from "@/integrations/supabase/client";

// Mock file URLs removed - we'll always use real storage

/**
 * Creates storage buckets if they don't exist
 * This should be called once on app initialization
 */
export const initializeStorageBuckets = async () => {
  try {
    console.log('Initializing storage buckets...');
    
    // Create buckets for different types of files
    const buckets = [
      STORAGE_BUCKETS.DRAWINGS,
      STORAGE_BUCKETS.PHOTOS,
      STORAGE_BUCKETS.INVOICES
    ];
    
    // First check if buckets already exist to avoid unnecessary API calls
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      // Log the error but continue trying to create buckets
    }
    
    const existingBucketNames = existingBuckets?.map(b => b.name) || [];
    console.log('Existing buckets:', existingBucketNames);
    
    // Only create buckets that don't exist yet
    for (const bucketName of buckets) {
      if (existingBucketNames.includes(bucketName)) {
        console.log(`Bucket ${bucketName} already exists, skipping creation`);
        continue;
      }
      
      console.log(`Creating bucket ${bucketName}...`);
      
      try {
        const { error } = await supabase.storage.createBucket(
          bucketName, 
          { 
            public: true,  // Make files publicly accessible
            fileSizeLimit: 20971520, // 20MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'application/pdf', 
              'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
          }
        );
        
        if (error) {
          console.error(`Error creating bucket ${bucketName}:`, error);
        } else {
          console.log(`Successfully created bucket ${bucketName}`);
        }
      } catch (bucketError) {
        console.error(`Failed to create bucket ${bucketName}:`, bucketError);
      }
    }
    
    console.log('Storage buckets initialization completed');
  } catch (err) {
    console.error('Error initializing storage buckets:', err);
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
