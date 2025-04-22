import React, { useState } from 'react';
import { Project, TimelineMilestone, ProjectItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileBarChart, Printer, Download, ChevronLeft, ChevronRight } from "lucide-react";
import ProgressChart from '@/components/Charts/ProgressChart';
import StatusDistributionChart from '@/components/Charts/StatusDistributionChart';
import TimelineChart from '@/components/Charts/TimelineChart';
import { generatePdfReport, ReportConfig } from '@/utils/reportGenerator';
import { toast } from 'sonner';

interface ProjectReportProps {
  project: Project;
  milestones: TimelineMilestone[];
  items: ProjectItem[];
  onBack?: () => void;
}

const ProjectReport: React.FC<ProjectReportProps> = ({ 
  project, 
  milestones, 
  items,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);

  // Group projects for status distribution chart
  const projectsForStatus = [project];
  
  // Calculate metrics
  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
  const totalMilestones = milestones.length;
  const milestoneCompletionRate = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;
    
  const delayedMilestones = milestones.filter(m => m.status === 'Delayed').length;
  
  const completedItems = items.filter(item => 
    (item.scope === 'Owner' && item.status === 'Installed') || 
    (item.scope === 'Contractor' && (item.completionPercentage || 0) === 100)
  ).length;
  
  const totalItems = items.length;
  const itemCompletionRate = totalItems > 0 
    ? Math.round((completedItems / totalItems) * 100) 
    : 0;
    
  const contractorItems = items.filter(i => i.scope === 'Contractor');
  const contractorProgress = contractorItems.length > 0
    ? Math.round(contractorItems.reduce((sum, item) => sum + (item.completionPercentage || 0), 0) / contractorItems.length)
    : 0;
    
  const ownerItems = items.filter(i => i.scope === 'Owner');
  const ownerItemsInstalled = ownerItems.filter(i => i.status === 'Installed').length;
  const ownerProgress = ownerItems.length > 0
    ? Math.round((ownerItemsInstalled / ownerItems.length) * 100)
    : 0;

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const config: ReportConfig = {
        includeProgress: true,
        includeStatus: true,
        includeTimeline: true,
        includeItems: true,
        title: `${project.name} - Project Report`,
        subtitle: `Location: ${project.location} | Status: ${project.status} | Progress: ${project.progress}%`
      };
      
      await generatePdfReport([project], milestones, items, config);
      toast.success('PDF report generated successfully');
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center mt-1 text-gray-600">
              <span>{project.location}</span>
              <span className="mx-2">•</span>
              <Badge className={`${
                project.status === 'In Progress' ? 'bg-blue-500' :
                project.status === 'Completed' ? 'bg-green-500' :
                project.status === 'Delayed' ? 'bg-red-500' :
                project.status === 'On Hold' ? 'bg-amber-500' : 'bg-gray-500'
              } text-white`}>
                {project.status}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
            <FileBarChart className="h-4 w-4 mr-2" />
            {isExporting ? 'Generating...' : 'Export PDF'}
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Progress</CardDescription>
            <CardTitle className="text-2xl">{project.progress}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={project.progress} className="h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Milestones</CardDescription>
            <CardTitle className="text-2xl">{completedMilestones}/{totalMilestones}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={milestoneCompletionRate} className="h-2" />
            {delayedMilestones > 0 && (
              <p className="text-xs text-red-500 mt-2">{delayedMilestones} delayed milestone(s)</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contractor Progress</CardDescription>
            <CardTitle className="text-2xl">{contractorProgress}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={contractorProgress} className="h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Owner Items</CardDescription>
            <CardTitle className="text-2xl">{ownerItemsInstalled}/{ownerItems.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={ownerProgress} className="h-2" />
          </CardContent>
        </Card>
      </div>
      
      <Card className="w-full shadow-md overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Project Performance</CardTitle>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <TabsContent value="overview" className="mt-0 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <StatusDistributionChart 
                    projects={projectsForStatus} 
                    title="Current Status" 
                    description="Project status breakdown"
                  />
                </div>
                
                <div className="flex flex-col">
                  <Card className="flex-1">
                    <CardHeader>
                      <CardTitle className="text-lg">Project Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-500 mb-1">Chain</h4>
                          <p className={`font-medium ${project.chain === 'BK' ? 'text-bk' : 'text-tc'}`}>
                            {project.chain === 'BK' ? 'Burger King' : 'Texas Chicken'}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-500 mb-1">Start Date</h4>
                          <p className="font-medium">{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-500 mb-1">Target Completion</h4>
                          <p className="font-medium">{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-500 mb-1">Last Updated</h4>
                          <p className="font-medium">{new Date(project.updated_at).toLocaleDateString()}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-500 mb-1">Completion Rate</h4>
                          <div className="flex items-center">
                            <Progress value={project.progress} className="flex-1 h-2 mr-3" />
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="mt-6 border p-4 rounded-md bg-gray-50">
                <h3 className="font-medium mb-2">Project Analysis</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {project.progress < 30 && (
                    <li className="text-rose-600">This project has low progress (below 30%). Consider prioritizing resources.</li>
                  )}
                  {project.status === 'Delayed' && (
                    <li className="text-amber-600">This project is currently delayed. Review timeline and resources.</li>
                  )}
                  {project.progress > 70 && project.status !== 'Completed' && (
                    <li className="text-green-600">Project is nearing completion. Begin preparing final inspections and handover documentation.</li>
                  )}
                  {milestones.some(m => m.status === 'Delayed') && (
                    <li className="text-amber-600">Some milestones are delayed. Review project schedule.</li>
                  )}
                  {project.progress > 0 && project.progress < 100 && new Date(project.updated_at) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) && (
                    <li className="text-blue-600">This project hasn't been updated in over 2 weeks. Update may be required.</li>
                  )}
                  {project.status === 'Completed' && project.progress === 100 && (
                    <li className="text-green-600">Project successfully completed. All objectives achieved.</li>
                  )}
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="timeline" className="mt-0 p-0">
              <TimelineChart 
                milestones={milestones} 
                title="Project Timeline" 
                description="Planned vs actual milestone completion"
              />
              
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Milestone
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Planned Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actual Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {milestones.map((milestone) => {
                      const plannedDate = new Date(milestone.planned_date);
                      const actualDate = milestone.actual_date ? new Date(milestone.actual_date) : null;
                      let variance = 0;
                      let varianceText = '-';
                      
                      if (actualDate) {
                        variance = Math.round((actualDate.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24));
                        varianceText = variance > 0 ? `+${variance} days` : variance < 0 ? `${variance} days` : 'On time';
                      } else if (milestone.status === 'Delayed' || (new Date() > plannedDate && milestone.status !== 'Completed')) {
                        variance = Math.round((new Date().getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24));
                        varianceText = `+${variance} days (ongoing)`;
                      }
                      
                      return (
                        <tr key={milestone.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{milestone.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{plannedDate.toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {actualDate ? actualDate.toLocaleDateString() : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={`
                              ${milestone.status === 'In Progress' ? 'bg-blue-500' : 
                                milestone.status === 'Completed' ? 'bg-green-500' :
                                milestone.status === 'Delayed' ? 'bg-red-500' : 'bg-gray-500'
                              } text-white`}
                            >
                              {milestone.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium
                              ${variance > 0 ? 'text-red-600' : 
                                variance < 0 ? 'text-green-600' : 'text-gray-500'}
                            `}>
                              {varianceText}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="items" className="mt-0 p-0">
              <div className="grid grid-cols-1 gap-6">
                <ProgressChart 
                  projects={[project]} 
                  title="Project Items Progress" 
                  description="Completion percentage by item"
                />
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scope
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{item.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline">{item.scope}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {item.scope === 'Owner' ? item.status : item.completionPercentage === 100 ? 'Completed' : 'In Progress'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.scope === 'Contractor' ? (
                              <div className="w-full">
                                <div className="text-sm font-medium mb-1">{item.completionPercentage || 0}%</div>
                                <Progress value={item.completionPercentage || 0} className="h-2 w-32" />
                              </div>
                            ) : (
                              <div className="text-sm">
                                {item.status === 'Installed' ? '100%' : 
                                 item.status === 'Delivered' ? '75%' : 
                                 item.status === 'Ordered' ? '50%' : 
                                 item.status === 'Not Ordered' ? '0%' : '0%'}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </CardContent>
          
          <CardFooter className="border-t pt-6">
            <div className="w-full flex justify-between">
              <Button variant="outline" onClick={onBack} disabled={!onBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
              <Button onClick={handleExportPDF} disabled={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Generating...' : 'Download Report'}
              </Button>
            </div>
          </CardFooter>
        </Tabs>
      </Card>
    </div>
  );
};

export default ProjectReport;
