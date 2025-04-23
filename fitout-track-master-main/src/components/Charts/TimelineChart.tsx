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

// Helper to safely create Date objects
const safeNewDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  try {
    return new Date(dateString);
  } catch (e) {
    console.error("Invalid date string:", dateString, e);
    return null;
  }
};

const TimelineChart: React.FC<TimelineChartProps> = ({ 
  milestones,
  title = "Project Timeline",
  description
}) => {
  const today = new Date();
  
  // Sort milestones by planned start date
  const sortedMilestones = [...milestones].sort(
    (a, b) => (safeNewDate(a.planned_start)?.getTime() ?? 0) - (safeNewDate(b.planned_start)?.getTime() ?? 0)
  );

  // Transform milestones data for timeline chart
  const timelineData = sortedMilestones.map(milestone => {
    const plannedStart = safeNewDate(milestone.planned_start);
    const actualStart = safeNewDate(milestone.actual_start);
    const plannedCompletion = safeNewDate(milestone.planned_date); // Existing planned_date is completion
    const actualCompletion = safeNewDate(milestone.actual_date); // Existing actual_date is completion
    
    // Calculate if milestone is delayed (based on completion date for now)
    const isDelayed = milestone.status === 'Delayed' || 
                     (milestone.status === 'In Progress' && plannedCompletion && today > plannedCompletion) ||
                     (milestone.status === 'Not Started' && plannedStart && today > plannedStart);
    
    // Calculate days variance for completed milestones (Completion variance)
    let daysVariance = 0;
    if (actualCompletion && plannedCompletion && milestone.status === 'Completed') {
      daysVariance = Math.round((actualCompletion.getTime() - plannedCompletion.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return {
      name: milestone.name.length > 18 ? `${milestone.name.substring(0, 18)}...` : milestone.name,
      plannedStart: plannedStart?.getTime(),
      actualStart: actualStart?.getTime(),
      plannedCompletion: plannedCompletion?.getTime(),
      actualCompletion: actualCompletion?.getTime(),
      // Keep other fields for tooltip or potential future use
      fullName: milestone.name,
      status: milestone.status,
      isDelayed,
      daysVariance,
      // Formatted dates for tooltip
      plannedStartDateFormatted: plannedStart?.toLocaleDateString() ?? 'N/A',
      actualStartDateFormatted: actualStart?.toLocaleDateString() ?? 'Not started',
      plannedCompletionDateFormatted: plannedCompletion?.toLocaleDateString() ?? 'N/A',
      actualCompletionDateFormatted: actualCompletion?.toLocaleDateString() ?? 'Not completed',
    };
  });

  const formatDate = (timestamp: number | null | undefined) => {
    if (timestamp === null || timestamp === undefined) return '';
    const date = new Date(timestamp);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  // Find the earliest and latest dates for domain from all potential dates
  const allDates = timelineData.flatMap(item => [
    item.plannedStart, 
    item.actualStart,
    item.plannedCompletion,
    item.actualCompletion
  ]).filter(d => d !== undefined && d !== null) as number[]; // Filter out null/undefined
  
  const minTimestamp = allDates.length > 0 ? Math.min(...allDates) : today.getTime();
  const maxTimestamp = allDates.length > 0 ? Math.max(...allDates) : today.getTime();

  const minDate = new Date(minTimestamp);
  const maxDate = new Date(maxTimestamp);
  
  // Add padding days to start and end
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 7);

  // Custom Tooltip Content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Get data for the hovered milestone
      return (
        <div className="custom-tooltip bg-white p-3 border rounded shadow-lg">
          <p className="label font-semibold text-gray-700">{`${data.fullName}`}</p>
          <p className="status font-medium" style={{ color: statusColors[data.status as keyof typeof statusColors] || '#000' }}>{`Status: ${data.status}`}</p>
          <hr className="my-1"/>
          <p className="intro text-sm text-blue-600">{`Planned Start: ${data.plannedStartDateFormatted}`}</p>
           {data.actualStart && <p className="intro text-sm text-blue-800">{`Actual Start: ${data.actualStartDateFormatted}`}</p>}
          <p className="intro text-sm text-green-600">{`Planned Completion: ${data.plannedCompletionDateFormatted}`}</p>
          {data.actualCompletion && <p className="intro text-sm text-green-800">{`Actual Completion: ${data.actualCompletionDateFormatted}`}</p>}
          {data.status === 'Completed' && <p className="variance text-xs italic">{`Completion Variance: ${data.daysVariance} days`}</p>}
        </div>
      );
    }
    return null;
  };


  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
           {/* Legend can be updated or simplified */}
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center"><div className="w-3 h-3 mr-1 bg-blue-400 rounded-sm"></div>Planned Start</span>
            <span className="flex items-center"><div className="w-3 h-3 mr-1 bg-blue-600 rounded-sm"></div>Actual Start</span>
            <span className="flex items-center"><div className="w-3 h-3 mr-1 bg-green-400 rounded-sm"></div>Planned Comp.</span>
            <span className="flex items-center"><div className="w-3 h-3 mr-1 bg-green-600 rounded-sm"></div>Actual Comp.</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[450px]"> {/* Adjust height as needed */}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={timelineData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
              barCategoryGap="20%" // Adjust gap between milestone groups
              barGap={2} // Adjust gap between bars within a group
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                type="number"
                domain={[minDate.getTime(), maxDate.getTime()]}
                tickFormatter={formatDate} // Use updated formatDate
                scale="time"
                // interval="preserveStartEnd" // May help with tick distribution
                // tickCount={10} // Adjust tick count for clarity
              />
              <YAxis 
                dataKey="name" 
                type="category"
                width={150} // Adjust width based on longest milestone name
                tick={{ fontSize: 10 }} // Smaller font size for Y-axis labels
                interval={0} // Ensure all labels are shown
              />
              <Tooltip content={<CustomTooltip />} /> 
              {/* <Legend /> */} {/* Remove or customize legend */}
              <ReferenceLine 
                x={today.getTime()} 
                stroke="#ef4444" 
                strokeWidth={1} // Thinner line
                strokeDasharray="4 2" // Dashed line
              >
                <Label 
                  value="Today" 
                  position="top" 
                  fill="#ef4444" 
                  fontSize={10}
                  offset={5}
                />
              </ReferenceLine>
              
              {/* Planned Start Bar */}
              <Bar dataKey="plannedStart" name="Planned Start" fill="#a5b4fc" radius={2} barSize={8}/> 
              {/* Actual Start Bar */}
              <Bar dataKey="actualStart" name="Actual Start" fill="#6366f1" radius={2} barSize={8}/> 
              {/* Planned Completion Bar */}
              <Bar dataKey="plannedCompletion" name="Planned Completion" fill="#86efac" radius={2} barSize={8}/> 
              {/* Actual Completion Bar */}
              <Bar dataKey="actualCompletion" name="Actual Completion" fill="#22c55e" radius={2} barSize={8}>
                 {/* Optional: Color actual completion based on variance/delay */}
                 {/* {timelineData.map((entry, index) => {
                    let color = '#22c55e'; // Default green
                    if (entry.status === 'Completed') {
                      if (entry.daysVariance > 0) color = '#ef4444'; // Late - red
                      else if (entry.daysVariance < 0) color = '#15803d'; // Early - darker green
                    } else if (entry.isDelayed) {
                       color = '#f59e0b'; // Delayed - amber (if not completed)
                    } else if (!entry.actualCompletion) {
                       color = '#e5e7eb'; // Not completed yet - light gray
                    }
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })} */}
              </Bar>

            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Optional: Add the table view below the chart if needed */}
      </CardContent>
    </Card>
  );
};

export default TimelineChart;
