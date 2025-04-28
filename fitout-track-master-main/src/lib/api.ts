import { Project, ProjectStatus, TimelineMilestone, Drawing, ItemCategory, ProjectItem, Invoice, InvoiceStatus } from './types';
import { supabase, STORAGE_BUCKETS, sanitizeUuid, validateId, sanitizeString } from '@/integrations/supabase/client';
import { getPublicStorageUrl } from './storage';
import { createAuditLog, getCurrentUser } from './auth';

// Helper function removed as we'll always use database

export async function getProjects(): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
    return data as unknown as Project[];
  } catch (error) {
    console.error("Unexpected error fetching projects:", error);
    throw error;
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    // Use the ID directly without validation
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
    
    return data as unknown as Project;
  } catch (error) {
    console.error('Error in getProjectById:', error);
    throw error;
  }
}

export async function createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project | null> {
  try {
    // Use project data directly without sanitization
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      throw error;
    }
    return data as unknown as Project;
  } catch (error) {
    console.error("Error in createProject:", error);
    throw error;
  }
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  try {
    console.log("Updating project with ID:", id, "Updates:", updates);
    
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating project:", error);
      throw error;
    }
    
    console.log("Project updated successfully:", data);
    return data as unknown as Project;
  } catch (error) {
    console.error("Unexpected error updating project:", error);
    throw error;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error deleting project:", error);
    return false;
  }
}

export async function getTimelineByProjectId(projectId: string): Promise<TimelineMilestone[]> {
  try {
    const { data, error } = await supabase
      .from('timeline_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('planned_date');

    if (error) {
      console.error("Error fetching timeline items:", error);
      throw error;
    }
    return (data || []) as TimelineMilestone[];
  } catch (error) {
    console.error("Unexpected error fetching timeline items:", error);
    throw error;
  }
}

export async function createMilestone(milestone: Omit<TimelineMilestone, 'id' | 'created_at' | 'updated_at'>): Promise<TimelineMilestone | null> {
  try {
    const { data, error } = await supabase
      .from('timeline_milestones')
      .insert([milestone])
      .select()
      .single();

    if (error) {
      console.error("Error creating milestone:", error);
      throw error;
    }
    return data as TimelineMilestone;
  } catch (error) {
    console.error("Unexpected error creating milestone:", error);
    throw error;
  }
}

export async function updateMilestone(id: string, updates: Partial<TimelineMilestone>): Promise<TimelineMilestone | null> {
  try {
    const { data, error } = await supabase
      .from('timeline_milestones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating milestone:", error);
      throw error;
    }
    return data as TimelineMilestone;
  } catch (error) {
    console.error("Unexpected error updating milestone:", error);
    throw error;
  }
}

export async function deleteMilestone(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('timeline_milestones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting milestone:", error);
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error deleting milestone:", error);
    return false;
  }
}

export async function getItemsByProjectId(projectId: string): Promise<ProjectItem[]> {
  try {
    const { data, error } = await supabase
      .from('project_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');

    if (error) {
      console.error("Error fetching items:", error);
      throw error;
    }
    
    const transformedData = data.map(item => ({
      ...item,
      completionPercentage: item.completion_percentage ?? 0,
      workDescription: item.work_description ?? ''
    }));
    
    return transformedData as ProjectItem[];
  } catch (error) {
    console.error("Unexpected error fetching items:", error);
    return [];
  }
}

export async function createItem(item: Omit<ProjectItem, 'id'>): Promise<ProjectItem | null> {
  try {
    const dbItem: any = {
      project_id: item.project_id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      status: item.status,
      company: item.company,
      lpo_status: item.lpo_status,
      notes: item.notes,
      scope: item.scope,
    };
    
    if (item.completionPercentage !== undefined) {
      dbItem.completion_percentage = item.completionPercentage;
    }
    
    if (item.workDescription !== undefined) {
      dbItem.work_description = item.workDescription;
    }
    
    const { data, error } = await supabase
      .from('project_items')
      .insert([dbItem])
      .select()
      .single();

    if (error) {
      console.error("Error creating item:", error);
      throw error;
    }
    
    const transformedData = {
      ...data,
      completionPercentage: data.completion_percentage ?? 0,
      workDescription: data.work_description ?? ''
    };

    // Audit log for INSERT
    const currentUser = await getCurrentUser();
    if (currentUser) {
      await createAuditLog(
        currentUser.id,
        'INSERT',
        'project_items',
        data.id,
        { new: data }
      );
    }
    
    return transformedData as ProjectItem;
  } catch (error) {
    console.error("Unexpected error creating item:", error);
    throw error;
  }
}

export async function updateItem(id: string, updates: Partial<ProjectItem>): Promise<ProjectItem | null> {
  try {
    const dbUpdates: any = { ...updates };
    
    if (updates.completionPercentage !== undefined) {
      dbUpdates.completion_percentage = updates.completionPercentage;
      delete dbUpdates.completionPercentage;
    }
    
    if (updates.workDescription !== undefined) {
      dbUpdates.work_description = updates.workDescription;
      delete dbUpdates.workDescription;
    }
    
    // Get old data for audit log
    const { data: oldData } = await supabase
      .from('project_items')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('project_items')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating item:", error);
      throw error;
    }
    
    const transformedData = {
      ...data,
      completionPercentage: data.completion_percentage ?? 0,
      workDescription: data.work_description ?? ''
    };

    // Audit log for UPDATE
    const currentUser = await getCurrentUser();
    if (currentUser) {
      await createAuditLog(
        currentUser.id,
        'UPDATE',
        'project_items',
        id,
        { old: oldData, updates: dbUpdates, new: data }
      );
    }
    
    return transformedData as ProjectItem;
  } catch (error) {
    console.error("Unexpected error updating item:", error);
    throw error;
  }
}

