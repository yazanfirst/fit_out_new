
import html2pdf from 'html2pdf.js';
import { Project, TimelineMilestone, ProjectItem } from '@/lib/types';

export interface ReportConfig {
  includeProgress?: boolean;
  includeStatus?: boolean;
  includeTimeline?: boolean;
  includeItems?: boolean;
  title?: string;
  subtitle?: string;
}

export const generatePdfReport = async (
  projects: Project[],
  milestones: TimelineMilestone[] = [],
  items: ProjectItem[] = [],
  config: ReportConfig = {}
) => {
  // Create a container element for the report
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.style.fontFamily = 'Arial, sans-serif';
  
  // Add report header with logo and title
  const header = document.createElement('div');
  header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h1 style="color: #334155; margin-bottom: 5px; font-size: 24px;">${config.title || 'Project Report'}</h1>
        <p style="color: #64748b; margin-top: 0;">${config.subtitle || `Generated on ${new Date().toLocaleDateString()}`}</p>
      </div>
      <div style="text-align: right; font-weight: bold; color: #334155;">
        <div style="font-size: 20px;">FitoutTrack Master</div>
        <div style="font-size: 14px; color: #64748b;">Professional Reporting</div>
      </div>
    </div>
    <hr style="margin-bottom: 30px; border: none; height: 1px; background-color: #e2e8f0;">
  `;
  container.appendChild(header);
  
  // If multiple projects, add a project summary section
  if (projects.length > 1) {
    const summarySection = document.createElement('div');
    summarySection.innerHTML = `
      <h2 style="color: #334155; margin-top: 20px; margin-bottom: 15px;">Project Summary</h2>
      <div style="margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Project</th>
              <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Location</th>
              <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Chain</th>
              <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Status</th>
              <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Progress</th>
            </tr>
          </thead>
          <tbody>
            ${projects.map(project => `
              <tr>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">${project.name}</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">${project.location}</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">${project.chain === 'BK' ? 'Burger King' : 'Texas Chicken'}</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">
                  <span style="
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    background-color: ${
                      project.status === 'In Progress' ? '#3b82f6' :
                      project.status === 'Completed' ? '#22c55e' :
                      project.status === 'Delayed' ? '#ef4444' :
                      project.status === 'On Hold' ? '#f59e0b' : '#6b7280'
                    };
                    color: white;
                  ">${project.status}</span>
                </td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">
                  <div style="background-color: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden;">
                    <div style="background-color: #3b82f6; width: ${project.progress}%; height: 100%;"></div>
                  </div>
                  <div style="text-align: right; font-size: 12px; margin-top: 4px;">${project.progress}%</div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.appendChild(summarySection);
  }
  
  // For single project reports, show detailed information
  if (projects.length === 1) {
    const project = projects[0];
    const projectDetailSection = document.createElement('div');
    projectDetailSection.innerHTML = `
      <div style="display: flex; margin-bottom: 30px;">
        <div style="flex: 1; margin-right: 20px;">
          <div style="margin-bottom: 20px;">
            <h2 style="color: #334155; margin-top: 0; margin-bottom: 10px;">${project.name}</h2>
            <p style="color: #64748b; margin-top: 0; margin-bottom: 5px;">Location: ${project.location}</p>
            <p style="color: #64748b; margin-top: 0; margin-bottom: 5px;">Chain: ${project.chain === 'BK' ? 'Burger King' : 'Texas Chicken'}</p>
            <div style="margin-top: 10px;">
              <span style="
                display: inline-block;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 14px;
                background-color: ${
                  project.status === 'In Progress' ? '#3b82f6' :
                  project.status === 'Completed' ? '#22c55e' :
                  project.status === 'Delayed' ? '#ef4444' :
                  project.status === 'On Hold' ? '#f59e0b' : '#6b7280'
                };
                color: white;
              ">${project.status}</span>
            </div>
          </div>
          
          <div>
            <h3 style="color: #334155; margin-bottom: 10px;">Project Timeline</h3>
            <p style="margin-top: 0; margin-bottom: 5px;"><strong>Start Date:</strong> ${new Date(project.start_date).toLocaleDateString()}</p>
            <p style="margin-top: 0; margin-bottom: 5px;"><strong>Target Completion:</strong> ${new Date(project.end_date).toLocaleDateString()}</p>
            <p style="margin-top: 0; margin-bottom: 5px;"><strong>Last Updated:</strong> ${new Date(project.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div style="flex: 1;">
          <h3 style="color: #334155; margin-top: 0; margin-bottom: 10px;">Project Progress</h3>
          <div style="background-color: #e2e8f0; height: 24px; border-radius: 12px; overflow: hidden; margin-bottom: 10px;">
            <div style="background-color: ${
              project.progress > 75 ? '#22c55e' :
              project.progress > 40 ? '#3b82f6' :
              '#f59e0b'
            }; width: ${project.progress}%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
              ${project.progress}%
            </div>
          </div>
          
          <div style="margin-top: 20px;">
            <h3 style="color: #334155; margin-bottom: 10px;">Key Metrics</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="font-size: 14px; color: #64748b;">Milestones</div>
                <div style="font-size: 18px; font-weight: bold; margin-top: 5px;">
                  ${milestones.filter(m => m.status === 'Completed').length} / ${milestones.length}
                </div>
              </div>
              <div style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="font-size: 14px; color: #64748b;">Items</div>
                <div style="font-size: 18px; font-weight: bold; margin-top: 5px;">
                  ${items.filter(i => 
                    (i.scope === 'Owner' && i.status === 'Installed') || 
                    (i.scope === 'Contractor' && (i.completionPercentage || 0) === 100)
                  ).length} / ${items.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    container.appendChild(projectDetailSection);
  }
  
  // Clone charts from the page if they exist and if needed
  if (config.includeProgress || config.includeStatus) {
    const chartSection = document.createElement('div');
    chartSection.innerHTML = '<h2 style="color: #334155; margin-top: 30px; margin-bottom: 15px;">Project Visualizations</h2>';
    
    if (config.includeProgress && document.querySelector('[data-report-chart="progress"]')) {
      const progressChartClone = document.querySelector('[data-report-chart="progress"]')?.cloneNode(true) as HTMLElement;
      if (progressChartClone) {
        chartSection.appendChild(progressChartClone);
      }
    }
    
    if (config.includeStatus && document.querySelector('[data-report-chart="status"]')) {
      const statusChartClone = document.querySelector('[data-report-chart="status"]')?.cloneNode(true) as HTMLElement;
      if (statusChartClone) {
        chartSection.appendChild(statusChartClone);
      }
    }
    
    container.appendChild(chartSection);
  }
  
  // Add timeline section if requested
  if (config.includeTimeline && milestones.length > 0) {
    const timelineSection = document.createElement('div');
    timelineSection.innerHTML = `
      <h2 style="color: #334155; margin-top: 30px; margin-bottom: 15px;">Project Timeline</h2>
    `;
    
    if (document.querySelector('[data-report-chart="timeline"]')) {
      const timelineChartClone = document.querySelector('[data-report-chart="timeline"]')?.cloneNode(true) as HTMLElement;
      if (timelineChartClone) {
        timelineSection.appendChild(timelineChartClone);
      }
    }
    
    // Add milestone table
    timelineSection.innerHTML += `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Milestone</th>
            <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Planned Date</th>
            <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Actual Date</th>
            <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Status</th>
            <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Variance</th>
          </tr>
        </thead>
        <tbody>
          ${milestones.map(milestone => {
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
            
            return `
              <tr>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">${milestone.name}</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">${plannedDate.toLocaleDateString()}</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">${actualDate ? actualDate.toLocaleDateString() : 'Not Completed'}</td>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">
                  <span style="
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    background-color: ${
                      milestone.status === 'In Progress' ? '#3b82f6' :
                      milestone.status === 'Completed' ? '#22c55e' :
                      milestone.status === 'Delayed' ? '#ef4444' : '#6b7280'
                    };
                    color: white;
                  ">${milestone.status}</span>
                </td>
                <td style="padding: 12px; border: 1px solid #e2e8f0; ${variance > 0 ? 'color: #ef4444;' : variance < 0 ? 'color: #22c55e;' : ''}">
                  ${varianceText}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    container.appendChild(timelineSection);
  }
  
  // Add items section if requested
  if (config.includeItems && items.length > 0) {
    const itemsSection = document.createElement('div');
    
    // Group items by category
    const itemsByCategory: Record<string, ProjectItem[]> = {};
    items.forEach(item => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    });
    
    itemsSection.innerHTML = `
      <h2 style="color: #334155; margin-top: 30px; margin-bottom: 15px;">Project Items</h2>
      
      <div style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <div style="background-color: #3b82f6; width: 15px; height: 15px; margin-right: 8px; border-radius: 4px;"></div>
          <span>Owner Items: ${items.filter(i => i.scope === 'Owner').length}</span>
          <div style="background-color: #22c55e; width: 15px; height: 15px; margin-right: 8px; margin-left: 20px; border-radius: 4px;"></div>
          <span>Contractor Items: ${items.filter(i => i.scope === 'Contractor').length}</span>
        </div>
      </div>
      
      ${Object.entries(itemsByCategory).map(([category, categoryItems]) => `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #334155; margin-bottom: 10px; font-size: 16px;">${category}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Name</th>
                <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Scope</th>
                <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Status</th>
                <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0; font-weight: 600;">Progress</th>
              </tr>
            </thead>
            <tbody>
              ${categoryItems.map(item => `
                <tr>
                  <td style="padding: 12px; border: 1px solid #e2e8f0;">${item.name}</td>
                  <td style="padding: 12px; border: 1px solid #e2e8f0;">${item.scope}</td>
                  <td style="padding: 12px; border: 1px solid #e2e8f0;">
                    ${item.scope === 'Owner' ? item.status : 
                      item.completionPercentage === 100 ? 'Completed' : 'In Progress'}
                  </td>
                  <td style="padding: 12px; border: 1px solid #e2e8f0;">
                    ${item.scope === 'Contractor' ? 
                      `<div style="background-color: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden; width: 120px;">
                        <div style="background-color: #3b82f6; width: ${item.completionPercentage || 0}%; height: 100%;"></div>
                      </div>
                      <div style="text-align: right; font-size: 12px; margin-top: 4px;">${item.completionPercentage || 0}%</div>` : 
                      `<span>${item.status === 'Installed' ? '100%' : 
                         item.status === 'Delivered' ? '75%' : 
                         item.status === 'Ordered' ? '50%' : '0%'}</span>`
                    }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    `;
    
    container.appendChild(itemsSection);
  }
  
  // Add project recommendations if it's a single project
  if (projects.length === 1) {
    const project = projects[0];
    const recommendationsSection = document.createElement('div');
    
    recommendationsSection.innerHTML = `
      <h2 style="color: #334155; margin-top: 30px; margin-bottom: 15px;">Analysis & Recommendations</h2>
      <div style="padding: 15px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <ul style="margin: 0; padding-left: 20px;">
          ${project.progress < 30 ? 
            '<li style="margin-bottom: 8px; color: #ef4444;">This project has low progress (below 30%). Consider prioritizing resources.</li>' : ''}
          ${project.status === 'Delayed' ? 
            '<li style="margin-bottom: 8px; color: #f59e0b;">This project is currently delayed. Review timeline and resources.</li>' : ''}
          ${project.progress > 70 && project.status !== 'Completed' ? 
            '<li style="margin-bottom: 8px; color: #22c55e;">Project is nearing completion. Begin preparing final inspections and handover documentation.</li>' : ''}
          ${milestones.some(m => m.status === 'Delayed') ? 
            '<li style="margin-bottom: 8px; color: #f59e0b;">Some milestones are delayed. Review project schedule.</li>' : ''}
          ${project.progress > 0 && project.progress < 100 && new Date(project.updated_at) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) ? 
            '<li style="margin-bottom: 8px; color: #3b82f6;">This project hasn\'t been updated in over 2 weeks. Update may be required.</li>' : ''}
          ${project.status === 'Completed' && project.progress === 100 ? 
            '<li style="margin-bottom: 8px; color: #22c55e;">Project successfully completed. All objectives achieved.</li>' : ''}
          ${!(project.progress < 30) && project.status !== 'Delayed' && !milestones.some(m => m.status === 'Delayed') ? 
            '<li style="margin-bottom: 8px; color: #22c55e;">Project is progressing according to plan. Continue with current approach.</li>' : ''}
        </ul>
      </div>
    `;
    
    container.appendChild(recommendationsSection);
  }
  
  // Add footer
  const footer = document.createElement('div');
  footer.style.marginTop = '40px';
  footer.style.textAlign = 'center';
  footer.style.borderTop = '1px solid #e2e8f0';
  footer.style.paddingTop = '20px';
  footer.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="color: #64748b; font-size: 12px;">
        FitoutTrack Master &copy; ${new Date().getFullYear()} | Advanced Project Management for Restaurant Fitouts
      </div>
      <div style="color: #64748b; font-size: 12px;">
        Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
      </div>
    </div>
  `;
  container.appendChild(footer);
  
  // Generate PDF
  const opt = {
    margin: [15, 15, 15, 15],
    filename: `${config.title || 'project-report'}-${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  // Append to document, generate PDF, then remove
  document.body.appendChild(container);
  
  try {
    await html2pdf().from(container).set(opt).save();
  } finally {
    document.body.removeChild(container);
  }
};
