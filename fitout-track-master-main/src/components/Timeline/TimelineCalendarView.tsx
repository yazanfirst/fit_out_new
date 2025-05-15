import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimelineMilestone } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { getTimelineByProjectId } from '@/lib/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek, isAfter, isBefore, differenceInDays, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, List, AlertCircle, CheckCircle2, Clock, CalendarCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TimelineCalendarViewProps {
  projectId: string;
  onMilestoneClick?: (milestone: TimelineMilestone) => void;
}

type ViewMode = 'month' | 'week';

const TimelineCalendarView: React.FC<TimelineCalendarViewProps> = ({ 
  projectId,
  onMilestoneClick 
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['timeline', projectId],
    queryFn: () => getTimelineByProjectId(projectId)
  });

  const getMilestoneStatus = (milestone: TimelineMilestone) => {
    const plannedDate = new Date(milestone.planned_date);
    const today = new Date();
    const actualDate = milestone.actual_date ? new Date(milestone.actual_date) : null;
    const isOverdue = isBefore(plannedDate, today) && milestone.status !== 'Completed';
    const isDelayed = milestone.status === 'Delayed';
    const isCompletedLate = milestone.status === 'Completed' && actualDate && isAfter(actualDate, plannedDate);
    const isInProgress = milestone.status === 'In Progress';
    const isCompleted = milestone.status === 'Completed';
    const hasActualDate = !!actualDate;
    const completionDelay = actualDate ? differenceInDays(actualDate, plannedDate) : 0;

    return {
      isOverdue,
      isDelayed,
      isCompletedLate,
      isInProgress,
      isCompleted,
      hasActualDate,
      actualDate,
      completionDelay,
      daysOverdue: isOverdue ? differenceInDays(today, plannedDate) : 0
    };
  };

  const getStatusColor = (milestone: TimelineMilestone) => {
    const status = getMilestoneStatus(milestone);
    
    if (status.isCompletedLate) return 'bg-yellow-500';
    if (status.isDelayed) return 'bg-red-500';
    if (status.isOverdue) return 'bg-orange-500';
    if (status.isInProgress) return 'bg-blue-500';
    if (status.isCompleted) return 'bg-green-500';
    return 'bg-gray-400';
  };

  const getStatusIcon = (milestone: TimelineMilestone) => {
    const status = getMilestoneStatus(milestone);
    
    if (status.isCompletedLate) return <Clock className="h-3 w-3 mr-1" />;
    if (status.isDelayed || status.isOverdue) return <AlertCircle className="h-3 w-3 mr-1" />;
    if (status.isInProgress) return <Clock className="h-3 w-3 mr-1" />;
    if (status.isCompleted) return <CheckCircle2 className="h-3 w-3 mr-1" />;
    return null;
  };

  const getMilestoneTooltip = (milestone: TimelineMilestone) => {
    const status = getMilestoneStatus(milestone);
    const plannedDate = new Date(milestone.planned_date).toLocaleDateString();
    const actualDate = milestone.actual_date ? new Date(milestone.actual_date).toLocaleDateString() : 'Not completed';

    let statusText = '';
    let completionDetails = '';

    if (status.isCompleted) {
      if (status.hasActualDate) {
        if (status.isCompletedLate) {
          statusText = `Completed ${status.completionDelay} days late`;
          completionDetails = `Finished on ${actualDate} (${formatDistanceToNow(status.actualDate!)} ago)`;
        } else {
          statusText = 'Completed on time';
          completionDetails = `Finished on ${actualDate} (${formatDistanceToNow(status.actualDate!)} ago)`;
        }
      } else {
        statusText = 'Completed (date not recorded)';
      }
    } else if (status.isOverdue) {
      statusText = `${status.daysOverdue} days overdue`;
    } else if (status.isDelayed) {
      statusText = 'Delayed';
    } else if (status.isInProgress) {
      statusText = 'In Progress';
    }

    return (
      <div className="text-xs">
        <div className="font-medium">{milestone.name}</div>
        <div className="text-muted-foreground">Planned: {plannedDate}</div>
        {status.hasActualDate && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <CalendarCheck className="h-3 w-3" />
            <span>Completed: {actualDate}</span>
          </div>
        )}
        <div className="mt-1 font-medium">{statusText}</div>
        {completionDetails && (
          <div className="text-muted-foreground mt-1">{completionDetails}</div>
        )}
        {milestone.notes && (
          <div className="mt-2 pt-2 border-t text-muted-foreground">
            {milestone.notes}
          </div>
        )}
      </div>
    );
  };

  const getMilestonesForDate = (date: Date) => {
    return milestones.filter(milestone => 
      isSameDay(new Date(milestone.planned_date), date)
    );
  };

  const renderMilestone = (milestone: TimelineMilestone) => {
    const status = getMilestoneStatus(milestone);
    const statusColor = getStatusColor(milestone);
    const statusIcon = getStatusIcon(milestone);

    return (
      <TooltipProvider key={milestone.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "text-xs p-1 rounded cursor-pointer text-white truncate flex items-center group",
                statusColor,
                status.isOverdue && "border-l-2 border-l-red-500",
                status.isCompletedLate && "border-l-2 border-l-yellow-500",
                status.hasActualDate && "border-r-2 border-r-green-500"
              )}
              onClick={() => onMilestoneClick?.(milestone)}
            >
              <div className="flex items-center gap-1 flex-1">
                {statusIcon}
                <span className="truncate">{milestone.name}</span>
              </div>
              {status.hasActualDate && (
                <CalendarCheck className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {getMilestoneTooltip(milestone)}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium p-2">
            {day}
          </div>
        ))}
        {days.map(day => {
          const dayMilestones = getMilestonesForDate(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] p-2 border rounded-md",
                !isSameMonth(day, date) && "bg-muted/50"
              )}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayMilestones.map(milestone => renderMilestone(milestone))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(date);
    const weekEnd = endOfWeek(date);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dayMilestones = getMilestonesForDate(day);
          return (
            <div
              key={day.toISOString()}
              className="min-h-[200px] p-2 border rounded-md"
            >
              <div className="text-sm font-medium mb-2">
                {format(day, 'EEE d')}
              </div>
              <div className="space-y-1">
                {dayMilestones.map(milestone => renderMilestone(milestone))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Timeline Calendar</CardTitle>
        <div className="flex items-center space-x-2">
          <Select
            value={viewMode}
            onValueChange={(value: ViewMode) => setViewMode(value)}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Month
                </div>
              </SelectItem>
              <SelectItem value="week">
                <div className="flex items-center">
                  <List className="mr-2 h-4 w-4" />
                  Week
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setDate(new Date())}
          >
            Today
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => date && setDate(date)}
            className="rounded-md border"
          />
        </div>
        <div className="mt-4">
          {viewMode === 'month' ? renderMonthView() : renderWeekView()}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineCalendarView; 