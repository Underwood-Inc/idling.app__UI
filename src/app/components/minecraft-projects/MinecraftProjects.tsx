'use client';

import { LucideIcon } from '@molecules/lucide/LucideIcon';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { FolderGit2, Gamepad2, Package, Store } from 'lucide';
import './MinecraftProjects.css';

interface MinecraftProject {
  title: string;
  description: string;
  type: 'Datapack' | 'Modpack' | 'Mod' | 'Server' | 'Datapack + Resource Pack' | 'Paper Plugin';
  modrinthUrl?: string;
  builtByBitUrl?: string;
  githubUrl?: string;
  modsHubUrl?: string;
  features?: string[];
}

const projects: MinecraftProject[] = [
  {
    title: 'Compressy',
    description:
      'Infinite block compression for Minecraft 26.2+ as a Paper plugin. Legacy Fabric builds remain on Modrinth for older versions.',
    type: 'Paper Plugin',
    builtByBitUrl: 'https://builtbybit.com/resources/compressy.114802/',
    modrinthUrl: 'https://modrinth.com/mod/compressy',
    modsHubUrl: 'https://mods.idling.app/compressy',
    githubUrl: 'https://github.com/Underwood-Inc/compressy',
    features: [
      'Infinite Compression',
      'Works with ALL Blocks',
      'Up to 32 Tiers',
      'Automation Friendly',
    ],
  },
  {
    title: 'Offerings',
    description:
      'Premium daily kit lottery for Paper/Spigot with weighted tiers, streaks, milestones, achievements, and full in-game admin.',
    type: 'Paper Plugin',
    builtByBitUrl: 'https://builtbybit.com/resources/offerings.115060/',
    features: [
      'Weighted Daily Lottery',
      'Streaks & Achievements',
      'In-Game Admin Hub',
      'LuckPerms Integration',
    ],
  },
  {
    title: 'Rituals',
    description:
      'A mystical datapack that brings ritual magic and totems into Minecraft. Craft totems, display items, and trigger powerful effects through immersive rituals.',
    type: 'Datapack',
    modrinthUrl: 'https://modrinth.com/datapack/totem-rituals',
    githubUrl: 'https://github.com/Underwood-Inc/rituals',
    modsHubUrl: 'https://mods.idling.app/rituals',
    features: [
      '8 Unique Rituals',
      '6 Totem Tiers (Wood to Netherite)',
      'Fire Sacrifice System',
      'Visual Pattern Guides',
      'Custom Textures & Animations',
      'Fully Configurable',
    ],
  },
  {
    title: 'Trials of the Wild',
    description:
      'Hardcore survival modpack with ~250 exploration, magic, combat, and world-overhaul mods. Includes Rituals for totem magic and Compressy for massive block storage.',
    type: 'Modpack',
    modrinthUrl: 'https://modrinth.com/modpack/strixun-trials-of-the-wild',
    modsHubUrl: 'https://mods.idling.app/modpack-trials-of-the-wild',
    features: [
      'Performance Optimized',
      'Quality of Life Mods',
      'New Content & Mechanics',
      'Balanced Gameplay',
      'Regular Updates',
    ],
  },
  {
    title: 'Alloys',
    description:
      'Ten fantasy metals for Minecraft 26.2+ with bonus ore drops, full toolsets and armor, and additive vanilla-friendly progression.',
    type: 'Datapack + Resource Pack',
    modrinthUrl: 'https://modrinth.com/datapack/s-alloys',
    githubUrl: 'https://github.com/Underwood-Inc/s-alloys',
    features: [
      '10 Fantasy Metals',
      'Additive to Vanilla',
      'Full Toolsets & Armor',
      'Optional Paper Plugin',
    ],
  },
  {
    title: 'Tally',
    description:
      'Survival completion advancement pack with 10,255 pages across six tabs, hold tiers, and live reward policy toggles for server owners.',
    type: 'Datapack',
    modrinthUrl: 'https://modrinth.com/datapack/tally',
    features: [
      '10,255 Advancement Pages',
      'Six Completion Tabs',
      'Live Reward Policy',
      'Tally Keeper Voice',
    ],
  },
  {
    title: 'Shirecraft',
    description:
      'Whitelist Paper 26.2 survival server with custom plugins, datapacks, and community towns. Join Discord to self-whitelist.',
    type: 'Server',
    modrinthUrl: 'https://modrinth.com/server/shirecraft',
    features: [
      'Whitelist Survival',
      'Lands & Nations',
      'Custom Plugins',
      'mc.idling.app:25567',
    ],
  },
];

export function MinecraftProjects() {
  return (
    <div className="minecraft-projects">
      <div className="minecraft-projects__header">
        <h3 className="minecraft-projects__title">
          <SiteIcon id="gamepad" className="minecraft-projects__title-icon" sizeRem={1.25} />
          Minecraft Projects
        </h3>
        <p className="minecraft-projects__subtitle">
          Custom datapacks, mods, plugins, modpacks, and servers for Minecraft
        </p>
      </div>

      <div className="minecraft-projects__grid">
        {projects.map((project) => (
          <div key={project.title} className="minecraft-project">
            <div className="minecraft-project__header">
              <div className="minecraft-project__title-row">
                <h4 className="minecraft-project__title">{project.title}</h4>
                <span className="minecraft-project__type">{project.type}</span>
              </div>
            </div>

            <p className="minecraft-project__description">{project.description}</p>

            {project.features && (
              <div className="minecraft-project__features">
                <h5 className="minecraft-project__features-title">Key Features:</h5>
                <ul className="minecraft-project__features-list">
                  {project.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="minecraft-project__links">
              {project.builtByBitUrl && (
                <a
                  href={project.builtByBitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="minecraft-project__link minecraft-project__link--modrinth"
                >
                  <LucideIcon icon={Store} sizeRem={1} className="minecraft-project__link-icon" />
                  BuiltByBit
                </a>
              )}
              {project.modrinthUrl && (
                <a
                  href={project.modrinthUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="minecraft-project__link minecraft-project__link--modrinth"
                >
                  <LucideIcon icon={Package} sizeRem={1} className="minecraft-project__link-icon" />
                  View on Modrinth
                </a>
              )}
              {project.modsHubUrl && (
                <a
                  href={project.modsHubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="minecraft-project__link minecraft-project__link--modrinth"
                >
                  <LucideIcon icon={Gamepad2} sizeRem={1} className="minecraft-project__link-icon" />
                  Mods Hub
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="minecraft-project__link minecraft-project__link--github"
                >
                  <LucideIcon icon={FolderGit2} sizeRem={1} className="minecraft-project__link-icon" />
                  View on GitHub
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="minecraft-projects__footer">
        <p className="minecraft-projects__footer-text">
          Modrinth listings show live download and follower stats where available. BuiltByBit plugins
          are premium — purchase metrics stay on the marketplace.
        </p>
      </div>
    </div>
  );
}
