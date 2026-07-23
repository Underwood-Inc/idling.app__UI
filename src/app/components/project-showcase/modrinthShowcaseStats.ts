import { PROJECT_SHOWCASE_MODRINTH_PROJECTS } from './projectShowcaseProjects';

const MODRINTH_USER_AGENT = 'idling.app/1.0 (https://github.com/Underwood-Inc)';

export interface ModrinthContentMetrics {
  kind: 'content';
  downloads: number;
  followers: number;
}

export interface ModrinthServerMetrics {
  kind: 'server';
  followers: number;
  playersOnline: number;
  playersMax: number;
  verifiedPlays2w: number;
  regionLabel?: string;
  versionName?: string;
}

export type ModrinthProjectMetrics = ModrinthContentMetrics | ModrinthServerMetrics;

export type ModrinthMetricsByProjectId = Record<string, ModrinthProjectMetrics>;

interface ModrinthV3ProjectResponse {
  downloads?: number;
  followers?: number;
  project_types?: string[];
  minecraft_server?: {
    region?: string;
  };
  minecraft_java_server?: {
    verified_plays_2w?: number;
    ping?: {
      data?: {
        players_online?: number;
        players_max?: number;
        version_name?: string;
      };
    };
  };
}

const REGION_LABELS: Record<string, string> = {
  us_east: 'US East',
  us_west: 'US West',
  eu_central: 'EU Central',
  eu_west: 'EU West',
  asia: 'Asia',
  oceania: 'Oceania',
};

export function formatModrinthCount(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return `${num}`;
}

function parseModrinthV3Project(data: ModrinthV3ProjectResponse): ModrinthProjectMetrics | null {
  const followers = data.followers ?? 0;
  const isServer = data.project_types?.includes('minecraft_java_server');

  if (isServer) {
    const ping = data.minecraft_java_server?.ping?.data;

    return {
      kind: 'server',
      followers,
      playersOnline: ping?.players_online ?? 0,
      playersMax: ping?.players_max ?? 0,
      verifiedPlays2w: data.minecraft_java_server?.verified_plays_2w ?? 0,
      regionLabel: data.minecraft_server?.region
        ? REGION_LABELS[data.minecraft_server.region] ?? data.minecraft_server.region
        : undefined,
      versionName: ping?.version_name,
    };
  }

  return {
    kind: 'content',
    downloads: data.downloads ?? 0,
    followers,
  };
}

export async function fetchModrinthShowcaseMetrics(): Promise<ModrinthMetricsByProjectId> {
  const results = await Promise.all(
    PROJECT_SHOWCASE_MODRINTH_PROJECTS.map(async (project) => {
      try {
        const response = await fetch(`https://api.modrinth.com/v3/project/${project.modrinthId}`, {
          headers: {
            'User-Agent': MODRINTH_USER_AGENT,
            'X-Background-Request': 'true',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          return { id: project.id, metrics: null };
        }

        const data = (await response.json()) as ModrinthV3ProjectResponse;
        return { id: project.id, metrics: parseModrinthV3Project(data) };
      } catch {
        return { id: project.id, metrics: null };
      }
    })
  );

  const metrics: ModrinthMetricsByProjectId = {};

  for (const result of results) {
    if (result.metrics) {
      metrics[result.id] = result.metrics;
    }
  }

  return metrics;
}
