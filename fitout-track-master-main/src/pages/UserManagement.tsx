import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, UserRole, Project } from '@/lib/types';
import { getAllUsers, createUser, updateUser, deleteUser, assignUserToProject } from '@/lib/auth';
import { getProjects } from '@/lib/api';
import { Loader2, UserPlus, Pencil, Trash, CheckCircle, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CheckedState } from '@radix-ui/react-checkbox';
import { Checkbox } from '@/components/ui/checkbox';

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  
  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Contractor');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<{[key: string]: boolean}>({});
  
  // Fetch users and projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get all users
        const usersList = await getAllUsers();
        setUsers(usersList);
        
        // Get all projects for the project assignment
        const projectsList = await getProjects();
        setProjects(projectsList);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users or projects. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Reset form states
  const resetForm = () => {
    setUsername('');
    setPassword('');
    setRole('Contractor');
    setCurrentUser(null);
    setSelectedProjects({});
  };
  
  // Handle add user
  const handleAddUser = async () => {
    if (!username || !password) {
      toast({
        title: 'Error',
        description: 'Username and password are required',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      console.log('Attempting to create user:', username);
      const { user, error } = await createUser(username, password, role);
      
      if (error || !user) {
        console.error('User creation failed:', error);
        toast({
          title: 'Error',
          description: error || 'Failed to create user',
          variant: 'destructive'
        });
        return;
      }
      
      // Update user list
      setUsers([...users, user]);
      
      // Close dialog
      setAddUserOpen(false);
      resetForm();
      
      toast({
        title: 'Success',
        description: `User ${username} created successfully`
      });
      
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive'
      });
    }
  };
  
  // Handle edit user
  const handleEditUser = async () => {
    if (!currentUser) return;
    
    try {
      const updates: {username?: string; password?: string; role?: UserRole} = {};
      
      if (username && username !== currentUser.username) {
        updates.username = username;
      }
      
      if (password) {
        updates.password = password;
      }
      
      if (role !== currentUser.role) {
        updates.role = role;
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length === 0) {
        setEditUserOpen(false);
        resetForm();
        return;
      }
      
      const { user, error } = await updateUser(currentUser.id, updates);
      
      if (error || !user) {
        throw new Error(error || 'Failed to update user');
      }
      
      // Update user in the list
      setUsers(users.map(u => u.id === user.id ? user : u));
      
      // Close dialog
      setEditUserOpen(false);
      resetForm();
      
      toast({
        title: 'Success',
        description: `User updated successfully`
      });
      
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive'
      });
    }
  };
  
  // Handle delete user
  const handleDeleteUser = async () => {
    if (!currentUser) return;
    
    try {
      const { success, error } = await deleteUser(currentUser.id);
      
      if (!success || error) {
        throw new Error(error || 'Failed to delete user');
      }
      
      // Update user list
      setUsers(users.filter(u => u.id !== currentUser.id));
      
      // Close dialog
      setDeleteDialogOpen(false);
      resetForm();
      
      toast({
        title: 'Success',
        description: `User deleted successfully`
      });
      
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive'
      });
    }
  };
  
  // Handle assign projects
  const handleAssignProjects = async () => {
    if (!currentUser) return;
    
    try {
      console.log('Assigning projects to user:', currentUser.id);
      console.log('Selected projects:', selectedProjects);
      
      // Process all project assignments
      const promises = Object.entries(selectedProjects).map(async ([projectId, isAssigned]) => {
        console.log(`Project ${projectId}: ${isAssigned ? 'Assigning' : 'Not assigning'}`);
        
        if (isAssigned) {
          console.log(`Making API call to assign project ${projectId} to user ${currentUser.id}`);
          const result = await assignUserToProject(currentUser.id, projectId);
          console.log('Assignment result:', result);
          return result;
        }
        return Promise.resolve({ success: true, error: null });
      });
      
      const results = await Promise.all(promises);
      console.log('All assignment results:', results);
      
      // Close dialog
      setProjectDialogOpen(false);
      resetForm();
      
      toast({
        title: 'Success',
        description: `Projects assigned successfully`
      });
      
    } catch (error) {
      console.error('Error assigning projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign projects',
        variant: 'destructive'
      });
    }
  };
  
  // Handle project checkbox change
  const handleProjectCheckboxChange = (projectId: string, checked: CheckedState) => {
    setSelectedProjects({
      ...selectedProjects,
      [projectId]: checked === true
    });
  };
  
  // Open edit dialog with user data
  const openEditDialog = (user: User) => {
    setCurrentUser(user);
    setUsername(user.username);
    setRole(user.role);
    setPassword(''); // Don't show current password
    setEditUserOpen(true);
  };
  
  // Open delete dialog
  const openDeleteDialog = (user: User) => {
    setCurrentUser(user);
    setDeleteDialogOpen(true);
  };
  
  // Open project assignment dialog
  const openProjectDialog = (user: User) => {
    setCurrentUser(user);
    // Initialize selected projects
    // In a real app, you would fetch the user's current project assignments
    const initialSelectedProjects: {[key: string]: boolean} = {};
    projects.forEach(project => {
      initialSelectedProjects[project.id] = false;
    });
    setSelectedProjects(initialSelectedProjects);
    setProjectDialogOpen(true);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>
          <Button onClick={() => setAddUserOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No users found. Add a user to get started.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.role === 'Admin' ? 'destructive' : 
                            user.role === 'Coordinator' ? 'default' : 
                            'outline'
                          }>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEditDialog(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openDeleteDialog(user)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openProjectDialog(user)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Coordinator">Coordinator</SelectItem>
                  <SelectItem value="Contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input 
                id="edit-username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
              <Input 
                id="edit-password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Coordinator">Coordinator</SelectItem>
                  <SelectItem value="Contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserOpen(false)}>Cancel</Button>
            <Button onClick={handleEditUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center">
              Are you sure you want to delete user <span className="font-semibold">{currentUser?.username}</span>?
            </p>
            <p className="text-center text-muted-foreground text-sm mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Delete User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assign Projects Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Projects</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">Assign projects to <span className="font-semibold">{currentUser?.username}</span>:</p>
            
            {projects.length === 0 ? (
              <p className="text-muted-foreground text-sm">No projects available.</p>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {projects.map(project => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`project-${project.id}`}
                      checked={selectedProjects[project.id] || false}
                      onCheckedChange={(checked) => handleProjectCheckboxChange(project.id, checked)}
                    />
                    <Label htmlFor={`project-${project.id}`} className="flex-grow">
                      {project.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignProjects}>Save Assignments</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement; 