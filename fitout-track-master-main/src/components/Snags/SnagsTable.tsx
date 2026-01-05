import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createSnag, deleteSnag, getSnagsByProjectId, updateSnag } from '@/lib/api';
import { Snag, SnagStatus } from '@/lib/types';

interface SnagsTableProps {
  projectId: string;
}

interface SnagFormData {
  title: string;
  description: string;
  status: SnagStatus;
  contractorName: string;
}

const statusOptions: SnagStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

const initialFormData: SnagFormData = {
  title: '',
  description: '',
  status: 'Open',
  contractorName: '',
};

const getStatusColor = (status: SnagStatus) => {
  switch (status) {
    case 'Open':
      return 'bg-rose-500';
    case 'In Progress':
      return 'bg-amber-500';
    case 'Resolved':
      return 'bg-blue-500';
    case 'Closed':
      return 'bg-emerald-500';
    default:
      return 'bg-gray-400';
  }
};

const SnagsTable: React.FC<SnagsTableProps> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnag, setEditingSnag] = useState<Snag | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<SnagFormData>(initialFormData);

  const { data: snags = [], isLoading } = useQuery({
    queryKey: ['projectSnags', projectId],
    queryFn: () => getSnagsByProjectId(projectId),
    enabled: !!projectId,
  });

  const createSnagMutation = useMutation({
    mutationFn: (snag: Omit<Snag, 'id' | 'created_at' | 'updated_at'>) => createSnag(snag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectSnags', projectId] });
      toast.success('Snag added successfully!');
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add snag.');
    },
  });

  const updateSnagMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Snag> }) => updateSnag(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectSnags', projectId] });
      toast.success('Snag updated successfully!');
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update snag.');
    },
  });

  const deleteSnagMutation = useMutation({
    mutationFn: (id: string) => deleteSnag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectSnags', projectId] });
      toast.success('Snag deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete snag.');
    },
  });

  const filteredSnags = useMemo(() => {
    return snags.filter((snag) => {
      const matchesStatus = statusFilter === 'all' || snag.status === statusFilter;
      const matchesSearch =
        snag.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        snag.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [snags, searchQuery, statusFilter]);

  const handleOpenModal = (snag?: Snag) => {
    if (snag) {
      setEditingSnag(snag);
        setFormData({
          title: snag.title,
          description: snag.description,
          status: snag.status,
          contractorName: snag.contractor_name || '',
        });
    } else {
      setEditingSnag(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSnag(null);
    setFormData(initialFormData);
  };

  const handleInputChange = (field: 'title' | 'description', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (value: SnagStatus) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleContractorChange = (value: string) => {
    setFormData((prev) => ({ ...prev, contractorName: value }));
  };


  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      project_id: projectId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      contractor_name: formData.contractorName.trim() || null,
    };

    if (editingSnag) {
      updateSnagMutation.mutate({ id: editingSnag.id, updates: payload });
    } else {
      createSnagMutation.mutate(payload);
    }
  };

  const handleDelete = (snagId: string) => {
    deleteSnagMutation.mutate(snagId);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            Snags
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Track opening snags, assign statuses, and close out issues.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Snag
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="w-full md:w-1/2">
            <Label htmlFor="snag-search">Search</Label>
            <Input
              id="snag-search"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="w-full md:w-1/2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Snag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Loading snags...
                  </TableCell>
                </TableRow>
              ) : filteredSnags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    No snags found for this project.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSnags.map((snag) => (
                  <TableRow key={snag.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{snag.title}</div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{snag.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(snag.status)} text-white`}>
                        {snag.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {snag.contractor_name || 'Unassigned'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {snag.created_at ? new Date(snag.created_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(snag)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(snag.id)}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSnag ? 'Edit Snag' : 'Add New Snag'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="snag-title">Title</Label>
                <Input
                  id="snag-title"
                  value={formData.title}
                  onChange={(event) => handleInputChange('title', event.target.value)}
                  placeholder="Enter snag title"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="snag-description">Description</Label>
                <Textarea
                  id="snag-description"
                  value={formData.description}
                  onChange={(event) => handleInputChange('description', event.target.value)}
                  placeholder="Describe the issue..."
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleStatusChange(value as SnagStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Contractor</Label>
                <Input
                  value={formData.contractorName}
                  onChange={(event) => handleContractorChange(event.target.value)}
                  placeholder="Type contractor name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSnagMutation.isPending || updateSnagMutation.isPending}
              >
                {editingSnag ? 'Update Snag' : 'Add Snag'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SnagsTable;
