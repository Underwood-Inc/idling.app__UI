export interface RgbChannel {
  r: number;
  g: number;
  b: number;
}

export interface ContrastSafeCssVars {
  '--contrast-safe-bg': string;
  '--contrast-safe-bg-hover'?: string;
  '--contrast-safe-border'?: string;
  '--contrast-safe-fg': string;
  '--contrast-safe-fg-hover'?: string;
}

export const CONTRAST_SAFE_FOREGROUND_CANDIDATES = [
  '#ffffff',
  '#f9f9f9',
  '#1a1a1a',
  '#000000',
] as const;

const MIN_CONTRAST_RATIO = 4.5;

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, value));
}

function channelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance({ r, g, b }: RgbChannel): number {
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

export function contrastRatio(foreground: RgbChannel, background: RgbChannel): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function parseHexColor(color: string): RgbChannel | null {
  const normalized = color.trim().replace('#', '');

  if (normalized.length === 3) {
    return {
      r: parseInt(normalized[0] + normalized[0], 16),
      g: parseInt(normalized[1] + normalized[1], 16),
      b: parseInt(normalized[2] + normalized[2], 16),
    };
  }

  if (normalized.length === 6) {
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
    };
  }

  return null;
}

function parseRgbFunctionColor(color: string): RgbChannel | null {
  const match = color.trim().match(/^rgba?\(([\d.\s%,]+)\)$/i);
  if (!match) return null;

  const parts = match[1].split(',').map((part) => part.trim());
  if (parts.length < 3) return null;

  const parsePart = (part: string, max = 255): number => {
    if (part.endsWith('%')) {
      return clampChannel((parseFloat(part) / 100) * max);
    }
    return clampChannel(parseFloat(part));
  };

  return {
    r: parsePart(parts[0]),
    g: parsePart(parts[1]),
    b: parsePart(parts[2]),
  };
}

export function parseCssColorToRgb(color: string): RgbChannel | null {
  if (!color) return null;

  const trimmed = color.trim().toLowerCase();

  if (trimmed.startsWith('#')) {
    return parseHexColor(trimmed);
  }

  if (trimmed.startsWith('rgb')) {
    return parseRgbFunctionColor(trimmed);
  }

  return null;
}

export function pickContrastSafeForeground(
  background: string,
  candidates: readonly string[] = CONTRAST_SAFE_FOREGROUND_CANDIDATES,
): string {
  const backgroundRgb = parseCssColorToRgb(background);

  if (!backgroundRgb) {
    return candidates[0] ?? '#ffffff';
  }

  let bestCandidate = candidates[0] ?? '#ffffff';
  let bestRatio = 0;

  for (const candidate of candidates) {
    const candidateRgb = parseCssColorToRgb(candidate);
    if (!candidateRgb) continue;

    const ratio = contrastRatio(candidateRgb, backgroundRgb);
    if (ratio >= MIN_CONTRAST_RATIO) {
      return candidate;
    }

    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

export function getContrastSafeCssVars(
  background: string,
  hoverBackground?: string,
  border?: string,
): ContrastSafeCssVars {
  const hoverBg = hoverBackground ?? background;
  const foreground = pickContrastSafeForeground(background);
  const hoverForeground = pickContrastSafeForeground(hoverBg);

  return {
    '--contrast-safe-bg': background,
    '--contrast-safe-bg-hover': hoverBg,
    '--contrast-safe-border': border ?? background,
    '--contrast-safe-fg': foreground,
    '--contrast-safe-fg-hover': hoverForeground,
  };
}
