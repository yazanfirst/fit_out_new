import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuditLog } from '@/lib/types';
import { getAuditLogs } from '@/lib/auth';
import { Loader2, Search, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const RECORDS_PER_PAGE = 50;

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterResource, setFilterResource] = useState<string>('');
  
  // Filter and search logs
  const filteredLogs = logs.filter(log => {
    // Apply action filter
    if (filterAction && log.action !== filterAction) {
      return false;
    }
    
    // Apply resource filter
    if (filterResource && log.resource_type !== filterResource) {
      return false;
    }
    
    // Apply search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        log.username.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        log.resource_type.toLowerCase().includes(search) ||
        log.resource_id.toLowerCase().includes(search) ||
        (log.details && log.details.toLowerCase().includes(search))
      );
    }
    
    return true;
  });
  
  // Get unique actions and resource types for filters
  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));
  const uniqueResourceTypes = Array.from(new Set(logs.map(log => log.resource_type)));
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  // Get badge color based on action
  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      case 'login':
        return 'outline';
      case 'assign':
      case 'unassign':
        return 'default';
      default:
        return 'outline';
    }
  };
  
  // Load audit logs
  const loadLogs = async () => {
    try {
      setLoading(true);
      const logsData = await getAuditLogs(RECORDS_PER_PAGE, offset);
      
      // In development mode, if empty, create some mock logs
      if (logsData.length === 0 && process.env.NODE_ENV !== 'production') {
        const mockLogs: AuditLog[] = [
          {
            id: '1',
            user_id: 'f968ddca-2424-45ff-8ffa-b7a180216734',
            username: 'admin',
            action: 'login',
            resource_type: 'session',
            resource_id: 'f968ddca-2424-45ff-8ffa-b7a180216734',
            timestamp: new Date().toISOString(),
            details: 'User logged in'
          },
          {
            id: '2',
            user_id: 'f968ddca-2424-45ff-8ffa-b7a180216734',
            username: 'admin',
            action: 'create',
            resource_type: 'project',
            resource_id: '1',
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            details: 'Created project: BK Dubai Land'
          },
          {
            id: '3',
            user_id: 'f968ddca-2424-45ff-8ffa-b7a180216734',
            username: 'admin',
            action: 'update',
            resource_type: 'project',
            resource_id: '1',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            details: 'Updated project status to In Progress'
          },
          {
            id: '4',
            user_id: 'f968ddca-2424-45ff-8ffa-b7a180216734',
            username: 'admin',
            action: 'create',
            resource_type: 'user',
            resource_id: 'abc123',
            timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            details: 'Created new user with role: Contractor'
          },
          {
            id: '5',
            user_id: 'f968ddca-2424-45ff-8ffa-b7a180216734',
            username: 'admin',
            action: 'assign',
            resource_type: 'project_user',
            resource_id: '1_abc123',
            timestamp: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
            details: 'Assigned user abc123 to project 1'
          }
        ];
        setLogs(mockLogs);
      } else {
        setLogs(logsData);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load logs on component mount and when offset changes
  useEffect(() => {
    loadLogs();
  }, [offset]);
  
  // Handle refresh
  const handleRefresh = () => {
    loadLogs();
  };
  
  // Handle load more
  const handleLoadMore = () => {
    setOffset(offset + RECORDS_PER_PAGE);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2 flex-grow md:flex-grow-0">
            <Input 
              type="text" 
              placeholder="Search logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterResource} onValueChange={setFilterResource}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Resources</SelectItem>
                {uniqueResourceTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {loading && logs.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>System Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  {searchTerm || filterAction || filterResource ? 
                    'No logs match your filter criteria.' : 
                    'No audit logs found.'}
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(log.timestamp)}</TableCell>
                          <TableCell>{log.username}</TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.resource_type}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {log.resource_id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.details || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {!searchTerm && !filterAction && !filterResource && (
                    <div className="mt-4 flex justify-center">
                      <Button 
                        variant="outline" 
                        onClick={handleLoadMore}
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AuditLogs; 