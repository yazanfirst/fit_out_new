import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar, FileText, CreditCard, Clock, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Navbar from '@/components/Navbar';
import ItemsTable from '@/components/Items/ItemsTable';
import DrawingsGrid from '@/components/Drawings/DrawingsGrid';
import InvoiceTable from '@/components/Invoices/InvoiceTable';
import TimelineView from '@/components/Timeline/TimelineView';
import { getProjectById, getItemsByProjectId, getDrawingsByProjectId, getInvoicesByProjectId, getTimelineByProjectId, updateProject } from '@/lib/api';
import { calculateProjectProgress } from '@/lib/progressCalculation';
import { toast } from 'sonner';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Progress } from "@/components/ui/progress";
import { Project, ProjectStatus } from '@/lib/types';
import ProjectUsers from '@/components/ProjectUsers';
import { useAuth } from '@/contexts/AuthContext';

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  
  // Get the active tab from URL or default to 'items'
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'items';
  });

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', value);
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Use React Query to fetch project data
  const { data: project, isLoading, error, refetch } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id || ''),
    enabled: !!id
  });

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    mainContractor: '',
    status: 'Not Started' as ProjectStatus,
    progress: 0
  });
  
  // Fetch related data - moved outside of conditional rendering
  const { data: items = [] } = useQuery({
    queryKey: ['projectItems', id],
    queryFn: () => getItemsByProjectId(id || ''),
    enabled: !!id
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['projectInvoices', id],
    queryFn: () => getInvoicesByProjectId(id || ''),
    enabled: !!id
  });

  const { data: drawings = [] } = useQuery({
    queryKey: ['projectDrawings', id],
    queryFn: () => getDrawingsByProjectId(id || ''),
    enabled: !!id
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['projectTimeline', id],
    queryFn: () => getTimelineByProjectId(id || ''),
    enabled: !!id
  });
  
  // Update local state when project data is loaded
  useEffect(() => {
    if (project) {
      setNotes(project.notes || '');
      setEditForm({
        name: project.name || '',
        location: project.location || '',
        mainContractor: project.main_contractor || '',
        status: project.status as ProjectStatus,
        progress: project.progress || 0
      });
    }
  }, [project]);
  
  // If the project is loading, show a loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Loading project details...</h2>
          </div>
        </div>
      </div>
    );
  }
  
  // If there's an error or no project found, navigate back to dashboard
  if (error || !project) {
    useEffect(() => {
      navigate('/');
      toast.error('Project not found');
    }, [navigate]);
    
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-500">Project not found</h2>
            <p className="mt-2">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };
  
  const saveNotes = async () => {
    try {
      if (id) {
        await updateProject(id, { notes });
        toast.success('Notes updated successfully');
        refetch(); // Refresh the project data
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to update notes');
    }
    setIsEditingNotes(false);
  };
  
  const handleEditModalOpen = () => {
    setIsEditModalOpen(true);
  };
  
  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setEditForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Update project data with recalculated progress
  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!id) return;
      
      // First, update with user inputs
      const progressUpdate = {
        name: editForm.name,
        location: editForm.location,
        main_contractor: editForm.mainContractor,
        status: editForm.status as ProjectStatus,
        progress: editForm.progress
      };
      
      console.log("Submitting project update:", progressUpdate);
      const updatedProject = await updateProject(id, progressUpdate);
      console.log("Project updated:", updatedProject);
      
      // Aggressively invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projectItems', id] });
      queryClient.invalidateQueries({ queryKey: ['projectTimeline', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] }); // Force dashboard to update too
      
      // Force refetch the project
      await refetch();
      
      handleEditModalClose();
      toast.success('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };
  
  // Format data for the UI, converting snake_case to camelCase
  const formattedProject = {
    ...project,
    mainContractor: project.main_contractor,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };

  // Calculate derived states
  const pendingItems = items.filter(item => item.status === 'Not Ordered').length;
  const pendingInvoices = invoices.filter(invoice => invoice.status === 'Submitted').length;
  const delayedMilestones = milestones.filter(m => 
    m.status === 'Delayed' || (new Date(m.planned_date) < new Date() && m.status !== 'Completed')
  ).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-500';
      case 'Completed': return 'bg-success';
      case 'Delayed': return 'bg-danger';
      case 'On Hold': return 'bg-warning';
      case 'Not Started': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              className="mb-4 -ml-3 text-muted-foreground"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center mb-1">
                  {project.chain === 'BK' ? (
                    <span className="text-bk font-semibold text-sm">Burger King</span>
                  ) : (
                    <span className="text-tc font-semibold text-sm">Texas Chicken</span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600 mt-1">{project.location}</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex flex-col sm:flex-row md:items-end gap-3">
                <Badge 
                  className={`${getStatusColor(project.status)} text-white`}
                >
                  {project.status}
                </Badge>
                <Button onClick={handleEditModalOpen}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.progress}%</div>
                <div className="mt-2">
                  <Progress 
                    value={project.progress} 
                    className={`h-2 ${
                      project.progress >= 100 ? 'bg-success' : 
                      project.progress >= 70 ? 'bg-blue-500' : 
                      project.progress >= 30 ? 'bg-amber-500' : 
                      'bg-rose-500'
                    }`}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Main Contractor: {project.main_contractor}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Items</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center">
                <div className="mr-3 bg-blue-100 p-2 rounded-full">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{items.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {pendingItems} pending orders
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Invoices</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center">
                <div className="mr-3 bg-amber-100 p-2 rounded-full">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{invoices.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {pendingInvoices} pending approval
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center">
                <div className="mr-3 bg-rose-100 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{milestones.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {delayedMilestones > 0 ? (
                      <span className="flex items-center text-rose-500">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {delayedMilestones} delayed
                      </span>
                    ) : (
                      "On schedule"
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Project Notes</CardTitle>
                    {isEditingNotes ? (
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveNotes}>
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(true)}>
                        <Edit className="h-3 w-3 mr-2" />
                        Edit Notes
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditingNotes ? (
                    <Textarea
                      value={notes}
                      onChange={handleNotesChange}
                      className="min-h-[120px]"
                      placeholder="Add project notes here..."
                    />
                  ) : (
                    <div className="text-sm">
                      {project.notes || (
                        <span className="text-muted-foreground italic">No notes added for this project.</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Project Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium">Created On</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Last Updated</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Chain</h4>
                  <p className="text-sm text-muted-foreground">
                    {project.chain === 'BK' ? 'Burger King' : 'Texas Chicken'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Contractor</h4>
                  <p className="text-sm text-muted-foreground">{project.main_contractor}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
            <TabsList className="w-full md:w-auto grid grid-cols-2 md:grid-cols-4 mb-4">
              <TabsTrigger value="items" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Items & Orders
              </TabsTrigger>
              <TabsTrigger value="drawings" className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Drawings & Photos
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="items" className="mt-4">
              <ItemsTable projectId={project.id} />
            </TabsContent>
            
            <TabsContent value="drawings" className="mt-4">
              <DrawingsGrid projectId={project.id} />
            </TabsContent>
            
            <TabsContent value="invoices" className="mt-4">
              {hasPermission('view', 'invoices') ? (
                <InvoiceTable projectId={project.id} />
              ) : (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      You do not have permission to view invoices.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="timeline" className="mt-4">
              <TimelineView projectId={project.id} />
            </TabsContent>
          </Tabs>
          
          {/* Show project users for all roles */}
          <ProjectUsers projectId={project.id} />
        </div>
      </main>
      
      <footer className="bg-white border-t py-6 mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 text-center">
            FitoutTrack Master &copy; {new Date().getFullYear()} | Advanced Project Management for Restaurant Fitouts
          </p>
        </div>
      </footer>
      
      <Dialog open={isEditModalOpen} onOpenChange={handleEditModalClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={editForm.location}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="mainContractor">Main Contractor</Label>
                <Input
                  id="mainContractor"
                  name="mainContractor"
                  value={editForm.mainContractor}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={editForm.status} 
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
                
                <div className="grid gap-2">
                  <Label htmlFor="progress">Progress (%)</Label>
                  <Input
                    type="number"
                    id="progress"
                    name="progress"
                    value={editForm.progress}
                    onChange={handleNumberChange}
                    min={0}
                    max={100}
                    required
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleEditModalClose}>
                Cancel
              </Button>
              <Button type="submit">Update Project</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectDetails;
