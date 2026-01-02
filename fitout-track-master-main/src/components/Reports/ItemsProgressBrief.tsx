import React, { useMemo } from 'react';
import { PackageCheck } from 'lucide-react';
import { Project, ProjectItem } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ItemsProgressBriefProps {
  projects: Project[];
  items: ProjectItem[];
}

const ItemsProgressBrief: React.FC<ItemsProgressBriefProps> = ({ projects, items }) => {
  const summary = useMemo(() => {
    const grouped = new Map<string, ProjectItem[]>();
    items.forEach((item) => {
      if (!grouped.has(item.project_id)) {
        grouped.set(item.project_id, []);
      }
      grouped.get(item.project_id)?.push(item);
    });

    return projects.map((project) => {
      const projectItems = grouped.get(project.id) || [];
      const installedCount = projectItems.filter((item) => item.status === 'Installed').length;
      const totalCount = projectItems.length;
      const completionRate = totalCount > 0 ? Math.round((installedCount / totalCount) * 100) : 0;
      const statusLabel =
        completionRate >= 80 ? 'On Track' : completionRate >= 50 ? 'Needs Attention' : 'At Risk';

      return {
        project,
        totalCount,
        installedCount,
        completionRate,
        statusLabel,
      };
    });
  }, [projects, items]);

  const getStatusTone = (status: string) => {
    switch (status) {
      case 'On Track':
        return 'bg-emerald-500';
      case 'Needs Attention':
        return 'bg-amber-500';
      case 'At Risk':
        return 'bg-rose-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-emerald-600" />
          Brief Items Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Total Items</TableHead>
                <TableHead>Installed</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No projects available for this report.
                  </TableCell>
                </TableRow>
              ) : (
                summary.map(({ project, totalCount, installedCount, completionRate, statusLabel }) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{project.name}</div>
                      <div className="text-sm text-muted-foreground">{project.location}</div>
                    </TableCell>
                    <TableCell>{totalCount}</TableCell>
                    <TableCell>{installedCount}</TableCell>
                    <TableCell>{completionRate}%</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusTone(statusLabel)} text-white`}>
                        {statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemsProgressBrief;
