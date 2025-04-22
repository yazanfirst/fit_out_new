
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
  ReferenceLine,
  Cell,
  Label
} from 'recharts';
import { TimelineMilestone } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TimelineChartProps {
  milestones: TimelineMilestone[];
  title?: string;
  description?: string;
}

const statusColors = {
  'Not Started': '#6b7280', // gray-500
  'In Progress': '#3b82f6', // blue-500
  'Completed': '#22c55e', // green-500
  'Delayed': '#ef4444', // red-500
};

const TimelineChart: React.FC<TimelineChartProps> = ({ 
  milestones,
  title = "Project Timeline",
  description
}) => {
  const today = new Date();
  
  // Sort milestones by planned date
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime()
  );

  // Transform milestones data for timeline chart
  const timelineData = sortedMilestones.map(milestone => {
    const plannedDate = new Date(milestone.planned_date);
    const actualDate = milestone.actual_date ? new Date(milestone.actual_date) : null;
    
    // Calculate if milestone is delayed
    const isDelayed = milestone.status === 'Delayed' || 
                     (!actualDate && today > plannedDate && milestone.status !== 'Completed');
    
    // Calculate days difference for completed milestones
    let daysVariance = 0;
    if (actualDate && milestone.status === 'Completed') {
      daysVariance = Math.round((actualDate.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return {
      name: milestone.name.length > 18 ? `${milestone.name.substring(0, 18)}...` : milestone.name,
      planned: plannedDate.getTime(),
      actual: actualDate ? actualDate.getTime() : null,
      fullName: milestone.name,
      status: milestone.status,
      plannedDateFormatted: plannedDate.toLocaleDateString(),
      actualDateFormatted: actualDate ? actualDate.toLocaleDateString() : 'Not completed',
      isDelayed,
      daysVariance
    };
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  // Find the earliest and latest dates for domain
  const allDates = timelineData.flatMap(item => [
    item.planned, 
    item.actual || item.planned // Use planned if actual doesn't exist
  ]);
  
  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));
  
  // Add padding days to start and end
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 7);

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-blue-500 text-blue-500">Planned</Badge>
            <Badge variant="outline" className="border-green-500 text-green-500">Actual</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={timelineData}
              margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
              layout="vertical"
              barGap={0}
              barSize={12}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                type="number"
                domain={[minDate.getTime(), maxDate.getTime()]}
                tickFormatter={formatDate}
                padding={{ left: 30, right: 30 }}
              />
              <YAxis 
                dataKey="name" 
                type="category"
                width={150}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                labelFormatter={(label) => {
                  const milestone = timelineData.find(m => m.name === label);
                  return milestone ? milestone.fullName : label;
                }}
                formatter={(value, name) => {
                  const date = new Date(value as number);
                  return [
                    date.toLocaleDateString(), 
                    name === 'planned' ? 'Planned Date' : 'Actual Date'
                  ];
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
                x={today.getTime()} 
                stroke="#ef4444" 
                strokeWidth={2}
              >
                <Label 
                  value="Today" 
                  position="insideBottom" 
                  fill="#ef4444" 
                  fontSize={12}
                />
              </ReferenceLine>
              
              <Bar 
                dataKey="planned" 
                name="Planned Date" 
                fill="#3b82f6"
                radius={[4, 4, 4, 4]}
              />
              
              <Bar 
                dataKey="actual" 
                name="Actual Date" 
                radius={[4, 4, 4, 4]}
              >
                {timelineData.map((entry, index) => {
                  let color = '#22c55e'; // Default to green for completed on time
                  
                  if (entry.daysVariance > 0) {
                    // Late completion (red)
                    color = '#ef4444';
                  } else if (entry.daysVariance < 0) {
                    // Early completion (darker green)
                    color = '#15803d';
                  }
                  
                  if (entry.isDelayed && !entry.actual) {
                    color = '#f59e0b'; // Amber for delayed
                  }
                  
                  return <Cell key={`cell-${index}`} fill={entry.actual ? color : '#6b7280'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineChart;