export async function deleteItem(id: string): Promise<boolean> {
  try {
    // Get old data for audit log
    const { data: oldData } = await supabase
      .from('project_items')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('project_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting item:", error);
      throw error;
    }

    // Audit log for DELETE
    const currentUser = await getCurrentUser();
    if (currentUser) {
      await createAuditLog(
        currentUser.id,
        'DELETE',
        'project_items',
        id,
        { old: oldData }
      );
    }
    return true;
  } catch (error) {
    console.error("Unexpected error deleting item:", error);
    return false;
  }
}

export async function uploadFileToStorage(filePath: string, file: File): Promise<{ data: any; error: any; url: string | null }> {
  try {
    const pathParts = filePath.split('/');
    const firstSegment = pathParts[0];
    
    let bucketName;
    
    if (firstSegment === 'drawings' || firstSegment === STORAGE_BUCKETS.DRAWINGS) {
      bucketName = STORAGE_BUCKETS.DRAWINGS;
    } else if (firstSegment === 'photos' || firstSegment === STORAGE_BUCKETS.PHOTOS) {
      bucketName = STORAGE_BUCKETS.PHOTOS;
    } else if (firstSegment === 'invoices' || firstSegment === STORAGE_BUCKETS.INVOICES) {
      bucketName = STORAGE_BUCKETS.INVOICES;
    } else if (file.type.startsWith('image/')) {
      bucketName = STORAGE_BUCKETS.PHOTOS;
    } else if (file.type === 'application/pdf') {
      bucketName = STORAGE_BUCKETS.DRAWINGS;
    } else {
      bucketName = STORAGE_BUCKETS.DRAWINGS; // Default bucket
    }
    
    console.log(`Using bucket: ${bucketName} for path: ${filePath}`);
    
    const actualFilePath = filePath.startsWith(bucketName) 
      ? filePath.substring(bucketName.length + 1)
      : (pathParts.slice(1).join('/') || `${Date.now()}-${file.name}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(actualFilePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error(`Error uploading file to storage (bucket: ${bucketName}):`, error);
      return { data: null, error, url: null };
    }

    const url = await getPublicStorageUrl(bucketName, actualFilePath);
    return { data, error: null, url };
  } catch (error) {
    console.error("Unexpected error uploading file to storage:", error);
    return { data: null, error, url: null };
  }
}

export async function getStorageUrl(bucket: string, filePath: string): Promise<string | null> {
  try {
    const cleanFilePath = filePath.startsWith(bucket + '/') 
      ? filePath.substring(bucket.length + 1) 
      : filePath;
    
    console.log(`Getting public URL for bucket: ${bucket}, path: ${cleanFilePath}`);
    
    return await getPublicStorageUrl(bucket, cleanFilePath);
  } catch (error) {
    console.error(`Error getting storage URL for ${bucket}/${filePath}:`, error);
    return null;
  }
}

export async function getDrawingsByProjectId(projectId: string): Promise<Drawing[]> {
  try {
    const { data, error } = await supabase
      .from('drawings')
      .select('*')
      .eq('project_id', projectId)
      .order('upload_date', { ascending: false });
    
    if (error) {
      console.error("Error fetching drawings:", error);
      throw error;
    }
    
    const { data: bucketsData } = await supabase.storage.listBuckets();
    console.log("Available buckets for drawings:", bucketsData?.map(b => b.id));
    
    const drawingsWithUrls = await Promise.all(
      data.map(async (drawing) => {
        const pathParts = drawing.storage_path.split('/');
        let bucket = pathParts[0];
        
        if (bucketsData && !bucketsData.some(b => b.id === bucket)) {
          if (bucket === 'drawings') bucket = 'project-drawings';
          else if (bucket === 'photos') bucket = 'project-photos';
          else bucket = bucketsData[0]?.id || 'project-files';
        }
        
        const url = await getStorageUrl(bucket, drawing.storage_path);
        return { ...drawing, url };
      })
    );
    
    return drawingsWithUrls as Drawing[];
  } catch (error) {
    console.error("Unexpected error fetching drawings:", error);
    throw error;
  }
}

export async function createDrawing(
  drawing: Omit<Drawing, 'id' | 'created_at' | 'updated_at'>,
  file?: File
): Promise<Drawing> {
  try {
    let filePath = '';
    let fileUploadResult: { data: any; error: any; url: string | null } = { data: null, error: null, url: null };
    
    if (file) {
      const bucketName = drawing.type === 'Photo' ? STORAGE_BUCKETS.PHOTOS : STORAGE_BUCKETS.DRAWINGS;
      filePath = `${bucketName}/${drawing.project_id}/${Date.now()}-${file.name}`;
      fileUploadResult = await uploadFileToStorage(filePath, file);
      if (fileUploadResult.error) throw fileUploadResult.error;
    }
    
    const drawingWithPath = {
      ...drawing,
      storage_path: filePath
    };
    
    const { data, error } = await supabase
      .from('drawings')
      .insert(drawingWithPath)
      .select()
      .single();
      
    if (error) throw error;
    
    const bucket = drawing.type === 'Photo' ? STORAGE_BUCKETS.PHOTOS : STORAGE_BUCKETS.DRAWINGS;
    const url = fileUploadResult.url || await getStorageUrl(bucket, filePath);
    
    const drawingWithUrl = {
      ...data,
      url,
      type: data.type as "Drawing" | "Photo" // Ensure correct type assertion
    };
    
    return drawingWithUrl as Drawing;
    
  } catch (error) {
    console.error('Error creating drawing:', error);
    throw error;
  }
}

export async function deleteDrawing(id: string, storagePath: string): Promise<void> {
  try {
    const { error: deleteError } = await supabase
      .from('drawings')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error("Error deleting drawing from database:", deleteError);
      throw deleteError;
    }
    
    if (storagePath) {
      const { data: bucketsData } = await supabase.storage.listBuckets();
      const pathParts = storagePath.split('/');
      let bucket = pathParts[0];
      
      if (bucketsData && !bucketsData.some(b => b.id === bucket)) {
        if (bucket === 'drawings') bucket = 'project-drawings';
        else if (bucket === 'photos') bucket = 'project-photos';
        else bucket = bucketsData[0]?.id || 'project-files';
      }
      
      console.log(`Deleting file from bucket: ${bucket}, path: ${storagePath}`);
      
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([storagePath]);
      
      if (storageError) {
        console.error("Error deleting file from storage:", storageError);
        throw storageError;
      }
    }
  } catch (error) {
    console.error("Error deleting drawing:", error);
    throw error;
  }
}

export async function createMultipleDrawings(
  drawings: Omit<Drawing, 'id' | 'created_at' | 'updated_at'>[],
  files: File[]
): Promise<Drawing[]> {
  try {
    if (drawings.length !== files.length) {
      throw new Error('Number of drawing records must match number of files');
    }

    const results: Drawing[] = [];

    for (let i = 0; i < drawings.length; i++) {
      const drawing = drawings[i];
      const file = files[i];
      
      const bucket = drawing.type === 'Photo' ? STORAGE_BUCKETS.PHOTOS : STORAGE_BUCKETS.DRAWINGS;
      
      const filePath = `${bucket}/${drawing.project_id}/${Date.now()}-${file.name}`;
      console.log(`Uploading to bucket: ${bucket}, path: ${filePath}`);
      
      const fileUploadResult = await uploadFileToStorage(filePath, file);
      
      if (fileUploadResult.error) {
        console.error('Error uploading file:', fileUploadResult.error);
        continue;
      }
      
      const drawingWithPath = {
        ...drawing,
        storage_path: filePath
      };
      
      const { data, error } = await supabase
        .from('drawings')
        .insert(drawingWithPath)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating drawing record:', error);
        continue;
      }
      
      const url = fileUploadResult.url || await getStorageUrl(bucket, filePath);
      
      const drawingWithUrl = {
        ...data,
        url,
        type: data.type as "Drawing" | "Photo" // Ensure correct type assertion
      };
      
      results.push(drawingWithUrl as Drawing);
    }
    
    return results;
    
  } catch (error) {
    console.error('Error creating multiple drawings:', error);
    throw error;
  }
}

export async function getInvoicesByProjectId(projectId: string): Promise<Invoice[]> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('project_id', projectId)
      .order('invoice_date', { ascending: false });
    
    if (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }
    
    return (data || []) as Invoice[];
  } catch (error) {
    console.error("Unexpected error fetching invoices:", error);
    throw error;
  }
}

export async function createInvoice(
  invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>,
  file?: File
): Promise<Invoice> {
  try {
    let filePath = '';
    let fileUrl = null;
    
    if (file) {
      const fileName = `${Date.now()}-${file.name}`;
      filePath = `${STORAGE_BUCKETS.INVOICES}/${invoice.project_id}/${fileName}`;
      
      const { error, url } = await uploadFileToStorage(filePath, file);
      
      if (error) {
        console.error("Error uploading invoice file:", error);
        throw error;
      }
      
      fileUrl = url;
    }
    
    const invoiceWithPath = {
      ...invoice,
      file_path: filePath || null
    };
    
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoiceWithPath)
      .select()
      .single();
      
    if (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
    
    return { ...data, fileUrl } as Invoice;
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
}

export async function updateInvoice(
  id: string,
  updates: Partial<Invoice>,
  file?: File
): Promise<Invoice> {
  try {
    let fileUrl = null;
    
    if (file) {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${STORAGE_BUCKETS.INVOICES}/${updates.project_id}/${fileName}`;
      
      const { error, url } = await uploadFileToStorage(filePath, file);
      
      if (error) {
        console.error("Error uploading invoice file:", error);
        throw error;
      }
      
      updates.file_path = filePath;
      fileUrl = url;
    }
    
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error("Error updating invoice:", error);
      throw error;
    }
    
    return { ...data, fileUrl } as Invoice;
  } catch (error) {
    console.error("Error updating invoice:", error);
    throw error;
  }
}

export async function deleteInvoice(id: string): Promise<boolean> {
  try {
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('file_path')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error("Error fetching invoice before deletion:", fetchError);
      throw fetchError;
    }
    
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error("Error deleting invoice:", deleteError);
      throw deleteError;
    }
    
    if (invoice?.file_path) {
      const bucketName = STORAGE_BUCKETS.INVOICES;
      const filePath = invoice.file_path.replace(`${bucketName}/`, '');
      
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);
      
      if (storageError) {
        console.error("Error deleting invoice file from storage:", storageError);
        return true;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error in deleteInvoice:", error);
    throw error;
  }
}
