import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Snag, Project, SnagStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface SnagsReportProps {
  snags: Snag[];
  projects: Project[];
  onViewProject?: (projectId: string) => void;
}

const statusOptions: SnagStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

const getStatusColor = (status: SnagStatus) => {
  switch (status) {
    case 'Open':
      return 'bg-rose-500';
    case 'In Progress':
      return 'bg-amber-500';
    case 'Resolved':
      return 'bg-blue-500';
    case 'Closed':
      return 'bg-emerald-500';
    default:
      return 'bg-gray-400';
  }
};

const SnagsReport: React.FC<SnagsReportProps> = ({ snags, projects, onViewProject }) => {
  const projectMap = useMemo(() => {
    return new Map(projects.map((project) => [project.id, project]));
  }, [projects]);

  const summaryCounts = useMemo(() => {
    const counts = statusOptions.reduce<Record<SnagStatus, number>>((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<SnagStatus, number>);

    snags.forEach((snag) => {
      counts[snag.status] += 1;
    });

    return counts;
  }, [snags]);

  const sortedSnags = useMemo(() => {
    return [...snags].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [snags]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusOptions.map((status) => (
          <Card key={status}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{status} Snags</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold">{summaryCounts[status]}</div>
              <span className={`inline-flex h-3 w-3 rounded-full ${getStatusColor(status)}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            Snags Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                <TableHead>Snag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSnags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No snags found for the selected projects.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedSnags.map((snag) => {
                    const project = projectMap.get(snag.project_id);
                    return (
                      <TableRow key={snag.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {project?.name || 'Unknown Project'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {project?.location || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">{snag.title}</div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {snag.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(snag.status)} text-white`}>
                            {snag.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {snag.scope}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {snag.created_at ? new Date(snag.created_at).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {onViewProject ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewProject(snag.project_id)}
                            >
                              View Project
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SnagsReport;
