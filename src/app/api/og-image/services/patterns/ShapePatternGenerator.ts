export class ShapePatternGenerator {
  generateShapePattern(
    layerType: number,
    layerColor: string,
    layerOpacity: number,
    random: () => number,
    width: number,
    height: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    if (layerType < 0.06) {
      this.generateCircles(random, width, height, layerColor, layerOpacity, patterns, colorUsage);
    } else if (layerType < 0.12) {
      this.generateHexagons(random, width, height, layerColor, layerOpacity, patterns, colorUsage);
    } else if (layerType < 0.18) {
      this.generateStars(random, width, height, layerColor, layerOpacity, patterns, colorUsage);
    } else if (layerType < 0.24) {
      this.generateTriangles(random, width, height, layerColor, layerOpacity, patterns, colorUsage);
    } else if (layerType < 0.3) {
      this.generateEllipses(random, width, height, layerColor, layerOpacity, patterns, colorUsage);
    } else if (layerType < 0.35) {
      this.generateCrosses(random, width, height, layerColor, layerOpacity, patterns, colorUsage);
    } else {
      this.generateArcs(random, width, height, layerColor, layerOpacity, patterns, colorUsage);
    }
  }

  private generateCircles(
    random: () => number,
    width: number,
    height: number,
    layerColor: string,
    layerOpacity: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    const numCircles = Math.floor(20 + random() * 80);
    for (let i = 0; i < numCircles; i++) {
      const x = random() * width;
      const y = random() * height;
      const radius = 3 + random() * 20;
      const opacity = Math.max(0.3, layerOpacity * (0.6 + random() * 0.4));
      patterns.push(
        `<circle cx="${x}" cy="${y}" r="${radius}" fill="${layerColor}" opacity="${opacity}"/>`
      );
      colorUsage[layerColor]++;
    }
  }

  private generateHexagons(
    random: () => number,
    width: number,
    height: number,
    layerColor: string,
    layerOpacity: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    const numHexagons = Math.floor(10 + random() * 30);
    for (let i = 0; i < numHexagons; i++) {
      const centerX = random() * width;
      const centerY = random() * height;
      const size = 8 + random() * 25;
      const rotation = random() * 60;
      const points = [];
      for (let j = 0; j < 6; j++) {
        const angle = (j * 60 + rotation) * (Math.PI / 180);
        const x = centerX + Math.cos(angle) * size;
        const y = centerY + Math.sin(angle) * size;
        points.push(`${x},${y}`);
      }
      const opacity = Math.max(0.25, layerOpacity * (0.4 + random() * 0.4));
      const filled = random() > 0.6;
      if (filled) {
        patterns.push(
          `<polygon points="${points.join(' ')}" fill="${layerColor}" opacity="${opacity}"/>`
        );
      } else {
        patterns.push(
          `<polygon points="${points.join(' ')}" fill="none" stroke="${layerColor}" stroke-width="${1 + random() * 2}" opacity="${opacity}"/>`
        );
      }
      colorUsage[layerColor]++;
    }
  }

  private generateStars(
    random: () => number,
    width: number,
    height: number,
    layerColor: string,
    layerOpacity: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    const numStars = Math.floor(8 + random() * 20);
    for (let i = 0; i < numStars; i++) {
      const centerX = random() * width;
      const centerY = random() * height;
      const outerRadius = 10 + random() * 20;
      const innerRadius = outerRadius * (0.4 + random() * 0.3);
      const spikes = 5 + Math.floor(random() * 3); // 5-7 spikes
      const rotation = random() * 360;
      const points = [];
      for (let j = 0; j < spikes * 2; j++) {
        const angle = ((j * 180) / spikes + rotation) * (Math.PI / 180);
        const radius = j % 2 === 0 ? outerRadius : innerRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        points.push(`${x},${y}`);
      }
      const opacity = Math.max(0.3, layerOpacity * (0.5 + random() * 0.3));
      patterns.push(
        `<polygon points="${points.join(' ')}" fill="${layerColor}" opacity="${opacity}"/>`
      );
      colorUsage[layerColor]++;
    }
  }

  private generateTriangles(
    random: () => number,
    width: number,
    height: number,
    layerColor: string,
    layerOpacity: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    const numTriangles = Math.floor(15 + random() * 35);
    for (let i = 0; i < numTriangles; i++) {
      const centerX = random() * width;
      const centerY = random() * height;
      const size = 8 + random() * 30;
      const rotation = random() * 360;
      const triangleType = random();
      let points = [];

      if (triangleType < 0.33) {
        // Equilateral triangle
        for (let j = 0; j < 3; j++) {
          const angle = (j * 120 + rotation) * (Math.PI / 180);
          const x = centerX + Math.cos(angle) * size;
          const y = centerY + Math.sin(angle) * size;
          points.push(`${x},${y}`);
        }
      } else if (triangleType < 0.66) {
        // Right triangle
        const x1 = centerX;
        const y1 = centerY;
        const x2 = centerX + size;
        const y2 = centerY;
        const x3 = centerX;
        const y3 = centerY + size;
        points = [`${x1},${y1}`, `${x2},${y2}`, `${x3},${y3}`];
      } else {
        // Isosceles triangle
        const x1 = centerX;
        const y1 = centerY - size;
        const x2 = centerX - size * 0.7;
        const y2 = centerY + size * 0.5;
        const x3 = centerX + size * 0.7;
        const y3 = centerY + size * 0.5;
        points = [`${x1},${y1}`, `${x2},${y2}`, `${x3},${y3}`];
      }

      const opacity = Math.max(0.25, layerOpacity * (0.4 + random() * 0.4));
      const filled = random() > 0.5;
      if (filled) {
        patterns.push(
          `<polygon points="${points.join(' ')}" fill="${layerColor}" opacity="${opacity}"/>`
        );
      } else {
        patterns.push(
          `<polygon points="${points.join(' ')}" fill="none" stroke="${layerColor}" stroke-width="${1 + random() * 2}" opacity="${opacity}"/>`
        );
      }
      colorUsage[layerColor]++;
    }
  }

  private generateEllipses(
    random: () => number,
    width: number,
    height: number,
    layerColor: string,
    layerOpacity: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    const numEllipses = Math.floor(12 + random() * 25);
    for (let i = 0; i < numEllipses; i++) {
      const cx = random() * width;
      const cy = random() * height;
      const rx = 5 + random() * 25;
      const ry = 5 + random() * 25;
      const rotation = random() * 180;
      const opacity = Math.max(0.25, layerOpacity * (0.4 + random() * 0.4));
      const filled = random() > 0.4;
      const ellipseTransform = `rotate(${rotation} ${cx} ${cy})`;
      const ellipseBase = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"`;
      if (filled) {
        patterns.push(
          `${ellipseBase} fill="${layerColor}" opacity="${opacity}" transform="${ellipseTransform}"/>`
        );
      } else {
        const strokeWidth = 1 + random() * 3;
        patterns.push(
          `${ellipseBase} fill="none" stroke="${layerColor}" stroke-width="${strokeWidth}" opacity="${opacity}" transform="${ellipseTransform}"/>`
        );
      }
      colorUsage[layerColor]++;
    }
  }

  private generateCrosses(
    random: () => number,
    width: number,
    height: number,
    layerColor: string,
    layerOpacity: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    const numCrosses = Math.floor(8 + random() * 20);
    for (let i = 0; i < numCrosses; i++) {
      const centerX = random() * width;
      const centerY = random() * height;
      const size = 8 + random() * 20;
      const thickness = 2 + random() * 6;
      const rotation = random() * 45;
      const opacity = Math.max(0.3, layerOpacity * (0.5 + random() * 0.3));

      // Create cross as two rectangles
      const transform = `rotate(${rotation} ${centerX} ${centerY})`;
      const rectBase = `fill="${layerColor}" opacity="${opacity}" transform="${transform}"`;
      const rect1 = `<rect x="${centerX - size}" y="${centerY - thickness / 2}" width="${size * 2}" height="${thickness}" ${rectBase}/>`;
      const rect2 = `<rect x="${centerX - thickness / 2}" y="${centerY - size}" width="${thickness}" height="${size * 2}" ${rectBase}/>`;
      patterns.push(rect1);
      patterns.push(rect2);
      colorUsage[layerColor] += 2;
    }
  }

  private generateArcs(
    random: () => number,
    width: number,
    height: number,
    layerColor: string,
    layerOpacity: number,
    patterns: string[],
    colorUsage: Record<string, number>
  ): void {
    const numArcs = Math.floor(6 + random() * 15);
    for (let i = 0; i < numArcs; i++) {
      const startX = random() * width;
      const startY = random() * height;
      const radius = 20 + random() * 60;
      const startAngle = random() * 360;
      const endAngle = startAngle + 60 + random() * 180;
      const opacity = Math.max(0.25, layerOpacity * (0.4 + random() * 0.4));
      const strokeWidth = 2 + random() * 5;

      // Create arc using path
      const startAngleRad = startAngle * (Math.PI / 180);
      const endAngleRad = endAngle * (Math.PI / 180);
      const x1 = startX + Math.cos(startAngleRad) * radius;
      const y1 = startY + Math.sin(startAngleRad) * radius;
      const x2 = startX + Math.cos(endAngleRad) * radius;
      const y2 = startY + Math.sin(endAngleRad) * radius;
      const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

      patterns.push(
        `<path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}" fill="none" stroke="${layerColor}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`
      );
      colorUsage[layerColor]++;
    }
  }
} 