
import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Filter, 
  Printer, 
  CalendarRange, 
  ArrowUpDown,
  FileBarChart,
  FileCheck,
  CheckSquare,
  ChevronLeft,
  Search
} from 'lucide-react';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Navbar from '@/components/Navbar';
import { Project, ProjectStatus } from '@/lib/types';
import { getProjects, getTimelineByProjectId, getItemsByProjectId } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProgressChart from '@/components/Charts/ProgressChart';
import StatusDistributionChart from '@/components/Charts/StatusDistributionChart';
import TimelineChart from '@/components/Charts/TimelineChart';
import { generatePdfReport, ReportConfig } from '@/utils/reportGenerator';
import ProjectReport from '@/components/Reports/ProjectReport';

const Reports = () => {
  const navigate = useNavigate();
  
  // State for filtering and viewing
  const [filterChain, setFilterChain] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('table');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState<ReportConfig>({
    includeProgress: true,
    includeStatus: true,
    includeTimeline: true,
    includeItems: true,
    title: 'Project Progress Report'
  });
  
  // Use React Query to fetch projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects
  });

  // Use React Query to fetch timeline data for the selected project
  const { data: milestones = [] } = useQuery({
    queryKey: ['timeline', selectedProjectId],
    queryFn: () => selectedProjectId ? getTimelineByProjectId(selectedProjectId) : Promise.resolve([]),
    enabled: !!selectedProjectId
  });

  // Use React Query to fetch items data for the selected project
  const { data: items = [] } = useQuery({
    queryKey: ['items', selectedProjectId],
    queryFn: () => selectedProjectId ? getItemsByProjectId(selectedProjectId) : Promise.resolve([]),
    enabled: !!selectedProjectId
  });
  
  // Filter and search projects
  const filteredProjects = projects.filter(project => {
    // Chain filter
    if (filterChain !== 'all' && project.chain !== filterChain) return false;
    
    // Status filter
    if (filterStatus !== 'all' && project.status !== filterStatus) return false;
    
    // Search query
    if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !project.location.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Get the selected project 
  const selectedProject = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId) 
    : null;
  
  // Status color mapping
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-500';
      case 'Completed': return 'bg-success';
      case 'Delayed': return 'bg-danger';
      case 'On Hold': return 'bg-warning';
      case 'Not Started': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };
  
  const handleExportPDF = async () => {
    try {
      await generatePdfReport(
        filteredProjects,
        selectedProjectId ? milestones : [],
        selectedProjectId ? items : [],
        exportConfig
      );
      toast.success('PDF report generated successfully');
      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast.error('Failed to generate PDF report');
    }
  };
  
  const handleViewProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handleBackToReports = () => {
    setSelectedProjectId(null);
    setActiveTab('table');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <p>Loading reports...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // Show detailed project report if a project is selected
  if (selectedProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ProjectReport 
              project={selectedProject}
              milestones={milestones}
              items={items}
              onBack={handleBackToReports}
            />
          </div>
        </main>
        
        <footer className="bg-white border-t py-6 mt-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-gray-500 text-center">
              FitoutTrack Master &copy; {new Date().getFullYear()} | Advanced Project Management for Restaurant Fitouts
            </p>
          </div>
        </footer>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600 mt-1">
                Generate and export project reports
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Button onClick={() => setIsExportModalOpen(true)} variant="outline">
                <FileBarChart className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
          
          <Card className="mb-6 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle>Filter Reports</CardTitle>
              <CardDescription>
                Filter and search across projects to generate custom reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/3">
                  <Select
                    value={filterChain}
                    onValueChange={setFilterChain}
                  >
                    <SelectTrigger>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Chain" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Chains</SelectItem>
                      <SelectItem value="BK">Burger King</SelectItem>
                      <SelectItem value="TC">Texas Chicken</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full md:w-1/3">
                  <Select
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                  >
                    <SelectTrigger>
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Delayed">Delayed</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full md:w-1/3 relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <Input 
                    placeholder="Search by name or location..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Project Reports</CardTitle>
                  <CardDescription>
                    Select a project to view detailed professional reports
                  </CardDescription>
                </div>
                <div className="mt-4 md:mt-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="table">Table View</TabsTrigger>
                      <TabsTrigger value="charts">Charts</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsContent value="table" className="p-0 m-0">
                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            <div className="flex items-center">
                              Project
                              <ArrowUpDown className="ml-2 h-3 w-3" />
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            <div className="flex items-center">
                              Location
                              <ArrowUpDown className="ml-2 h-3 w-3" />
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            <div className="flex items-center">
                              Chain
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            <div className="flex items-center">
                              Status
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            <div className="flex items-center">
                              Progress
                              <ArrowUpDown className="ml-2 h-3 w-3" />
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            <div className="flex items-center">
                              Last Updated
                              <CalendarRange className="ml-2 h-3 w-3" />
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            <div className="flex items-center">
                              Actions
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProjects.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                              No projects match your filter criteria
                            </td>
                          </tr>
                        ) : (
                          filteredProjects.map((project) => (
                            <tr 
                              key={project.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => setSelectedProjectId(project.id)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{project.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{project.location}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm ${project.chain === 'BK' ? 'text-bk font-medium' : 'text-tc font-medium'}`}>
                                  {project.chain === 'BK' ? 'Burger King' : 'Texas Chicken'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={`${getStatusColor(project.status)} text-white`}>
                                  {project.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="w-full">
                                  <div className="text-sm font-medium mb-1">{project.progress}%</div>
                                  <Progress value={project.progress} className="h-2 w-full" />
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {new Date(project.updated_at).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewProject(project.id);
                                    }}
                                  >
                                    View
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProjectId(project.id);
                                    }}
                                  >
                                    Report
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                <TabsContent value="charts" className="p-0 m-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div data-report-chart="progress">
                      <ProgressChart 
                        projects={filteredProjects} 
                        title="Project Progress Overview"
                        description="Progress comparison across projects"
                        threshold={75}
                      />
                    </div>
                    
                    <div data-report-chart="status">
                      <StatusDistributionChart 
                        projects={filteredProjects}
                        title="Status Distribution"
                        description="Project status breakdown"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 border p-4 rounded-md bg-gray-50">
                <h3 className="font-medium mb-2">Insights & Recommendations</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {filteredProjects.some(p => p.progress < 30) && (
                    <li className="text-rose-600">Some projects have low progress (below 30%). Consider reviewing their status.</li>
                  )}
                  {filteredProjects.some(p => p.status === 'Delayed') && (
                    <li className="text-amber-600">You have delayed projects that may require attention.</li>
                  )}
                  {filteredProjects.some(p => new Date(p.updated_at) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)) && (
                    <li className="text-blue-600">Some projects haven't been updated in over 2 weeks.</li>
                  )}
                  {filteredProjects.filter(p => p.status === 'Completed').length > 0 && (
                    <li className="text-green-600">You have {filteredProjects.filter(p => p.status === 'Completed').length} completed project(s). Great job!</li>
                  )}
                  {filteredProjects.length === 0 && (
                    <li>No projects match your current filter criteria.</li>
                  )}
                  {filteredProjects.length > 0 && !filteredProjects.some(p => p.progress < 30 || p.status === 'Delayed') && (
                    <li className="text-green-600">All projects appear to be on track. Keep up the good work!</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
            <DialogDescription>
              Customize the report content before exporting
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-progress" 
                checked={exportConfig.includeProgress}
                onCheckedChange={(checked) => 
                  setExportConfig(prev => ({ ...prev, includeProgress: !!checked }))
                }
              />
              <label
                htmlFor="include-progress"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include Progress Charts
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-status" 
                checked={exportConfig.includeStatus}
                onCheckedChange={(checked) => 
                  setExportConfig(prev => ({ ...prev, includeStatus: !!checked }))
                }
              />
              <label
                htmlFor="include-status"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include Status Distribution
              </label>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="report-title" className="text-sm font-medium">
                Report Title
              </label>
              <Input 
                id="report-title"
                value={exportConfig.title || ''}
                onChange={(e) => setExportConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Project Report"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportPDF}>
              <FileCheck className="h-4 w-4 mr-2" />
              Generate PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <footer className="bg-white border-t py-6 mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 text-center">
            FitoutTrack Master &copy; {new Date().getFullYear()} | Advanced Project Management for Restaurant Fitouts
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Reports;
