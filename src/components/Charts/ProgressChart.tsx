
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell,
  ReferenceLine
} from 'recharts';
import { Project, ProjectStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ProgressChartProps {
  projects: Project[];
  title?: string;
  description?: string;
  threshold?: number;
}

const statusColors = {
  'In Progress': '#3b82f6', // blue-500
  'Completed': '#22c55e', // green-500
  'Delayed': '#ef4444', // red-500
  'On Hold': '#f59e0b', // amber-500
  'Not Started': '#6b7280', // gray-500
};

const getBarColor = (progress: number, status: ProjectStatus) => {
  if (status === 'Delayed') return statusColors['Delayed'];
  if (status === 'Completed') return statusColors['Completed'];
  if (progress < 30) return '#f87171'; // Light red
  if (progress < 70) return '#fbbf24'; // Amber
  return '#34d399'; // Green
};

const ProgressChart: React.FC<ProgressChartProps> = ({ 
  projects,
  title = "Project Progress Overview",
  description,
  threshold = 70
}) => {
  // Sort projects by progress in descending order
  const sortedProjects = [...projects].sort((a, b) => b.progress - a.progress);
  
  // Transform projects data for chart visualization
  const chartData = sortedProjects.map(project => ({
    name: project.name.length > 15 ? `${project.name.substring(0, 15)}...` : project.name,
    progress: project.progress,
    status: project.status,
    fullName: project.name,
    location: project.location,
    chain: project.chain
  }));

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                type="number"
                domain={[0, 100]} 
                unit="%" 
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                dataKey="name" 
                type="category"
                width={150}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Progress']}
                labelFormatter={(label) => {
                  const project = chartData.find(p => p.name === label);
                  return project ? `${project.fullName} (${project.location})` : label;
                }}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0'
                }}
              />
              <Legend />
              <ReferenceLine 
                x={threshold} 
                stroke="#0ea5e9" 
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{ 
                  value: `${threshold}% Target`, 
                  position: 'insideTopRight',
                  fill: '#0ea5e9',
                  fontSize: 12
                }} 
              />
              <Bar 
                dataKey="progress" 
                name="Completion %" 
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.progress, entry.status as ProjectStatus)} 
                  />
                ))}
                <LabelList 
                  dataKey="progress" 
                  position="insideRight" 
                  formatter={(value: number) => `${value}%`}
                  style={{ fill: '#fff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
