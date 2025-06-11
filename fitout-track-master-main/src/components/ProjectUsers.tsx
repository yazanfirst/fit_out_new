import React, { useState, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getAllUsers, getProjectUsers, assignUserToProject, removeUserFromProject } from '@/lib/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, X, UserPlus, UserX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserMinus, CheckCircle } from 'lucide-react';

interface ProjectUsersProps {
  projectId: string;
}

const ProjectUsers: React.FC<ProjectUsersProps> = ({ projectId }) => {
  const { toast } = useToast();
  const { user: currentUser, hasPermission } = useAuth();
  
  const [projectUsers, setProjectUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const isAdmin = currentUser?.role === 'Admin';
  
  // Fetch project users
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get users assigned to this project
        const users = await getProjectUsers(projectId);
        setProjectUsers(users);
        
        // If admin, also get all users for the "add user" functionality
        if (isAdmin) {
          const allUsersList = await getAllUsers();
          setAllUsers(allUsersList);
        }
      } catch (error) {
        console.error('Error fetching project users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project users',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [projectId, isAdmin, toast]);
  
  // Add user to project
  const handleAddUser = async (userId: string) => {
    try {
      const { success, error } = await assignUserToProject(userId, projectId);
      
      if (!success || error) {
        throw new Error(error || 'Failed to assign user to project');
      }
      
      // Get the user details from allUsers
      const addedUser = allUsers.find(u => u.id === userId);
      
      if (addedUser) {
        // Add to the list of project users
        setProjectUsers([...projectUsers, addedUser]);
      }
      
      toast({
        title: 'Success',
        description: 'User assigned to project'
      });
      
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Error assigning user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign user',
        variant: 'destructive'
      });
    }
  };
  
  // Remove user from project
  const handleRemoveUser = async (userId: string) => {
    try {
      const { success, error } = await removeUserFromProject(userId, projectId);
      
      if (!success || error) {
        throw new Error(error || 'Failed to remove user from project');
      }
      
      // Remove from the list of project users
      setProjectUsers(projectUsers.filter(u => u.id !== userId));
      
      toast({
        title: 'Success',
        description: 'User removed from project'
      });
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove user',
        variant: 'destructive'
      });
    }
  };
  
  // Filter out users already in the project
  const getAvailableUsers = () => {
    const projectUserIds = projectUsers.map(user => user.id);
    return allUsers.filter(user => !projectUserIds.includes(user.id));
  };
  
  // Filter available users by search term
  const getFilteredAvailableUsers = () => {
    const availableUsers = getAvailableUsers();
    if (!searchTerm) return availableUsers;
    
    return availableUsers.filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  // Get the role badge color class
  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-800';
      case 'Coordinator':
        return 'bg-blue-100 text-blue-800';
      case 'Contractor':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-medium">Project Users</CardTitle>
          <CardDescription>
            {isAdmin 
              ? 'Manage users who have access to this project'
              : 'Users who have access to this project'
            }
          </CardDescription>
        </div>
        
        {isAdmin && (
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projectUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No users assigned to this project.</p>
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setAddDialogOpen(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeClass(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveUser(user.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User to Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input 
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {getFilteredAvailableUsers().length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No users available to add</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredAvailableUsers().map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeClass(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddUser(user.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProjectUsers; 