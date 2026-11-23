'use client';

import { listHomeMinecraftProjects } from '../marketing-dashboard/productMarketing';
import { HomeProductTile } from '../marketing-dashboard/HomeProductTile';
import styles from './home-landing.module.css';
import shelfStyles from '../marketing-dashboard/marketing-dashboard.module.css';

export function HomeMinecraftShelf() {
  const projects = listHomeMinecraftProjects();

  return (
    <section id="minecraft" className={styles.homeSection} aria-labelledby="home-minecraft-title">
      <h2 id="home-minecraft-title" className={styles.homeSection__title}>
        Minecraft mods & server
      </h2>
      <div className={shelfStyles.dash__shelf}>
        {projects.map((project) => (
          <HomeProductTile key={project.id} project={project} size="chip" />
        ))}
      </div>
    </section>
  );
}