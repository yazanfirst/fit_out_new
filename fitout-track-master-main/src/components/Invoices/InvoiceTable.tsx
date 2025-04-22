import React, { useState } from 'react';
import { Edit, Trash2, Plus, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getInvoicesByProjectId, createInvoice, updateInvoice, deleteInvoice, getStorageUrl } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Invoice, InvoiceStatus, InvoiceType } from '@/lib/types';
import FileUploadField from '../FileUpload/FileUploadField';

interface InvoiceTableProps {
  projectId: string;
}

interface InvoiceFormData {
  itemName: string; // Changed from itemId to itemName for manual input
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  status: InvoiceStatus;
  type: InvoiceType;
}

const initialFormData: InvoiceFormData = {
  itemName: '', // Manual input instead of selection
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  amount: 0,
  status: 'Submitted',
  type: '25%'
};

const InvoiceTable: React.FC<InvoiceTableProps> = ({ projectId }) => {
  const queryClient = useQueryClient();
  
  // Use React Query to fetch invoices
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['projectInvoices', projectId],
    queryFn: async () => {
      const invoiceData = await getInvoicesByProjectId(projectId);
      // For each invoice, get the storage URL if needed
      for (const invoice of invoiceData) {
        if (invoice.file_path) {
          try {
            // Use proper bucket and path extraction
            const bucketName = 'invoice-files';
            const filePath = invoice.file_path.replace(`${bucketName}/`, '');
            invoice.fileUrl = await getStorageUrl(bucketName, filePath);
          } catch (err) {
            console.error('Error getting file URL:', err);
          }
        }
      }
      return invoiceData;
    }
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState<InvoiceFormData>(initialFormData);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async ({ invoice, file }: { invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>, file?: File }) => {
      return await createInvoice(invoice, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectInvoices'] });
      toast.success('Invoice added successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
      toast.error(`Error creating invoice: ${error.message}`);
    }
  });
  
  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, updates, file }: { id: string, updates: Partial<Invoice>, file?: File }) => {
      return await updateInvoice(id, updates, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectInvoices'] });
      toast.success('Invoice updated successfully!');
      handleCloseModal();
    },
    onError: (error) => {
      console.error('Error updating invoice:', error);
      toast.error(`Error updating invoice: ${error.message}`);
    }
  });
  
  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectInvoices'] });
      toast.success('Invoice deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Error deleting invoice: ${error.message}`);
    }
  });
  
  const filteredInvoices = invoices.filter(invoice => {
    return statusFilter === 'all' || invoice.status === statusFilter;
  });
  
  const handleOpenModal = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        itemName: invoice.item_id || '', // Use item_id directly for itemName
        invoiceNumber: invoice.invoice_number,
        invoiceDate: new Date(invoice.invoice_date).toISOString().split('T')[0],
        amount: Number(invoice.amount),
        status: invoice.status,
        type: invoice.type
      });
    } else {
      setEditingInvoice(null);
      setFormData(initialFormData);
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingInvoice(null);
    setFormData(initialFormData);
    setSelectedFile(null);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };
  
  const handleSelectChange = (name: keyof InvoiceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
    } else {
      setSelectedFile(null);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create proper invoice object ensuring required fields are present
    const invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at'> = {
      project_id: projectId,
      invoice_number: formData.invoiceNumber,
      invoice_date: formData.invoiceDate,
      amount: formData.amount,
      status: formData.status,
      type: formData.type,
      item_id: formData.itemName, // Store the manual item name directly in item_id field
      file_path: ''
    };
    
    if (editingInvoice) {
      updateInvoiceMutation.mutate({
        id: editingInvoice.id,
        updates: invoiceData,
        file: selectedFile || undefined
      });
    } else {
      createInvoiceMutation.mutate({
        invoice: invoiceData,
        file: selectedFile || undefined
      });
    }
  };
  
  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoiceMutation.mutate(invoiceId);
    }
  };
  
  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-500';
      case 'Approved': return 'bg-amber-500';
      case 'Paid': return 'bg-success';
      case 'Rejected': return 'bg-danger';
      case 'Not Submitted': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  if (isLoadingInvoices) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <p>Loading invoices...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Invoices</CardTitle>
          
          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Not Submitted">Not Submitted</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              className="sm:ml-auto"
              onClick={() => handleOpenModal()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Invoice
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount (AED)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No invoices found. Add your first invoice.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.item_id}</TableCell>
                    <TableCell>{invoice.type}</TableCell>
                    <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                    <TableCell>{Number(invoice.amount).toLocaleString()} AED</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(invoice.status)} text-white`}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invoice.fileUrl ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            if (invoice.fileUrl) {
                              console.log("Opening file URL:", invoice.fileUrl);
                              window.open(invoice.fileUrl, '_blank');
                            }
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenModal(invoice)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          disabled={deleteInvoiceMutation.isPending}
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
      </CardContent>
      
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Add New Invoice'}</DialogTitle>
            <DialogDescription>Enter the invoice details below</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  placeholder="Enter item name manually"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="invoiceDate">Invoice Date</Label>
                  <Input
                    type="date"
                    id="invoiceDate"
                    name="invoiceDate"
                    value={formData.invoiceDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (AED)</Label>
                  <Input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleNumberChange}
                    min={0}
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="type">Invoice Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => handleSelectChange('type', value as InvoiceType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25%">25% Payment</SelectItem>
                      <SelectItem value="50%">50% Payment</SelectItem>
                      <SelectItem value="100%">100% Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value as InvoiceStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Submitted">Not Submitted</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>Invoice File</Label>
                <FileUploadField
                  onFileSelected={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  multiple={false}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
              >
                {createInvoiceMutation.isPending || updateInvoiceMutation.isPending ? 
                  'Processing...' : 
                  editingInvoice ? 'Update Invoice' : 'Add Invoice'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default InvoiceTable;
