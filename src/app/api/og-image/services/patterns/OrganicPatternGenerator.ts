export class OrganicPatternGenerator {
  generateOrganicPattern(
    layerType: number,
    layerColor: string,
    layerOpacity: number,
    random: () => number,
    width: number,
    height: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    if (layerType < 0.85) {
      this.generatePolygons(random, width, height, layerColor, layerOpacity, patterns);
    } else if (layerType < 0.9) {
      this.generateGridPattern(random, width, height, layerColor, layerOpacity, patterns, colorUsage);
    } else if (layerType < 0.95) {
      this.generateBlobs(random, width, height, layerColor, layerOpacity, patterns, colorUsage);
    } else {
      this.generateWaves(random, width, height, layerColor, layerOpacity, patterns);
    }
  }

  private generatePolygons(
    random: () => number,
    width: number,
    height: number,
    layerColor: string,
    layerOpacity: number,
    patterns: string[]
  ): void {
    const numPolygons = Math.floor(10 + random() * 30);
    for (let i = 0; i < numPolygons; i++) {
      const centerX = random() * width;
      const centerY = random() * height;
      const sides = Math.floor(3 + random() * 5); // 3-7 sides
      const radius = 10 + random() * 40;
      const rotation = random() * Math.PI * 2;

      const points = [];
      for (let s = 0; s < sides; s++) {
        const angle = (s / sides) * Math.PI * 2 + rotation;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        points.push(`${x},${y}`);
      }

      const opacity = Math.max(0.25, layerOpacity * (0.4 + random() * 0.4));
      const filled = random() > 0.7;
      if (filled) {
        patterns.push(
          `<polygon points="${points.join(' ')}" fill="${layerColor}" opacity="${opacity}"/>`
        );
      } else {
        patterns.push(
          `<polygon points="${points.join(' ')}" fill="none" stroke="${layerColor}" stroke-width="${1 + random() * 3}" opacity="${opacity}"/>`
        );
      }
    }
  }

  private generateGridPattern(
    random: () => number,
    width: number,
    height: number,
    layerColor: string,
    layerOpacity: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    const spacing = 30 + random() * 80;
    const elementSize = 5 + random() * 20;
    const gridRotation = random() * 45;

    for (let x = 0; x < width + 200; x += spacing) {
      for (let y = 0; y < height + 70; y += spacing) {
        if (random() > 0.3) {
          // Skip some elements for randomness
          const finalX = x + (random() - 0.5) * spacing * 0.4;
          const finalY = y + (random() - 0.5) * spacing * 0.4;
          const opacity = Math.max(
            0.3,
            layerOpacity * (0.5 + random() * 0.3)
          );

          const shapeType = random();
          const centerX = width / 2;
          const centerY = height / 2;
          const transform = `rotate(${gridRotation} ${centerX} ${centerY})`;

          if (shapeType < 0.33) {
            // Circle
            patterns.push(
              `<circle cx="${finalX}" cy="${finalY}" r="${elementSize}" fill="${layerColor}" opacity="${opacity}" transform="${transform}"/>`
            );
          } else if (shapeType < 0.66) {
            // Square
            const rectSize = elementSize * 2;
            patterns.push(
              `<rect x="${finalX - elementSize}" y="${finalY - elementSize}" ` +
                `width="${rectSize}" height="${rectSize}" fill="${layerColor}" ` +
                `opacity="${opacity}" transform="${transform}"/>`
            );
          } else {
            // Diamond
            const points = `${finalX},${finalY - elementSize} ${finalX + elementSize},${finalY} ${finalX},${finalY + elementSize} ${finalX - elementSize},${finalY}`;
            patterns.push(
              `<polygon points="${points}" fill="${layerColor}" opacity="${opacity}" transform="${transform}"/>`
            );
          }
          colorUsage[layerColor]++;
        }
      }
    }
  }

  private generateBlobs(
    random: () => number,
    width: number,
    height: number,
    layerColor: string,
    layerOpacity: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    const numBlobs = Math.floor(5 + random() * 15);
    for (let i = 0; i < numBlobs; i++) {
      const centerX = random() * width;
      const centerY = random() * height;
      const baseRadius = 15 + random() * 30;
      const points = 8 + Math.floor(random() * 8); // 8-15 points for organic shape
      const opacity = Math.max(0.2, layerOpacity * (0.3 + random() * 0.4));

      let pathData = '';
      for (let p = 0; p < points; p++) {
        const angle = (p / points) * Math.PI * 2;
        const radiusVariation = 0.7 + random() * 0.6; // 0.7-1.3 multiplier
        const radius = baseRadius * radiusVariation;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (p === 0) {
          pathData = `M ${x} ${y}`;
        } else {
          // Use smooth curves for organic feel
          const prevAngle = ((p - 1) / points) * Math.PI * 2;
          const prevRadius = baseRadius * (0.7 + random() * 0.6);
          const prevX = centerX + Math.cos(prevAngle) * prevRadius;
          const prevY = centerY + Math.sin(prevAngle) * prevRadius;

          const cp1X =
            prevX + Math.cos(prevAngle + Math.PI / 2) * radius * 0.3;
          const cp1Y =
            prevY + Math.sin(prevAngle + Math.PI / 2) * radius * 0.3;
          const cp2X = x + Math.cos(angle - Math.PI / 2) * radius * 0.3;
          const cp2Y = y + Math.sin(angle - Math.PI / 2) * radius * 0.3;

          pathData += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${x} ${y}`;
        }
      }
      pathData += ' Z'; // Close the path

      patterns.push(
        `<path d="${pathData}" fill="${layerColor}" opacity="${opacity}"/>`
      );
      colorUsage[layerColor]++;
    }
  }

  private generateWaves(
    random: () => number,
    width: number,
    height: number,
    layerColor: string,
    layerOpacity: number,
    patterns: string[]
  ): void {
    const numWaves = Math.floor(5 + random() * 15);
    for (let i = 0; i < numWaves; i++) {
      const startX = random() * width;
      const startY = random() * height;
      const amplitude = 20 + random() * 60;
      const frequency = 0.01 + random() * 0.02;
      const length = 100 + random() * 400;
      const angle = random() * Math.PI * 2;

      let pathData = `M ${startX} ${startY}`;
      for (let t = 0; t < length; t += 5) {
        const x = startX + Math.cos(angle) * t;
        const y =
          startY + Math.sin(angle) * t + Math.sin(t * frequency) * amplitude;
        pathData += ` L ${x} ${y}`;
      }

      const opacity = Math.max(0.25, layerOpacity * (0.4 + random() * 0.4));
      patterns.push(
        `<path d="${pathData}" fill="none" stroke="${layerColor}" stroke-width="${1 + random() * 3}" opacity="${opacity}"/>`
      );
    }
  }
} 