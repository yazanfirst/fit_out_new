import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { createProject } from '@/lib/api';
import { useProjectStore } from '@/stores/useProjectStore';
import { ProjectStatus } from '@/lib/types';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose }) => {
  // Get today's date in ISO format for default values
  const today = new Date().toISOString().split('T')[0];
  // Set default end date to 3 months from now
  const defaultEndDate = new Date();
  defaultEndDate.setMonth(defaultEndDate.getMonth() + 3);
  const threeMonthsLater = defaultEndDate.toISOString().split('T')[0];

  const [projectData, setProjectData] = useState({
    name: '',
    location: '',
    mainContractor: '',
    status: 'Not Started' as ProjectStatus,
    chain: 'BK' as 'BK' | 'TC',
    notes: '',
    startDate: today,
    endDate: threeMonthsLater
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addItem } = useProjectStore();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProjectData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    if (name === 'chain') {
      // Ensure chain is properly typed
      setProjectData(prev => ({ ...prev, [name]: value as 'BK' | 'TC' }));
    } else {
      setProjectData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Creating new project:', projectData);
      
      // Map the form data to the database schema format (snake_case)
      const projectToCreate = {
        name: projectData.name,
        location: projectData.location,
        main_contractor: projectData.mainContractor,
        status: projectData.status as ProjectStatus,
        chain: projectData.chain,
        notes: projectData.notes,
        progress: 0,  // Adding the progress field with default value 0
        start_date: projectData.startDate,  // Add the start_date field
        end_date: projectData.endDate      // Add the end_date field
      };
      
      // Call the API to create the project
      const newProject = await createProject(projectToCreate);
      
      if (newProject) {
        // Add to store
        addItem(newProject);
        
        // Show success notification
        toast.success('Project created successfully!');
        
        // Close the modal
        onClose();
        
        // Reset form after submission
        setProjectData({
          name: '',
          location: '',
          mainContractor: '',
          status: 'Not Started' as ProjectStatus,
          chain: 'BK' as 'BK' | 'TC',
          notes: '',
          startDate: today,
          endDate: threeMonthsLater
        });
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                name="name"
                value={projectData.name}
                onChange={handleChange}
                required
                placeholder="e.g. BK Dubai Land"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={projectData.location}
                onChange={handleChange}
                required
                placeholder="e.g. Dubai Land, Dubai, UAE"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="mainContractor">Main Contractor</Label>
              <Input
                id="mainContractor"
                name="mainContractor"
                value={projectData.mainContractor}
                onChange={handleChange}
                required
                placeholder="e.g. Al Tayer Stocks"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={projectData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="endDate">Target End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={projectData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label>Restaurant Chain</Label>
              <RadioGroup 
                defaultValue="BK"
                value={projectData.chain}
                onValueChange={(value) => handleSelectChange('chain', value)}
                className="flex"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BK" id="bk" />
                  <Label htmlFor="bk" className="cursor-pointer">Burger King</Label>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <RadioGroupItem value="TC" id="tc" />
                  <Label htmlFor="tc" className="cursor-pointer">Texas Chicken</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                defaultValue={projectData.status} 
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Delayed">Delayed</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={projectData.notes}
                onChange={handleChange}
                placeholder="Add any project notes or details..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectModal;
