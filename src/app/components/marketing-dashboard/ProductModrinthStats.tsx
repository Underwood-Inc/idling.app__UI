'use client';

import { useEffect, useState } from 'react';
import { ProjectShowcaseMetrics } from '../project-showcase/ProjectShowcaseMetrics';
import {
  fetchModrinthShowcaseMetrics,
  type ModrinthMetricsByProjectId,
} from '../project-showcase/modrinthShowcaseStats';

export interface ProductModrinthStatsProps {
  projectId: string;
}

export function ProductModrinthStats({ projectId }: ProductModrinthStatsProps) {
  const [metrics, setMetrics] = useState<ModrinthMetricsByProjectId | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchModrinthShowcaseMetrics()
      .then((next) => {
        if (!cancelled) {
          setMetrics(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMetrics(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <ProjectShowcaseMetrics
      metrics={metrics?.[projectId]}
      modrinthMetricsNote={undefined}
    />
  );
}