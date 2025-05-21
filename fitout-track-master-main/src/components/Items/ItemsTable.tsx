
import React, { useState } from 'react';
import { Edit, Trash2, Plus, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getItemsByProjectId, createItem, updateItem, deleteItem, updateProject } from '@/lib/api';
import { ItemCategory, ItemStatus, LPOStatus, ProjectScope, ProjectItem } from '@/lib/types';
import { toast } from 'sonner';
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calculateProjectProgress } from '@/lib/progressCalculation';

interface ItemsTableProps {
  projectId: string;
}

interface ItemFormData extends Omit<ProjectItem, 'id' | 'project_id'> {
  completionPercentage?: number;
  workDescription?: string;
}

const initialFormData: ItemFormData = {
  name: '',
  category: 'S/S Items',
  quantity: 1,
  status: 'Not Ordered',
  company: '',
  lpo_status: 'LPO Pending',
  notes: '',
  scope: 'Owner',
  completionPercentage: 0,
  workDescription: ''
};

const predefinedCategories = [
  'S/S Items', 
  'Furniture', 
  'Signage', 
  'Fire Suppression', 
  'Smallware', 
  'Cold Room', 
  'Equipment',
  'Civil Works',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Finishing'
];

const ItemsTable: React.FC<ItemsTableProps> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectItem | null>(null);
  const [formData, setFormData] = useState<ItemFormData>(initialFormData);
  const [activeTab, setActiveTab] = useState<ProjectScope>('Owner');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  
  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ['projectItems', projectId],
    queryFn: () => getItemsByProjectId(projectId)
  });
  
  const items = rawItems.map(item => ({
    ...item,
    completionPercentage: item.completionPercentage || 0,
    workDescription: item.workDescription || ''
  }));
  
  const createItemMutation = useMutation({
    mutationFn: (item: Omit<ProjectItem, 'id'>) => createItem(item),
    onSuccess: async () => {
      // After successful creation, recalculate and update project progress
      try {
        // Recalculate project progress
        const newProgress = await calculateProjectProgress(projectId);
        console.log(`Item created - New calculated progress: ${newProgress}%`);
        
        // Update project progress in database
        await updateProject(projectId, { progress: newProgress });
        console.log(`Project progress updated to ${newProgress}%`);
        
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['projectItems'] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        
        toast.success('Item added successfully!');
        handleCloseModal();
      } catch (error) {
        console.error('Error updating progress after item creation:', error);
        // Still close modal and show item success message
        toast.success('Item added successfully!');
        handleCloseModal();
      }
    },
    onError: (error) => {
      console.error('Error creating item:', error);
      toast.error(`Error creating item: ${error.message}`);
    }
  });
  
  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<ProjectItem> }) => updateItem(id, updates),
    onSuccess: async () => {
      // After successful update, recalculate and update project progress
      try {
        // Recalculate project progress
        const newProgress = await calculateProjectProgress(projectId);
        console.log(`Item updated - New calculated progress: ${newProgress}%`);
        
        // Update project progress in database
        await updateProject(projectId, { progress: newProgress });
        console.log(`Project progress updated to ${newProgress}%`);
        
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['projectItems'] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        
        toast.success('Item updated successfully!');
        handleCloseModal();
      } catch (error) {
        console.error('Error updating progress after item update:', error);
        // Still close modal and show item success message
        toast.success('Item updated successfully!');
        handleCloseModal();
      }
    },
    onError: (error) => {
      console.error('Error updating item:', error);
      toast.error(`Error updating item: ${error.message}`);
    }
  });
  
  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: async () => {
      // After successful deletion, recalculate and update project progress
      try {
        // Recalculate project progress
        const newProgress = await calculateProjectProgress(projectId);
        console.log(`Item deleted - New calculated progress: ${newProgress}%`);
        
        // Update project progress in database
        await updateProject(projectId, { progress: newProgress });
        console.log(`Project progress updated to ${newProgress}%`);
        
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['projectItems'] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        
        toast.success('Item deleted successfully!');
      } catch (error) {
        console.error('Error updating progress after item deletion:', error);
        // Still show item success message
        toast.success('Item deleted successfully!');
      }
    },
    onError: (error) => {
      console.error('Error deleting item:', error);
      toast.error(`Error deleting item: ${error.message}`);
    }
  });
  
  const uniqueCategories = Array.from(new Set([
    ...predefinedCategories,
    ...items.map(item => item.category)
  ])).filter(Boolean);
  
  const filteredItems = items.filter(item => {
    return (
      item.scope === activeTab &&
      (categoryFilter === 'all' || item.category === categoryFilter) &&
      (statusFilter === 'all' || item.status === statusFilter)
    );
  });
  
  const handleOpenModal = (item?: ProjectItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity || 1,
        status: item.status,
        company: item.company || '',
        lpo_status: item.lpo_status || 'LPO Pending',
        notes: item.notes || '',
        scope: item.scope,
        completionPercentage: item.completionPercentage || 0,
        workDescription: item.workDescription || ''
      });
      setIsCustomCategory(!predefinedCategories.includes(item.category));
      if (!predefinedCategories.includes(item.category)) {
        setCustomCategory(item.category);
      }
    } else {
      setEditingItem(null);
      setFormData({...initialFormData, scope: activeTab});
      setIsCustomCategory(false);
      setCustomCategory('');
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(initialFormData);
    setIsCustomCategory(false);
    setCustomCategory('');
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    
    if (name === 'completionPercentage' && (numValue < 0 || numValue > 100)) {
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: numValue || 0 }));
  };
  
  const handleSelectChange = (name: keyof ItemFormData, value: string) => {
    if (name === 'category' && value === 'custom') {
      setIsCustomCategory(true);
      setFormData(prev => ({ ...prev, category: customCategory || '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'category') {
        setIsCustomCategory(false);
      }
    }
  };

  const handleCustomCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomCategory(value);
    setFormData(prev => ({ ...prev, category: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalFormData = { ...formData };
    if (isCustomCategory && customCategory) {
      finalFormData.category = customCategory;
    }
    
    const itemData: Omit<ProjectItem, 'id'> = {
      project_id: projectId,
      name: finalFormData.name,
      category: finalFormData.category,
      quantity: finalFormData.quantity,
      status: finalFormData.status,
      company: finalFormData.company,
      lpo_status: finalFormData.lpo_status,
      notes: finalFormData.notes,
      scope: finalFormData.scope,
      completionPercentage: finalFormData.completionPercentage,
      workDescription: finalFormData.workDescription
    };
    
    if (editingItem) {
      updateItemMutation.mutate({
        id: editingItem.id,
        updates: itemData
      });
    } else {
      createItemMutation.mutate(itemData);
    }
  };
  
  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteItemMutation.mutate(itemId);
    }
  };
  
  const getStatusColor = (status: ItemStatus) => {
    switch (status) {
      case 'Ordered': return 'bg-blue-500';
      case 'Not Ordered': return 'bg-gray-400';
      case 'Partially Ordered': return 'bg-amber-500';
      case 'Delivered': return 'bg-green-600';
      case 'Installed': return 'bg-success';
      default: return 'bg-gray-400';
    }
  };
  
  const getLPOStatusColor = (status: LPOStatus) => {
    switch (status) {
      case 'LPO Received': return 'bg-success';
      case 'LPO Pending': return 'bg-warning';
      case 'N/A': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Items & Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <p>Loading items...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Items & Orders</CardTitle>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex gap-2 w-full sm:w-auto">
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger className="w-[160px]">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[160px]">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Ordered">Ordered</SelectItem>
                  <SelectItem value="Not Ordered">Not Ordered</SelectItem>
                  <SelectItem value="Partially Ordered">Partially Ordered</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Installed">Installed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="ml-auto"
              onClick={() => handleOpenModal()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="Owner" value={activeTab} onValueChange={(value) => setActiveTab(value as ProjectScope)}>
          <TabsList className="mb-4">
            <TabsTrigger value="Owner">Owner Scope</TabsTrigger>
            <TabsTrigger value="Contractor">Contractor Scope</TabsTrigger>
          </TabsList>
          
          <TabsContent value="Owner" className="mt-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>LPO Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No items found. Add your first item.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(item.status)} text-white`}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.company}</TableCell>
                        <TableCell>
                          <Badge className={`${getLPOStatusColor(item.lpo_status)} text-white`}>
                            {item.lpo_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={item.notes}>
                          {item.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleOpenModal(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="Contractor" className="mt-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Work Description</TableHead>
                    <TableHead className="text-center">Completion</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No contractor items found. Add your first item.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate" title={item.workDescription || 'No description provided'}>
                            {item.workDescription || 'No description provided'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <div className="text-xs text-right mb-1">
                              {item.completionPercentage || 0}%
                            </div>
                            <Progress value={item.completionPercentage || 0} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(item.status)} text-white`}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.company}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleOpenModal(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>Add item details below</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={isCustomCategory ? 'custom' : formData.category} 
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {predefinedCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom Category</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {isCustomCategory && (
                    <Input
                      className="mt-2"
                      placeholder="Enter custom category"
                      value={customCategory}
                      onChange={handleCustomCategoryChange}
                      required
                    />
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="scope">Scope</Label>
                  <Select 
                    value={formData.scope} 
                    onValueChange={(value) => handleSelectChange('scope', value as ProjectScope)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Owner">Owner</SelectItem>
                      <SelectItem value="Contractor">Contractor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {formData.scope === 'Owner' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleNumberChange}
                        min={1}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => handleSelectChange('status', value as ItemStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Ordered">Not Ordered</SelectItem>
                          <SelectItem value="Ordered">Ordered</SelectItem>
                          <SelectItem value="Partially Ordered">Partially Ordered</SelectItem>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                          <SelectItem value="Installed">Installed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="lpo_status">LPO Status</Label>
                      <Select 
                        value={formData.lpo_status} 
                        onValueChange={(value) => handleSelectChange('lpo_status', value as LPOStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select LPO status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LPO Pending">LPO Pending</SelectItem>
                          <SelectItem value="LPO Received">LPO Received</SelectItem>
                          <SelectItem value="N/A">N/A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="workDescription">Work Description</Label>
                    <Textarea
                      id="workDescription"
                      name="workDescription"
                      value={formData.workDescription}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe the contractor work required..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => handleSelectChange('status', value as ItemStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Ordered">Not Started</SelectItem>
                          <SelectItem value="Ordered">In Progress</SelectItem>
                          <SelectItem value="Delivered">Almost Complete</SelectItem>
                          <SelectItem value="Installed">Complete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="completionPercentage">
                      Completion Percentage: {formData.completionPercentage}%
                    </Label>
                    <Input
                      type="range"
                      id="completionPercentage"
                      name="completionPercentage"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.completionPercentage}
                      onChange={handleNumberChange}
                      className="cursor-pointer"
                    />
                  </div>
                </>
              )}
              
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
              <Button type="submit" disabled={createItemMutation.isPending || updateItemMutation.isPending}>
                {createItemMutation.isPending || updateItemMutation.isPending ? 
                  'Processing...' : 
                  editingItem ? 'Update Item' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ItemsTable;
