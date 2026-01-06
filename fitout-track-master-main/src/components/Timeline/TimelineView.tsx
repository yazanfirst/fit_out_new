import React, { useState } from 'react';
import { Edit, Trash2, Plus, Check, ArrowRight, AlertCircle, Calendar as CalendarIcon, List as ListIcon, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";
import { TimelineMilestone } from '@/lib/types';
import { getTimelineByProjectId, createMilestone, updateMilestone, deleteMilestone, updateProject } from '@/lib/api';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calculateProjectProgress } from '@/lib/progressCalculation';
import { useAuth } from '@/contexts/AuthContext';
import TimelineCalendarView from './TimelineCalendarView';

interface TimelineViewProps {
  projectId: string;
}

type MilestoneStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';

interface MilestoneFormData {
  name: string;
  planned_date: string;
  actual_date: string | null;
  status: MilestoneStatus;
  notes: string;
}

const initialFormData: MilestoneFormData = {
  name: '',
  planned_date: new Date().toISOString().split('T')[0],
  actual_date: null,
  status: 'Not Started',
  notes: ''
};

const TimelineView: React.FC<TimelineViewProps> = ({ projectId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<TimelineMilestone | null>(null);
  const [formData, setFormData] = useState<MilestoneFormData>(initialFormData);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const queryClient = useQueryClient();
  
  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['timeline', projectId],
    queryFn: () => getTimelineByProjectId(projectId)
  });
  
  const { hasPermission } = useAuth();
  
  const createMutation = useMutation({
    mutationFn: (data: Omit<TimelineMilestone, 'id' | 'created_at' | 'updated_at'>) => 
      createMilestone(data),
    onSuccess: async () => {
      // After successful creation, recalculate and update project progress
      try {
        // Recalculate project progress
        const newProgress = await calculateProjectProgress(projectId);
        console.log(`Milestone created - New calculated progress: ${newProgress}%`);
        
        // Update project progress in database
        await updateProject(projectId, { progress: newProgress });
        console.log(`Project progress updated to ${newProgress}%`);
        
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['timeline', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        
        toast.success('Milestone added successfully!');
        handleCloseModal();
      } catch (error) {
        console.error('Error updating progress after milestone creation:', error);
        // Still close modal and show success message
        toast.success('Milestone added successfully!');
        handleCloseModal();
      }
    },
    onError: (error) => {
      toast.error('Failed to add milestone');
      console.error(error);
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<TimelineMilestone> }) => 
      updateMilestone(id, data),
    onSuccess: async () => {
      // After successful update, recalculate and update project progress
      try {
        // Recalculate project progress
        const newProgress = await calculateProjectProgress(projectId);
        console.log(`Milestone updated - New calculated progress: ${newProgress}%`);
        
        // Update project progress in database
        await updateProject(projectId, { progress: newProgress });
        console.log(`Project progress updated to ${newProgress}%`);
        
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['timeline', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        
        toast.success('Milestone updated successfully!');
        handleCloseModal();
      } catch (error) {
        console.error('Error updating progress after milestone update:', error);
        // Still close modal and show success message
        toast.success('Milestone updated successfully!');
        handleCloseModal();
      }
    },
    onError: (error) => {
      toast.error('Failed to update milestone');
      console.error(error);
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMilestone(id),
    onSuccess: async () => {
      // After successful deletion, recalculate and update project progress
      try {
        // Recalculate project progress
        const newProgress = await calculateProjectProgress(projectId);
        console.log(`Milestone deleted - New calculated progress: ${newProgress}%`);
        
        // Update project progress in database
        await updateProject(projectId, { progress: newProgress });
        console.log(`Project progress updated to ${newProgress}%`);
        
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['timeline', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        
        toast.success('Milestone deleted successfully!');
      } catch (error) {
        console.error('Error updating progress after milestone deletion:', error);
        // Still show success message
        toast.success('Milestone deleted successfully!');
      }
    },
    onError: (error) => {
      toast.error('Failed to delete milestone');
      console.error(error);
    }
  });
  
  const sortedMilestones = React.useMemo(() => {
    return [...milestones].sort((a, b) => 
      new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime()
    );
  }, [milestones]);
  
  const handleOpenModal = (milestone?: TimelineMilestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setFormData({
        name: milestone.name,
        planned_date: new Date(milestone.planned_date).toISOString().split('T')[0],
        actual_date: milestone.actual_date ? new Date(milestone.actual_date).toISOString().split('T')[0] : null,
        status: milestone.status as MilestoneStatus,
        notes: milestone.notes || ''
      });
    } else {
      setEditingMilestone(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMilestone(null);
    setFormData(initialFormData);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (name: 'planned_date' | 'actual_date', value: string) => {
    setFormData(prev => ({ ...prev, [name]: value || null }));
  };
  
  const handleSelectChange = (name: 'status', value: MilestoneStatus) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const milestoneData = {
      project_id: projectId,
      name: formData.name,
      planned_date: new Date(formData.planned_date).toISOString(),
      actual_date: formData.actual_date ? new Date(formData.actual_date).toISOString() : null,
      status: formData.status,
      notes: formData.notes
    };

    if (editingMilestone) {
      updateMutation.mutate({ 
        id: editingMilestone.id, 
        data: milestoneData 
      });
    } else {
      createMutation.mutate(milestoneData);
    }
  };
  
  const handleDeleteMilestone = (id: string) => {
    // Check permissions
    if (!hasPermission('delete', 'timeline')) {
      toast.error("You don't have permission to delete timeline items");
      return;
    }

    if (confirm('Are you sure you want to delete this milestone?')) {
      deleteMutation.mutate(id);
    }
  };

  const parseDateString = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const parsed = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const parsed = new Date(excelEpoch.getTime() + numericValue * 24 * 60 * 60 * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const stringValue = String(value);
    const parsed = new Date(stringValue);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    const monthMap: Record<string, number> = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };

    const textMatch = stringValue.match(/(\d{1,2})[\/\-\s]([A-Za-z]{3,})[\/\-\s](\d{2,4})/);
    if (textMatch) {
      const [, day, monthText, year] = textMatch;
      const monthIndex = monthMap[monthText.toLowerCase().slice(0, 3)];
      const normalizedYear = year.length === 2 ? `20${year}` : year;
      if (monthIndex !== undefined) {
        const date = new Date(Number(normalizedYear), monthIndex, Number(day));
        return Number.isNaN(date.getTime()) ? null : date;
      }
    }

    const slashMatch = stringValue.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      const normalizedYear = year.length === 2 ? `20${year}` : year;
      const date = new Date(`${normalizedYear}-${month}-${day}`);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
  };

  const handleTimelineUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        toast.error('No worksheet found in the Excel file.');
        return;
      }

      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
      if (rows.length === 0) {
        toast.error('The Excel file is empty.');
        return;
      }

      const lookupValue = (row: Record<string, any>, keys: string[]) => {
        const entry = keys.find((key) => Object.prototype.hasOwnProperty.call(row, key));
        if (entry) return row[entry];
        const lowerCaseRow = Object.keys(row).reduce<Record<string, any>>((acc, key) => {
          acc[key.toLowerCase()] = row[key];
          return acc;
        }, {});
        const lowerKey = keys.map((key) => key.toLowerCase()).find((key) => key in lowerCaseRow);
        return lowerKey ? lowerCaseRow[lowerKey] : '';
      };

      const milestonesToCreate = rows
        .map((row) => {
          const name = String(lookupValue(row, ['Task / Work Item', 'Task', 'Work Item', 'name', 'Milestone'])).trim();
          if (!name) return null;
          const plannedValue = lookupValue(row, ['Start Date', 'Planned Date', 'planned_date', 'start_date']);
          const plannedDate = parseDateString(plannedValue);
          if (!plannedDate) return null;
          return {
            project_id: projectId,
            name,
            planned_date: plannedDate.toISOString(),
            actual_date: null,
            status: 'Not Started' as MilestoneStatus,
            notes: '',
          };
        })
        .filter((item): item is Omit<TimelineMilestone, 'id' | 'created_at' | 'updated_at'> => item !== null);

      if (milestonesToCreate.length === 0) {
        toast.error('No valid rows found. Please verify task names and start dates.');
        return;
      }

      const results = await Promise.allSettled(milestonesToCreate.map((item) => createMilestone(item)));
      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        const newProgress = await calculateProjectProgress(projectId);
        await updateProject(projectId, { progress: newProgress });
        queryClient.invalidateQueries({ queryKey: ['timeline', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }

      if (failureCount > 0) {
        toast.warning(`Uploaded ${successCount} milestones, ${failureCount} failed.`);
      } else {
        toast.success(`Uploaded ${successCount} milestones successfully.`);
      }

      setIsUploadModalOpen(false);
    } catch (error) {
      console.error('Error uploading timeline milestones:', error);
      toast.error('Failed to upload milestones. Please check the file format.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Delayed': return 'bg-red-500';
      case 'Not Started': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <Check className="h-4 w-4" />;
      case 'In Progress': return <ArrowRight className="h-4 w-4" />;
      case 'Delayed': return <AlertCircle className="h-4 w-4" />;
      case 'Not Started': return null;
      default: return null;
    }
  };
  
  const isDelayed = (milestone: TimelineMilestone) => {
    if (milestone.status === 'Completed') return false;
    
    if (milestone.status === 'Delayed') return true;
    
    const plannedDate = new Date(milestone.planned_date);
    const today = new Date();
    
    return plannedDate < today && 
           (milestone.status === 'Not Started' || milestone.status === 'In Progress');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            className="flex items-center"
          >
            <ListIcon className="mr-2 h-4 w-4" />
            List View
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
            className="flex items-center"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Calendar View
          </Button>
        </div>
        {hasPermission('create', 'timeline') && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Excel
            </Button>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          </div>
        )}
      </div>

      {viewMode === 'list' ? (
        <Card className="w-full">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Project Timeline</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <h3 className="mt-4 text-lg font-medium">Loading timeline...</h3>
              </div>
            ) : sortedMilestones.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="mt-4 text-lg font-medium">No timeline milestones yet</h3>
                <p className="text-muted-foreground mt-1">Add milestones to track your project progress.</p>
                <Button 
                  className="mt-4"
                  onClick={() => handleOpenModal()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Milestone
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <div className="min-w-fit">
                    {sortedMilestones.map((milestone, index) => (
                      <div key={milestone.id} className="flex">
                        <div className="flex flex-col items-center mr-4">
                          <div className={`rounded-full h-10 w-10 flex items-center justify-center text-white ${getStatusColor(milestone.status)}`}>
                            {getStatusIcon(milestone.status) || (index + 1)}
                          </div>
                          {index < sortedMilestones.length - 1 && (
                            <div className="h-16 w-0.5 bg-muted" />
                          )}
                        </div>
                        
                        <div className="pb-10 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-medium">{milestone.name}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className={`${getStatusColor(milestone.status)} text-white`}>
                                  {milestone.status}
                                </Badge>
                                {isDelayed(milestone) && (
                                  <Badge variant="destructive" className="text-white">
                                    Delayed
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleOpenModal(milestone)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {hasPermission('delete', 'timeline') ? (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteMilestone(milestone.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : null}
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-1 text-sm">
                            <div className="flex items-center">
                              <span className="text-muted-foreground">Planned:</span>
                              <span className="ml-1 font-medium">{new Date(milestone.planned_date).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex items-center">
                              <span className="text-muted-foreground">Actual:</span>
                              <span className="ml-1 font-medium">
                                {milestone.actual_date 
                                  ? new Date(milestone.actual_date).toLocaleDateString() 
                                  : 'Not completed'}
                              </span>
                            </div>
                          </div>
                          
                          {milestone.notes && (
                            <p className="text-sm text-muted-foreground mt-2">{milestone.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <TimelineCalendarView
          projectId={projectId}
          onMilestoneClick={(milestone) => handleOpenModal(milestone)}
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Milestone Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Civil Works"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="planned_date">Planned Date</Label>
                  <Input
                    type="date"
                    id="planned_date"
                    name="planned_date"
                    value={formData.planned_date}
                    onChange={(e) => handleDateChange('planned_date', e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="actual_date">Actual Date</Label>
                  <Input
                    type="date"
                    id="actual_date"
                    name="actual_date"
                    value={formData.actual_date || ''}
                    onChange={(e) => handleDateChange('actual_date', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: MilestoneStatus) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingMilestone ? 'Update Milestone' : 'Add Milestone'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Timeline (Excel)</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              <p className="font-medium text-gray-700 mb-2">Expected columns</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Task / Work Item (or Task / Work Item name)</li>
                <li>Start Date (planned date)</li>
              </ul>
              <p className="mt-2 text-xs">Dates can be formatted like 25-Dec-2025 or 25/12/2025.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timeline-upload">Select Excel file</Label>
              <Input
                id="timeline-upload"
                type="file"
                accept=".xlsx"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleTimelineUpload(file);
                    event.target.value = '';
                  }
                }}
                disabled={isUploading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimelineView;
