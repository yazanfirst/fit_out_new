import React, { useState } from 'react';
import { X, Upload, FolderOpen, Image, FileText, Edit, Trash2, File, Trash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDrawingsByProjectId, createDrawing, deleteDrawing, getStorageUrl, createMultipleDrawings } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import FileUploadField from '../FileUpload/FileUploadField';
import { Drawing } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

interface DrawingsGridProps {
  projectId: string;
}

const DrawingsGrid: React.FC<DrawingsGridProps> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  
  const { data: drawings = [], isLoading, error } = useQuery({
    queryKey: ['projectDrawings', projectId],
    queryFn: () => getDrawingsByProjectId(projectId),
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  const [activeTab, setActiveTab] = useState<string>('all');
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'Drawing',
    category: 'Architectural'
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isMultipleUpload, setIsMultipleUpload] = useState<boolean>(true);
  
  const createDrawingMutation = useMutation({
    mutationFn: async ({ drawings, files }: { drawings: Partial<Drawing>[], files: File[] }) => {
      if (files.length === 1) {
        const drawingData: Omit<Drawing, 'id' | 'created_at' | 'updated_at'> = {
          project_id: projectId,
          name: drawings[0].name || 'Untitled',
          type: drawings[0].type as 'Drawing' | 'Photo',
          category: drawings[0].category || 'General',
          storage_path: '',
          upload_date: new Date().toISOString(),
          uploaded_by: 'User'
        };
        
        return await createDrawing(drawingData, files[0]);
      }
      
      const drawingsData = files.map((file, index) => {
        const name = index === 0 && drawings[0].name ? drawings[0].name : file.name;
        
        return {
          project_id: projectId,
          name: name,
          type: drawings[0].type as 'Drawing' | 'Photo',
          category: drawings[0].category || 'General',
          storage_path: '',
          upload_date: new Date().toISOString(),
          uploaded_by: 'User'
        };
      });
      
      return await createMultipleDrawings(drawingsData, files);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectDrawings'] });
      const numFiles = selectedFiles.length;
      toast.success(numFiles > 1 ? `${numFiles} files uploaded successfully!` : 'File uploaded successfully!');
      handleUploadModalClose();
    },
    onError: (error) => {
      toast.error(`Error uploading file(s): ${error.message}`);
    }
  });
  
  const deleteDrawingMutation = useMutation({
    mutationFn: async ({ id, storagePath }: { id: string, storagePath: string }) => {
      await deleteDrawing(id, storagePath);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['projectDrawings'] });
      toast.success('File deleted successfully!');
      if (selectedDrawing?.id === id) {
        handleCloseLightbox();
      }
    },
    onError: (error) => {
      toast.error(`Error deleting file: ${error.message}`);
    }
  });
  
  const handleDeleteDrawing = async (drawingId: string) => {
    if (!hasPermission('delete', 'drawings')) {
      toast.error("You don't have permission to delete drawings");
      return;
    }

    if (window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      deleteDrawingMutation.mutate({ id: drawingId, storagePath: '' });
    }
  };
  
  const filteredDrawings = drawings.filter(drawing => {
    if (activeTab === 'all') return true;
    if (activeTab === 'drawings') return drawing.type === 'Drawing';
    if (activeTab === 'photos') return drawing.type === 'Photo';
    return true;
  });
  
  const handleOpenLightbox = (drawing: Drawing) => {
    setSelectedDrawing(drawing);
    setLightboxOpen(true);
  };
  
  const handleCloseLightbox = () => {
    setLightboxOpen(false);
    setSelectedDrawing(null);
  };
  
  const handleUploadModalOpen = () => {
    setIsUploadModalOpen(true);
    setIsMultipleUpload(true);
  };
  
  const handleUploadModalClose = () => {
    setIsUploadModalOpen(false);
    setUploadForm({
      name: '',
      type: 'Drawing',
      category: 'Architectural'
    });
    setSelectedFiles([]);
  };
  
  const handleUploadFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUploadForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setUploadForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFilesSelect = (files: File[]) => {
    setSelectedFiles(files);
    if (files.length === 1 && !uploadForm.name) {
      setUploadForm(prev => ({ ...prev, name: files[0].name }));
    }
  };
  
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }
    
    if (selectedFiles.length === 1 && !uploadForm.name) {
      toast.error("Please provide a name for your file");
      return;
    }
    
    createDrawingMutation.mutate({
      drawings: [{
        name: uploadForm.name,
        type: uploadForm.type as 'Drawing' | 'Photo',
        category: uploadForm.category,
        project_id: projectId
      }],
      files: selectedFiles
    });
  };
  
  const handleMultipleUploadToggle = () => {
    setIsMultipleUpload(!isMultipleUpload);
    setSelectedFiles([]);
  };
  
  const isPDF = (url: string | undefined): boolean => {
    if (!url) return false;
    return url.toLowerCase().endsWith('.pdf') || 
           url.toLowerCase().includes('pdf') || 
           url.includes('application/pdf');
  };

  const getFileTypeIcon = (drawing: Drawing) => {
    if (drawing.type === 'Photo') {
      return <Image className="h-12 w-12 text-muted-foreground" />;
    } else if (isPDF(drawing.url)) {
      return <FileText className="h-12 w-12 text-muted-foreground" />;
    } else {
      return <File className="h-12 w-12 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle>Drawings & Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <p>Loading drawings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle>Drawings & Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-rose-600">
            <p>Error loading drawings. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Drawings & Photos</CardTitle>
            
            <Button 
              className="sm:ml-auto"
              onClick={handleUploadModalOpen}
              disabled={createDrawingMutation.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Files</TabsTrigger>
              <TabsTrigger value="drawings">Drawings</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-0">
              {filteredDrawings.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No files yet</h3>
                  <p className="text-muted-foreground mt-1">Upload drawings or photos to get started.</p>
                  <Button 
                    className="mt-4"
                    onClick={handleUploadModalOpen}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDrawings.map((drawing) => (
                    <Card 
                      key={drawing.id} 
                      className="overflow-hidden hover:shadow-md cursor-pointer transition-all"
                      onClick={() => handleOpenLightbox(drawing)}
                    >
                      <div className="relative aspect-video bg-muted">
                        {drawing.type === 'Photo' ? (
                          <img 
                            src={drawing.url} 
                            alt={drawing.name} 
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {getFileTypeIcon(drawing)}
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex items-center space-x-1">
                          {hasPermission('delete', 'drawings') ? (
                            <Button 
                              variant="secondary"
                              size="icon" 
                              className="h-7 w-7 bg-white/70 hover:bg-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDrawing(drawing.id);
                              }}
                              disabled={deleteDrawingMutation.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-sm line-clamp-1" title={drawing.name}>
                              {drawing.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {drawing.category} • {new Date(drawing.upload_date).toLocaleDateString()}
                            </p>
                          </div>
                          {drawing.type === 'Drawing' ? (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Image className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {lightboxOpen && selectedDrawing && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={handleCloseLightbox}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] overflow-auto">
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white border-none"
              onClick={handleCloseLightbox}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="bg-white p-4 rounded-lg" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{selectedDrawing.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedDrawing.category} • Uploaded on {new Date(selectedDrawing.upload_date).toLocaleDateString()}
                </p>
              </div>
              
              <div className="bg-muted rounded-md overflow-hidden">
                {selectedDrawing.type === 'Photo' ? (
                  <img 
                    src={selectedDrawing.url} 
                    alt={selectedDrawing.name} 
                    className="w-full h-auto"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                ) : isPDF(selectedDrawing.url) ? (
                  <div className="w-full h-[600px] bg-white">
                    <iframe 
                      src={selectedDrawing.url}
                      className="w-full h-full"
                      title={selectedDrawing.name}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    {getFileTypeIcon(selectedDrawing)}
                    <p className="mt-4 text-muted-foreground">Preview not available for this file type</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        if (selectedDrawing.url) {
                          window.open(selectedDrawing.url, '_blank');
                        } else {
                          toast.error('File URL not available');
                        }
                      }}
                    >
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Dialog open={isUploadModalOpen} onOpenChange={handleUploadModalClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File{isMultipleUpload ? 's' : ''}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUploadSubmit}>
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-end">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="multiple-toggle">Multiple files</Label>
                  <Button 
                    type="button" 
                    variant={isMultipleUpload ? "default" : "outline"} 
                    size="sm"
                    onClick={handleMultipleUploadToggle}
                  >
                    {isMultipleUpload ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>
              
              <FileUploadField 
                onFileSelected={handleFilesSelect}
                accept="image/*,.pdf,.dwg,.dxf,.doc,.docx"
                multiple={isMultipleUpload}
              />
              
              {selectedFiles.length > 0 && (
                <div className="text-sm">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                  {selectedFiles.length > 1 && (
                    <ul className="mt-2 max-h-20 overflow-y-auto text-xs text-gray-500">
                      {selectedFiles.map((file, index) => (
                        <li key={index} className="truncate">{file.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="name">
                  {isMultipleUpload ? "Common Name (optional)" : "File Name"}
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={uploadForm.name}
                  onChange={handleUploadFormChange}
                  placeholder={isMultipleUpload ? "Leave blank to use file names" : "Enter file name"}
                  required={!isMultipleUpload}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">File Type</Label>
                  <Select 
                    value={uploadForm.type} 
                    onValueChange={(value) => handleSelectChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Drawing">Drawing</SelectItem>
                      <SelectItem value="Photo">Photo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={uploadForm.category} 
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Architectural">Architectural</SelectItem>
                      <SelectItem value="MEP">MEP</SelectItem>
                      <SelectItem value="Structural">Structural</SelectItem>
                      <SelectItem value="Interior">Interior</SelectItem>
                      <SelectItem value="Progress Photos">Progress Photos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleUploadModalClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDrawingMutation.isPending}>
                {createDrawingMutation.isPending ? 'Uploading...' : isMultipleUpload ? 'Upload Files' : 'Upload File'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DrawingsGrid;
