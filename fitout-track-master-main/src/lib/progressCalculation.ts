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
    
    let totalProgress = 0;
    let totalWeight = 0;

    // Calculate progress from milestones
    milestones.forEach(milestone => {
      totalProgress += milestoneProgressCalculation(milestone);
      totalWeight += 100; // Assuming equal weight
    });

    // Calculate progress from project items
    items.forEach(item => {
      totalProgress += itemProgressCalculation(item);
      totalWeight += 100; // Assuming equal weight
    });

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
  // Logic to calculate milestone progress based on its status
  switch (milestone.status) {
    case 'Not Started':
      return 0;
    case 'In Progress':
      return 50;
    case 'Completed':
      return 100;
    case 'Delayed':
      return 25;
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
