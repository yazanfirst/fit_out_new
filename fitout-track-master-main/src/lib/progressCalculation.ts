
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
    
    // Calculate progress from items
    let itemsProgress = 0;
    let totalItemWeight = 0;
    
    // Owner items progress (based on status)
    const ownerItems = items.filter(item => item.scope === 'Owner');
    if (ownerItems.length > 0) {
      console.log(`Processing ${ownerItems.length} owner items`);
      ownerItems.forEach(item => {
        let itemProgress = 0;
        switch (item.status) {
          case 'Not Ordered':
            itemProgress = 0;
            break;
          case 'Ordered':
            itemProgress = 30;
            break;
          case 'Partially Ordered':
            itemProgress = 50;
            break;
          case 'Delivered':
            itemProgress = 75;
            break;
          case 'Installed':
            itemProgress = 100;
            break;
          default:
            itemProgress = 0;
        }
        itemsProgress += itemProgress;
        totalItemWeight += 100; // Each item has a max value of 100%
        console.log(`Owner item "${item.name}" status: ${item.status}, progress: ${itemProgress}`);
      });
    }
    
    // Contractor items progress (based on completion percentage)
    const contractorItems = items.filter(item => item.scope === 'Contractor');
    if (contractorItems.length > 0) {
      console.log(`Processing ${contractorItems.length} contractor items`);
      contractorItems.forEach(item => {
        // Use the camelCase property to match the frontend
        const completionPercentage = item.completionPercentage || 0;
        itemsProgress += completionPercentage;
        totalItemWeight += 100; // Each item has a max value of 100%
        console.log(`Contractor item "${item.name}" completion: ${completionPercentage}%`);
      });
    }
    
    // Calculate progress from milestones
    let milestonesProgress = 0;
    const totalMilestoneWeight = milestones.length * 100;
    
    if (milestones.length > 0) {
      console.log(`Processing ${milestones.length} milestones`);
      milestones.forEach(milestone => {
        let milestoneProgress = 0;
        switch (milestone.status) {
          case 'Not Started':
            milestoneProgress = 0;
            break;
          case 'In Progress':
            milestoneProgress = 50;
            break;
          case 'Completed':
            milestoneProgress = 100;
            break;
          case 'Delayed':
            milestoneProgress = 25;
            break;
          default:
            milestoneProgress = 0;
        }
        milestonesProgress += milestoneProgress;
        console.log(`Milestone "${milestone.name}" status: ${milestone.status}, progress: ${milestoneProgress}`);
      });
    }
    
    // Calculate overall progress
    const totalWeight = totalItemWeight + totalMilestoneWeight;
    const totalProgress = itemsProgress + milestonesProgress;
    
    // Avoid division by zero
    if (totalWeight === 0) {
      console.log('Total weight is 0, progress is 0');
      return 0;
    }
    
    // Calculate percentage and round to nearest integer
    const progressPercentage = Math.round((totalProgress / totalWeight) * 100);
    console.log(`Final calculated progress: ${progressPercentage}%`, {
      itemsProgress,
      milestonesProgress,
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
