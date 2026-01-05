import React, { useMemo } from 'react';
import { Download, PackageCheck } from 'lucide-react';
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
import { Button } from '@/components/ui/button';

interface ItemsProgressBriefProps {
  projects: Project[];
  items: ProjectItem[];
  onExport?: () => void;
  onExportProject?: (projectId: string) => void;
}

const ItemsProgressBrief: React.FC<ItemsProgressBriefProps> = ({
  projects,
  items,
  onExport,
  onExportProject,
}) => {
  const groupedByProject = useMemo(() => {
    const grouped = new Map<string, ProjectItem[]>();
    items.forEach((item) => {
      if (!grouped.has(item.project_id)) {
        grouped.set(item.project_id, []);
      }
      grouped.get(item.project_id)?.push(item);
    });

    return projects.map((project) => {
      const projectItems = grouped.get(project.id) || [];
      return {
        project,
        ownerItems: projectItems.filter((item) => item.scope === 'Owner'),
        contractorItems: projectItems.filter((item) => item.scope === 'Contractor'),
      };
    });
  }, [projects, items]);

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-emerald-600" />
          Brief Items Progress
        </CardTitle>
        {onExport ? (
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          A concise view of owner and contractor items, grouped by project for quick review.
        </p>
        {groupedByProject.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No projects available for this report.
          </div>
        ) : (
          groupedByProject.map(({ project, ownerItems, contractorItems }) => (
            <div key={project.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{project.name}</div>
                  <div className="text-sm text-muted-foreground">{project.location}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-slate-900 text-white w-fit">
                    Updated {new Date(project.updated_at).toLocaleDateString()}
                  </Badge>
                  {onExportProject ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onExportProject(project.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Project PDF
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Owner Items</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>LPO</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ownerItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                              No owner items for this project.
                            </TableCell>
                          </TableRow>
                        ) : (
                          ownerItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium text-gray-900">{item.name}</TableCell>
                              <TableCell>{item.category}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                <Badge className="bg-gray-800 text-white">{item.status}</Badge>
                              </TableCell>
                              <TableCell>{item.company || '—'}</TableCell>
                              <TableCell>{item.lpo_status}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Contractor Items</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Work</TableHead>
                          <TableHead>Completion</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Company</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contractorItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                              No contractor items for this project.
                            </TableCell>
                          </TableRow>
                        ) : (
                          contractorItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium text-gray-900">{item.name}</TableCell>
                              <TableCell>{item.category}</TableCell>
                              <TableCell className="max-w-[220px] truncate" title={item.workDescription || ''}>
                                {item.workDescription || '—'}
                              </TableCell>
                              <TableCell>{item.completionPercentage || 0}%</TableCell>
                              <TableCell>
                                <Badge className="bg-gray-800 text-white">{item.status}</Badge>
                              </TableCell>
                              <TableCell>{item.company || '—'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ItemsProgressBrief;
