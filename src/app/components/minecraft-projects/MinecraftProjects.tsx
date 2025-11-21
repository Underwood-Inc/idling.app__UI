'use client';

import { FaGithub } from 'react-icons/fa';
import { SiModrinth } from 'react-icons/si';
import './MinecraftProjects.css';

interface MinecraftProject {
  title: string;
  description: string;
  type: 'Datapack' | 'Modpack' | 'Mod';
  modrinthUrl?: string;
  githubUrl?: string;
  features?: string[];
  downloads?: string;
}

const projects: MinecraftProject[] = [
  {
    title: 'Rituals',
    description:
      'A mystical datapack that brings ritual magic and totems into Minecraft. Craft totems, display items, and trigger powerful effects through immersive rituals.',
    type: 'Datapack',
    modrinthUrl: 'https://modrinth.com/datapack/totem-rituals',
    githubUrl: 'https://github.com/Underwood-Inc/rituals',
    downloads: '580+',
    features: [
      '8 Unique Rituals',
      '6 Totem Tiers (Wood to Netherite)',
      'Fire Sacrifice System',
      'Visual Pattern Guides',
      'Custom Textures & Animations',
      'Fully Configurable'
    ]
  },
  {
    title: 'Strixun Pack A',
    description:
      'A carefully curated modpack designed to enhance your Minecraft experience with quality-of-life improvements, new content, and performance optimizations.',
    type: 'Modpack',
    modrinthUrl: 'https://modrinth.com/modpack/strixun-pack-a',
    features: [
      'Performance Optimized',
      'Quality of Life Mods',
      'New Content & Mechanics',
      'Balanced Gameplay',
      'Regular Updates'
    ]
  }
];

export function MinecraftProjects() {
  return (
    <div className="minecraft-projects">
      <div className="minecraft-projects__header">
        <h3 className="minecraft-projects__title">🎮 Minecraft Projects</h3>
        <p className="minecraft-projects__subtitle">
          Custom datapacks, mods, and modpacks for Minecraft
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
              {project.downloads && (
                <div className="minecraft-project__downloads">
                  📥 {project.downloads} downloads
                </div>
              )}
            </div>

            <p className="minecraft-project__description">
              {project.description}
            </p>

            {project.features && (
              <div className="minecraft-project__features">
                <h5 className="minecraft-project__features-title">
                  Key Features:
                </h5>
                <ul className="minecraft-project__features-list">
                  {project.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="minecraft-project__links">
              {project.modrinthUrl && (
                <a
                  href={project.modrinthUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="minecraft-project__link minecraft-project__link--modrinth"
                >
                  <SiModrinth className="minecraft-project__link-icon" />
                  View on Modrinth
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="minecraft-project__link minecraft-project__link--github"
                >
                  <FaGithub className="minecraft-project__link-icon" />
                  View on GitHub
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="minecraft-projects__footer">
        <p className="minecraft-projects__footer-text">
          These projects are open source and available on Modrinth. Feel free
          to check them out, provide feedback, or contribute!
        </p>
      </div>
    </div>
  );
}

