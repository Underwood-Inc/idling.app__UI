export class LinePatternGenerator {
  generateLinePattern(
    layerType: number,
    layerColor: string,
    layerOpacity: number,
    random: () => number,
    width: number,
    height: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    if (layerType < 0.55) {
      this.generateLines(random, width, height, layerColor, layerOpacity, patterns);
    } else if (layerType < 0.65) {
      this.generateSpirals(random, width, height, layerColor, layerOpacity, patterns, colorUsage);
    } else if (layerType < 0.75) {
      this.generateZigzags(random, width, height, layerColor, layerOpacity, patterns, colorUsage);
    } else {
      this.generateDotsAndDashes(random, width, height, layerColor, layerOpacity, patterns, colorUsage);
    }
  }

  private generateLines(
    random: () => number,
    width: number,
    height: number,
    layerColor: string,
    layerOpacity: number,
    patterns: string[]
  ): void {
    const numLines = Math.floor(15 + random() * 40);
    for (let i = 0; i < numLines; i++) {
      const x1 = random() * width;
      const y1 = random() * height;
      const length = 50 + random() * 200;
      const angle = random() * Math.PI * 2;
      const x2 = x1 + Math.cos(angle) * length;
      const y2 = y1 + Math.sin(angle) * length;
      const strokeWidth = 1 + random() * 4;
      const opacity = Math.max(0.25, layerOpacity * (0.5 + random() * 0.5));
      patterns.push(
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${layerColor}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`
      );
    }
  }

  private generateSpirals(
    random: () => number,
    width: number,
    height: number,
    layerColor: string,
    layerOpacity: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    const numSpirals = Math.floor(3 + random() * 8);
    for (let i = 0; i < numSpirals; i++) {
      const centerX = random() * width;
      const centerY = random() * height;
      const maxRadius = 20 + random() * 50;
      const turns = 2 + random() * 4;
      const strokeWidth = 1 + random() * 3;
      const opacity = Math.max(0.2, layerOpacity * (0.3 + random() * 0.4));

      let pathData = `M ${centerX} ${centerY}`;
      const steps = Math.floor(turns * 20);
      for (let step = 1; step <= steps; step++) {
        const angle = (step / steps) * turns * 2 * Math.PI;
        const radius = (step / steps) * maxRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        pathData += ` L ${x} ${y}`;
      }

      patterns.push(
        `<path d="${pathData}" fill="none" stroke="${layerColor}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`
      );
      colorUsage[layerColor]++;
    }
  }

  private generateZigzags(
    random: () => number,
    width: number,
    height: number,
    layerColor: string,
    layerOpacity: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    const numZigzags = Math.floor(5 + random() * 12);
    for (let i = 0; i < numZigzags; i++) {
      const startX = random() * width;
      const startY = random() * height;
      const length = 100 + random() * 200;
      const amplitude = 10 + random() * 30;
      const frequency = 3 + random() * 5;
      const angle = random() * Math.PI * 2;
      const strokeWidth = 1 + random() * 3;
      const opacity = Math.max(0.25, layerOpacity * (0.4 + random() * 0.4));

      let pathData = `M ${startX} ${startY}`;
      const steps = Math.floor(frequency * 4);
      for (let step = 1; step <= steps; step++) {
        const progress = step / steps;
        const baseX = startX + Math.cos(angle) * length * progress;
        const baseY = startY + Math.sin(angle) * length * progress;
        const offsetX =
          Math.cos(angle + Math.PI / 2) *
          amplitude *
          Math.sin(progress * frequency * Math.PI);
        const offsetY =
          Math.sin(angle + Math.PI / 2) *
          amplitude *
          Math.sin(progress * frequency * Math.PI);
        pathData += ` L ${baseX + offsetX} ${baseY + offsetY}`;
      }

      patterns.push(
        `<path d="${pathData}" fill="none" stroke="${layerColor}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`
      );
      colorUsage[layerColor]++;
    }
  }

  private generateDotsAndDashes(
    random: () => number,
    width: number,
    height: number,
    layerColor: string,
    layerOpacity: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    const numDots = Math.floor(30 + random() * 70);
    for (let i = 0; i < numDots; i++) {
      const x = random() * width;
      const y = random() * height;
      const isDash = random() > 0.6;
      const opacity = Math.max(0.3, layerOpacity * (0.5 + random() * 0.4));

      if (isDash) {
        const length = 5 + random() * 15;
        const angle = random() * Math.PI * 2;
        const x2 = x + Math.cos(angle) * length;
        const y2 = y + Math.sin(angle) * length;
        const strokeWidth = 1 + random() * 3;
        patterns.push(
          `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${layerColor}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`
        );
      } else {
        const radius = 1 + random() * 4;
        patterns.push(
          `<circle cx="${x}" cy="${y}" r="${radius}" fill="${layerColor}" opacity="${opacity}"/>`
        );
      }
      colorUsage[layerColor]++;
    }
  }
} 