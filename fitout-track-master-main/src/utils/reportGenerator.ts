// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Project, TimelineMilestone, ProjectItem, Drawing } from '@/lib/types';
import { getStorageUrl } from '@/lib/api';

// Helper function to preload images
const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

// ADD THIS FUNCTION for preloaded images
const loadImageAsDataUrl = async (url, maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`Loading image: ${url}, attempt ${retries + 1}/${maxRetries}`);
      const response = await fetch(url, { 
        mode: 'cors',
        cache: 'force-cache' // Try to use cached version if available
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(`Error loading image (attempt ${retries + 1}/${maxRetries}):`, error);
      retries++;
      
      if (retries >= maxRetries) {
        console.error(`Failed to load image after ${maxRetries} attempts:`, url);
        return null;
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
};

export interface ReportConfig {
  includeProgress?: boolean;
  includeStatus?: boolean;
  includeTimeline?: boolean;
  includeItems?: boolean;
  includePhotos?: boolean;
  maxPhotos?: number;
  title?: string;
  subtitle?: string;
}

export const generatePdfReport = async (
  projects: Project[],
  milestones: TimelineMilestone[] = [],
  items: ProjectItem[] = [],
  config: ReportConfig = {},
  photos: Drawing[] = []
) => {
  // Initialize sections array to store all sections before rendering
  let documentSections = [];
  
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
    <hr style="margin-bottom: 20px; border: none; height: 1px; background-color: #e2e8f0;">
  `;
  documentSections.push({ element: header, priority: 1 });
  
  // For single project reports, show detailed information
  if (projects.length === 1) {
    const project = projects[0];
    const projectDetailSection = document.createElement('div');
    projectDetailSection.innerHTML = `
      <div style="display: flex; margin-bottom: 30px; margin-top: 10px;">
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
    documentSections.push({ element: projectDetailSection, priority: 2 });
  }
  
  // PREPARE THE PHOTOS SECTION WITH HIGHEST PRIORITY
  if (config.includePhotos && photos.length > 0) {
    const maxPhotos = config.maxPhotos || 7;
    const sortedPhotos = [...photos]
      .filter(photo => photo.type === 'Photo')
      .sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime())
      .slice(0, maxPhotos);
    
    if (sortedPhotos.length > 0) {
      const photoSectionPromise = new Promise(async (resolve) => {
        try {
          // Create photos section
          const photosSection = document.createElement('div');
          photosSection.className = 'photos-section';
          photosSection.style.marginTop = '10px';
          photosSection.style.marginBottom = '30px';
          photosSection.innerHTML = `
            <h2 style="color: #334155; margin-top: 10px; margin-bottom: 15px; font-size: 22px; font-weight: bold;">Latest Progress Photos</h2>
            <p style="color: #64748b; margin-top: 0; margin-bottom: 15px; font-size: 16px;">Displaying the ${sortedPhotos.length} most recent project photos</p>
          `;
          
          // Preload images
          const preloadedImages = [];
          
          for (const photo of sortedPhotos) {
            try {
              const imageUrl = await getStorageUrl('project-photos', photo.storage_path);
              console.log(`Loading image: ${photo.name}`);
              
              // Try to load image with retries
              let dataUrl = null;
              let retries = 0;
              const maxRetries = 2;
              
              while (retries <= maxRetries && !dataUrl) {
                try {
                  const response = await fetch(imageUrl, { 
                    mode: 'cors',
                    cache: 'force-cache'
                  });
                  
                  if (response.ok) {
                    const blob = await response.blob();
                    dataUrl = await new Promise((resolve) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result as string);
                      reader.readAsDataURL(blob);
                    });
                  } else {
                    console.warn(`Fetch failed (${response.status}), retry ${retries+1}/${maxRetries+1}`);
                  }
                } catch (error) {
                  console.error(`Error in retry ${retries+1}:`, error);
                }
                
                retries++;
                if (!dataUrl && retries <= maxRetries) {
                  // Wait a bit before retrying
                  await new Promise(r => setTimeout(r, 300));
                }
              }
              
              preloadedImages.push({
                photo,
                dataUrl,
                loaded: !!dataUrl
              });
            } catch (error) {
              console.error(`Failed to load image: ${photo.name}`, error);
              preloadedImages.push({
                photo,
                dataUrl: null,
                loaded: false
              });
            }
          }
          
          // Create photo table
          const photoTable = document.createElement('table');
          photoTable.setAttribute('cellspacing', '0');
          photoTable.setAttribute('cellpadding', '10');
          photoTable.style.width = '100%';
          photoTable.style.borderCollapse = 'separate';
          photoTable.style.borderSpacing = '15px';
          
          let currentRow = null;
          
          preloadedImages.forEach((item, index) => {
            if (index % 2 === 0) {
              currentRow = document.createElement('tr');
              photoTable.appendChild(currentRow);
            }
            
            const cell = document.createElement('td');
            cell.style.width = '50%';
            cell.style.verticalAlign = 'top';
            
            const photoCard = document.createElement('div');
            photoCard.style.border = '1px solid #e2e8f0';
            photoCard.style.borderRadius = '8px';
            photoCard.style.overflow = 'hidden';
            photoCard.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            
            if (item.loaded && item.dataUrl) {
              photoCard.innerHTML = `
                <div style="width: 100%; height: 160px; overflow: hidden; background-color: #f1f5f9;">
                  <img 
                    src="${item.dataUrl}" 
                    alt="${item.photo.name}" 
                    style="width: 100%; height: 100%; object-fit: cover; display: block;"
                  />
                </div>
                <div style="padding: 12px; background-color: white;">
                  <div style="font-weight: bold; color: #334155; margin-bottom: 6px; font-size: 14px; overflow: hidden; text-overflow: ellipsis;">
                    ${item.photo.name}
                  </div>
                  <div style="font-size: 12px; color: #64748b;">
                    <span>${item.photo.category || 'Progress Photos'}</span> • 
                    <span>Uploaded: ${new Date(item.photo.upload_date).toLocaleDateString()}</span>
                  </div>
                </div>
              `;
            } else {
              photoCard.innerHTML = `
                <div style="width: 100%; height: 160px; background-color: #f8fafc; display: flex; justify-content: center; align-items: center;">
                  <div style="text-align: center;">
                    <div style="font-size: 14px; color: #ef4444;">Failed to load image</div>
                  </div>
                </div>
                <div style="padding: 12px; background-color: white;">
                  <div style="font-weight: bold; color: #334155; margin-bottom: 6px; font-size: 14px; overflow: hidden; text-overflow: ellipsis;">
                    ${item.photo.name}
                  </div>
                  <div style="font-size: 12px; color: #64748b;">
                    <span>${item.photo.category || 'Progress Photos'}</span> • 
                    <span>Uploaded: ${new Date(item.photo.upload_date).toLocaleDateString()}</span>
                  </div>
                </div>
              `;
            }
            
            cell.appendChild(photoCard);
            currentRow.appendChild(cell);
            
            // If we have an odd number of photos and this is the last one, add an empty cell
            if (index === preloadedImages.length - 1 && preloadedImages.length % 2 !== 0) {
              const emptyCell = document.createElement('td');
              emptyCell.style.width = '50%';
              currentRow.appendChild(emptyCell);
            }
          });
          
          photosSection.appendChild(photoTable);
          resolve({ element: photosSection, priority: 3 });
        } catch (error) {
          console.error('Error creating photos section:', error);
          const errorSection = document.createElement('div');
          errorSection.innerHTML = `
            <h2 style="color: #334155; margin-top: 30px; margin-bottom: 15px; font-size: 22px;">Latest Progress Photos</h2>
            <div style="padding: 20px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; margin-bottom: 30px;">
              <p style="color: #ef4444; margin: 0;">There was an error loading the project photos. Please try again later.</p>
            </div>
          `;
          resolve({ element: errorSection, priority: 3 });
        }
      });
      
      // Store the promise in the sections array
      documentSections.push(photoSectionPromise);
    }
  }
  
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
    documentSections.push({ element: summarySection, priority: 4 });
  }
  
  // Check if visualizations should be included and if they exist
  let hasVisualizations = false;
  if (config.includeProgress || config.includeStatus) {
    const chartSection = document.createElement('div');
    chartSection.innerHTML = '<h2 style="color: #334155; margin-top: 30px; margin-bottom: 15px;">Project Visualizations</h2>';
    
    let hasContent = false;
    
    if (config.includeProgress && document.querySelector('[data-report-chart="progress"]')) {
      const progressChartClone = document.querySelector('[data-report-chart="progress"]')?.cloneNode(true) as HTMLElement;
      if (progressChartClone) {
        progressChartClone.classList.add('page-break-avoid');
        chartSection.appendChild(progressChartClone);
        hasContent = true;
      }
    }
    
    if (config.includeStatus && document.querySelector('[data-report-chart="status"]')) {
      const statusChartClone = document.querySelector('[data-report-chart="status"]')?.cloneNode(true) as HTMLElement;
      if (statusChartClone) {
        statusChartClone.classList.add('page-break-avoid');
        chartSection.appendChild(statusChartClone);
        hasContent = true;
      }
    }
    
    // Only add the visualization section if it has actual content
    if (hasContent) {
      hasVisualizations = true;
      documentSections.push({ element: chartSection, priority: 5 });
    }
  }
  
  // Add timeline section if requested
  if (config.includeTimeline && milestones.length > 0) {
    const timelineSection = document.createElement('div');
    timelineSection.className = 'timeline-section';
    
    // Force the section to start on a new page
    timelineSection.style.pageBreakBefore = 'always';
    timelineSection.style.pageBreakInside = 'avoid';
    timelineSection.style.marginTop = '0';
    timelineSection.style.paddingTop = '0';
    
    // Wrap everything in a single container for better page break control
    const timelineWrapper = document.createElement('div');
    timelineWrapper.style.pageBreakInside = 'avoid';
    timelineWrapper.style.display = 'block';
    timelineWrapper.className = 'page-break-avoid';
    
    // Create timeline header
    const timelineHeader = document.createElement('h2');
    timelineHeader.style.color = '#334155';
    timelineHeader.style.marginTop = '10px';
    timelineHeader.style.marginBottom = '15px';
    timelineHeader.style.pageBreakAfter = 'avoid';
    timelineHeader.style.fontSize = '20px';
    timelineHeader.textContent = 'Project Timeline';
    
    // Create timeline table
    const timelineTable = document.createElement('table');
    timelineTable.style.width = '100%';
    timelineTable.style.borderCollapse = 'collapse';
    timelineTable.style.marginTop = '10px';
    timelineTable.style.marginBottom = '20px';
    
    // Create table head
    const tableHead = document.createElement('thead');
    tableHead.innerHTML = `
      <tr style="background-color: #f8fafc;">
        <th style="text-align: left; padding: 12px 15px; border: 1px solid #e2e8f0; font-weight: 600;">Milestone</th>
        <th style="text-align: left; padding: 12px 15px; border: 1px solid #e2e8f0; font-weight: 600;">Planned Date</th>
        <th style="text-align: left; padding: 12px 15px; border: 1px solid #e2e8f0; font-weight: 600;">Actual Date</th>
        <th style="text-align: left; padding: 12px 15px; border: 1px solid #e2e8f0; font-weight: 600;">Status</th>
        <th style="text-align: left; padding: 12px 15px; border: 1px solid #e2e8f0; font-weight: 600;">Variance</th>
      </tr>
    `;
    
    // Create table body
    const tableBody = document.createElement('tbody');
    tableBody.innerHTML = milestones.map(milestone => {
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
          <td style="padding: 12px 15px; border: 1px solid #e2e8f0;">${milestone.name}</td>
          <td style="padding: 12px 15px; border: 1px solid #e2e8f0;">${plannedDate.toLocaleDateString()}</td>
          <td style="padding: 12px 15px; border: 1px solid #e2e8f0;">${actualDate ? actualDate.toLocaleDateString() : 'Not Completed'}</td>
          <td style="padding: 12px 15px; border: 1px solid #e2e8f0;">
            <div style="
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
              font-weight: bold;
            ">${milestone.status}</div>
          </td>
          <td style="padding: 12px 15px; border: 1px solid #e2e8f0; ${variance > 0 ? 'color: #ef4444; font-weight: bold;' : variance < 0 ? 'color: #22c55e; font-weight: bold;' : ''}">
            ${varianceText}
          </td>
        </tr>
      `;
    }).join('');
    
    // Assemble the table
    timelineTable.appendChild(tableHead);
    timelineTable.appendChild(tableBody);
    
    // Add any charts if they exist
    if (document.querySelector('[data-report-chart="timeline"]')) {
      const timelineChartClone = document.querySelector('[data-report-chart="timeline"]')?.cloneNode(true) as HTMLElement;
      if (timelineChartClone) {
        timelineChartClone.classList.add('page-break-avoid');
        
        // Add chart after assembling table components
        timelineWrapper.appendChild(timelineHeader);
        timelineWrapper.appendChild(timelineTable);
        timelineWrapper.appendChild(timelineChartClone);
      } else {
        // No chart, just add header and table
        timelineWrapper.appendChild(timelineHeader);
        timelineWrapper.appendChild(timelineTable);
      }
    } else {
      // No chart, just add header and table
      timelineWrapper.appendChild(timelineHeader);
      timelineWrapper.appendChild(timelineTable);
    }
    
    // Add the wrapper to the section
    timelineSection.appendChild(timelineWrapper);
    
    // Add to document sections with priority that ensures proper placement
    documentSections.push({ element: timelineSection, priority: 5.5 });
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
        <div style="margin-bottom: 30px;" class="page-break-avoid">
          <h3 style="color: #334155; margin-bottom: 10px; font-size: 16px; page-break-after: avoid;">${category}</h3>
          <table style="width: 100%; border-collapse: collapse; page-break-inside: avoid;">
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
    
    documentSections.push({ element: itemsSection, priority: 7 });
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
    
    documentSections.push({ element: recommendationsSection, priority: 8 });
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
  documentSections.push({ element: footer, priority: 9 });
  
  // Create container
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.style.fontFamily = 'Arial, sans-serif';
  document.body.appendChild(container);
  
  // Add global styles for proper page breaks
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      .page-break-avoid {
        page-break-inside: avoid !important;
      }
      
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid !important;
      }
      
      table {
        page-break-inside: avoid !important;
      }
      
      img {
        max-width: 100%;
        page-break-inside: avoid !important;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Generate PDF options
  const opt = {
    margin: [20, 20, 20, 20],
    filename: `${config.title || 'project-report'}-${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      allowTaint: true,
      letterRendering: true,
      scrollX: 0,
      scrollY: 0
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait',
      hotfixes: ['px_scaling'],
      compress: true
    },
    pagebreak: { 
      mode: ['avoid-all', 'css', 'legacy'],
      avoid: [
        'img', 
        'table', 
        'tr', 
        'th',
        '.page-break-avoid',
        'div.page-break-avoid'
      ]
    }
  };
  
  // Resolve all section promises and sort by priority
  const resolveSections = async () => {
    const resolvedSections = [];
    
    for (const section of documentSections) {
      if (section instanceof Promise) {
        resolvedSections.push(await section);
      } else {
        resolvedSections.push(section);
      }
    }
    
    // Sort by priority (lower number = higher priority)
    return resolvedSections.sort((a, b) => a.priority - b.priority);
  };
  
  // Assemble the document and generate the PDF
  (async () => {
    try {
      console.log('Assembling document sections...');
      const sortedSections = await resolveSections();
      
      // Add sections to container in priority order
      sortedSections.forEach(section => {
        container.appendChild(section.element);
      });
      
      // Generate PDF
      console.log('Starting PDF generation...');
      await html2pdf().from(container).set(opt).save();
      console.log('PDF generated successfully');
      document.body.removeChild(container);
    } catch (error) {
      console.error('Error generating PDF:', error);
      document.body.removeChild(container);
    }
  })();
};
