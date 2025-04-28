
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadFieldProps {
  onFileSelected: (files: File[]) => void;
  accept?: string;
  label?: string;
  multiple?: boolean;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  onFileSelected,
  accept = "*/*",
  label = "Upload file",
  multiple = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = multiple ? Array.from(e.dataTransfer.files) : [e.dataTransfer.files[0]];
      handleFiles(files);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = multiple ? Array.from(e.target.files) : [e.target.files[0]];
      handleFiles(files);
      // Reset input so the same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };
  
  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };
  
  const handleFiles = (files: File[]) => {
    try {
      onFileSelected(files);
      if (files.length === 1) {
        toast.success(`File "${files[0].name}" selected`);
      } else {
        toast.success(`${files.length} files selected`);
      }
    } catch (err) {
      console.error('Error handling files:', err);
      toast.error('Failed to process files');
    }
  };
  
  return (
    <div
      className={`border rounded-md p-4 flex flex-col items-center justify-center gap-2 transition-colors
        ${dragActive ? 'border-primary bg-primary/10' : 'border-input'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      
      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
      <p className="text-sm text-muted-foreground">
        {multiple ? 'Drag & drop multiple files or click to upload' : 'Drag & drop or click to upload'}
      </p>
      <Button type="button" variant="outline" size="sm" onClick={handleButtonClick}>
        {multiple ? 'Select Files' : 'Select File'}
      </Button>
    </div>
  );
};

export default FileUploadField;
