import { Project, TimelineMilestone } from '@/lib/types';

export type ProjectHealthTone = 'good' | 'warn' | 'risk';

export interface ProjectHealth {
  label: string;
  tone: ProjectHealthTone;
  reason: string;
}

const DAYS_STALE_THRESHOLD = 14;
const WARN_BEHIND_PERCENT = 15;
const RISK_BEHIND_PERCENT = 30;

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const getExpectedProgress = (project: Project) => {
  if (!project.start_date || !project.end_date) {
    return null;
  }

  const start = new Date(project.start_date);
  const end = new Date(project.end_date);
  const today = new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }

  if (today <= start) {
    return 0;
  }

  if (today >= end) {
    return 100;
  }

  const elapsed = today.getTime() - start.getTime();
  const total = end.getTime() - start.getTime();
  return clamp(Math.round((elapsed / total) * 100));
};

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

  const expectedProgress = getExpectedProgress(project);
  if (expectedProgress !== null) {
    if (expectedProgress === 100 && project.progress < 100) {
      return {
        label: 'At Risk',
        tone: 'risk',
        reason: 'End date has passed but progress is not complete.',
      };
    }

    const behindBy = expectedProgress - project.progress;
    if (behindBy >= RISK_BEHIND_PERCENT) {
      return {
        label: 'At Risk',
        tone: 'risk',
        reason: `Progress is ${behindBy}% behind schedule.`,
      };
    }
    if (behindBy >= WARN_BEHIND_PERCENT) {
      return {
        label: 'Needs Attention',
        tone: 'warn',
        reason: `Progress is ${behindBy}% behind schedule.`,
      };
    }
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
