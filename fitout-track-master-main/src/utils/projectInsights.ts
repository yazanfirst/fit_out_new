import { Project, TimelineMilestone } from '@/lib/types';

export type ProjectHealthTone = 'good' | 'warn' | 'risk';

export interface ProjectHealth {
  label: string;
  tone: ProjectHealthTone;
  reason: string;
}

const DAYS_STALE_THRESHOLD = 14;

export const getProjectHealth = (
  project: Project,
  milestones: TimelineMilestone[] = []
): ProjectHealth => {
  if (project.status === 'Delayed') {
    return {
      label: 'At Risk',
      tone: 'risk',
      reason: 'Project status is delayed.',
    };
  }

  const hasOverdueMilestones = milestones.some(
    (milestone) =>
      milestone.status !== 'Completed' &&
      new Date(milestone.planned_date) < new Date()
  );

  if (hasOverdueMilestones) {
    return {
      label: 'At Risk',
      tone: 'risk',
      reason: 'Overdue milestones need attention.',
    };
  }

  if (project.progress < 30) {
    return {
      label: 'Needs Attention',
      tone: 'warn',
      reason: 'Progress is below 30%.',
    };
  }

  const lastUpdated = new Date(project.updated_at);
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - DAYS_STALE_THRESHOLD);

  if (lastUpdated < staleDate) {
    return {
      label: 'Needs Attention',
      tone: 'warn',
      reason: 'Project has not been updated recently.',
    };
  }

  return {
    label: 'On Track',
    tone: 'good',
    reason: 'Progress and schedule look healthy.',
  };
};
