import { getItemsByProjectId, getTimelineByProjectId } from './api';

// Calculate overall project progress based on items and milestones
export async function calculateProjectProgress(projectId: string): Promise<number> {
  try {
    console.log('Calculating progress for project:', projectId);
    
    // Fetch all project items and timeline milestones
    const [items, milestones] = await Promise.all([
      getItemsByProjectId(projectId),
      getTimelineByProjectId(projectId)
    ]);
    
    console.log(`Found ${items.length} items and ${milestones.length} milestones`);
    
    // If no items or milestones, return 0
    if (items.length === 0 && milestones.length === 0) {
      console.log('No items or milestones found, progress is 0');
      return 0;
    }
    
    const uniqueItemIds = new Set<string>();
    let totalProgress = 0;
    let totalWeight = 0;

    // Calculate progress from milestones
    for (const milestone of milestones) {
      if (!uniqueItemIds.has(milestone.id)) {
        totalProgress += milestoneProgressCalculation(milestone);
        totalWeight += 100; // Assuming each milestone has equal weight
        uniqueItemIds.add(milestone.id);
      }
    }

    // Calculate progress from project items
    for (const item of items) {
      if (!uniqueItemIds.has(item.id)) {
        totalProgress += itemProgressCalculation(item);
        totalWeight += 100; // Assuming each item has equal weight
        uniqueItemIds.add(item.id);
      }
    }

    // Calculate percentage and round to nearest integer
    const progressPercentage = Math.round((totalProgress / totalWeight) * 100);
    console.log(`Final calculated progress: ${progressPercentage}%`, {
      totalProgress,
      totalWeight,
      calculation: `(${totalProgress} / ${totalWeight}) * 100 = ${progressPercentage}`
    });
    
    return progressPercentage;
  } catch (err) {
    console.error('Error calculating project progress:', err);
    return 0; // Return 0 if there's an error
  }
}

function milestoneProgressCalculation(milestone) {
  const today = new Date();
  const plannedStart = new Date(milestone.planned_start);
  const plannedDate = new Date(milestone.planned_date);
  
  // Logic to calculate milestone progress based on its status and dates
  switch (milestone.status) {
    case 'Not Started':
      return 0;
      
    case 'In Progress':
      // Calculate progress based on time elapsed between planned start and completion
      const totalDuration = plannedDate.getTime() - plannedStart.getTime();
      const elapsedDuration = today.getTime() - plannedStart.getTime();
      const progressPercentage = (elapsedDuration / totalDuration) * 100;
      // Ensure progress is between 0 and 75 for In Progress
      return Math.min(Math.max(progressPercentage, 0), 75);
      
    case 'Completed':
      return 100;
      
    case 'Delayed':
      // If delayed, calculate partial progress
      if (today < plannedStart) {
        return 0; // Not started yet
      } else if (today < plannedDate) {
        // Calculate progress but cap it lower due to delay
        const delayedProgress = ((today.getTime() - plannedStart.getTime()) / 
                               (plannedDate.getTime() - plannedStart.getTime())) * 50;
        return Math.min(delayedProgress, 50);
      } else {
        return 50; // Capped at 50% if past planned completion date
      }
      
    default:
      return 0;
  }
}

function itemProgressCalculation(item) {
  // Logic to calculate item progress based on its status
  switch (item.status) {
    case 'Not Ordered':
      return 0;
    case 'Ordered':
      return 30;
    case 'Partially Ordered':
      return 50;
    case 'Delivered':
      return 75;
    case 'Installed':
      return 100;
    default:
      return 0;
  }
}
