import { Invoice, Project, ProjectItem, TimelineMilestone } from '@/lib/types';

export type RiskLevel = 'low' | 'medium' | 'high';
export type StatusHealth = 'on_track' | 'needs_attention' | 'at_risk';

interface ProjectHealthArgs {
  project: Project;
  items?: ProjectItem[];
  invoices?: Invoice[];
  milestones?: TimelineMilestone[];
  now?: Date;
}

export interface ProjectHealthSummary {
  pendingItems: number;
  pendingInvoices: number;
  delayedMilestones: number;
  isBehindSchedule: boolean;
  isAtRisk: boolean;
  needsAttention: boolean;
  riskLevel: RiskLevel;
  statusHealth: StatusHealth;
  staleUpdateDays: number | null;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const isMilestoneDelayed = (milestone: TimelineMilestone, now: Date) => {
  const plannedDate = milestone.planned_date ? new Date(milestone.planned_date) : null;
  if (milestone.status === 'Delayed') {
    return true;
  }
  return !!plannedDate && plannedDate < now && milestone.status !== 'Completed';
};

const getStaleUpdateDays = (updatedAt: string | undefined, now: Date) => {
  if (!updatedAt) return null;
  const updatedDate = new Date(updatedAt);
  if (Number.isNaN(updatedDate.getTime())) return null;
  const diff = now.getTime() - updatedDate.getTime();
  return Math.floor(diff / MS_PER_DAY);
};

export const getProjectHealthSummary = ({
  project,
  items = [],
  invoices = [],
  milestones = [],
  now = new Date(),
}: ProjectHealthArgs): ProjectHealthSummary => {
  const pendingItems = items.filter(
    (item) => item.status === 'Not Ordered' || item.status === 'Partially Ordered'
  ).length;
  const pendingInvoices = invoices.filter((invoice) => invoice.status === 'Submitted').length;
  const delayedMilestones = milestones.filter((milestone) => isMilestoneDelayed(milestone, now)).length;

  const staleUpdateDays = getStaleUpdateDays(project.updated_at, now);
  const hasStaleUpdate = staleUpdateDays !== null && staleUpdateDays >= 14;

  const isBehindSchedule = delayedMilestones > 0 || project.status === 'Delayed';

  const isAtRisk =
    project.status === 'Delayed' ||
    (isBehindSchedule && project.progress < 70) ||
    project.progress < 20;

  const needsAttention =
    !isAtRisk &&
    (pendingItems > 0 ||
      pendingInvoices > 0 ||
      hasStaleUpdate ||
      project.status === 'On Hold' ||
      project.progress < 30);

  const riskLevel: RiskLevel = isAtRisk ? 'high' : needsAttention ? 'medium' : 'low';
  const statusHealth: StatusHealth =
    riskLevel === 'high' ? 'at_risk' : riskLevel === 'medium' ? 'needs_attention' : 'on_track';

  return {
    pendingItems,
    pendingInvoices,
    delayedMilestones,
    isBehindSchedule,
    isAtRisk,
    needsAttention,
    riskLevel,
    statusHealth,
    staleUpdateDays,
  };
};
