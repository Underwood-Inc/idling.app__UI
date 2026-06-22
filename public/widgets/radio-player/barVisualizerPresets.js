function mixRgb(from, to, t) {
    const clamped = Math.max(0, Math.min(1, t));
    return {
        r: Math.round(from.r + (to.r - from.r) * clamped),
        g: Math.round(from.g + (to.g - from.g) * clamped),
        b: Math.round(from.b + (to.b - from.b) * clamped),
    };
}
function rgba(rgb, alpha) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
function themeColor(drawContext, level, index, total) {
    const { theme } = drawContext;
    const position = total <= 1 ? 0 : index / (total - 1);
    const blended = mixRgb(theme.primary, theme.secondary, position * 0.65 + level * 0.35);
    return rgba(blended, 0.35 + level * 0.65);
}
function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}
function paintCanvasBg(drawContext) {
    const { ctx, width, height, theme } = drawContext;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = theme.canvasBg;
    roundRect(ctx, 0, 0, width, height, 10);
    ctx.fill();
}
function forEachBar(drawContext, drawBar) {
    const { width, data, barGap } = drawContext;
    const count = data.length;
    const gap = Math.max(0, barGap);
    const barW = count > 0 ? (width - gap * (count - 1)) / count : width;
    for (let i = 0; i < count; i += 1) {
        const level = data[i] ?? 0;
        const x = i * (barW + gap);
        drawBar(i, level, x, barW);
    }
}
function drawIdlingBars(drawContext) {
    paintCanvasBg(drawContext);
    const { ctx, height } = drawContext;
    forEachBar(drawContext, (index, level, x, barW) => {
        const barH = Math.max(2, level * height * 0.88);
        const y = height - barH;
        ctx.fillStyle = themeColor(drawContext, level, index, drawContext.data.length);
        roundRect(ctx, x, y, barW, barH, Math.min(barW / 2, 4));
        ctx.fill();
    });
}
function drawMirrorBars(drawContext) {
    paintCanvasBg(drawContext);
    const { ctx, height } = drawContext;
    const mid = height / 2;
    forEachBar(drawContext, (index, level, x, barW) => {
        const halfH = Math.max(2, level * mid * 0.92);
        ctx.fillStyle = themeColor(drawContext, level, index, drawContext.data.length);
        roundRect(ctx, x, mid - halfH, barW, halfH, Math.min(barW / 2, 3));
        ctx.fill();
        roundRect(ctx, x, mid, barW, halfH, Math.min(barW / 2, 3));
        ctx.fill();
    });
}
function drawWaveLine(drawContext) {
    paintCanvasBg(drawContext);
    const { ctx, width, height, data, theme } = drawContext;
    const count = data.length;
    if (count < 2) {
        return;
    }
    const gap = 2;
    const step = width / (count - 1);
    ctx.beginPath();
    for (let i = 0; i < count; i += 1) {
        const level = data[i] ?? 0;
        const x = i * step;
        const y = height - Math.max(4, level * height * 0.82);
        if (i === 0)
            ctx.moveTo(x, y);
        else
            ctx.lineTo(x, y);
    }
    ctx.strokeStyle = rgba(theme.primary, 0.9);
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = rgba(theme.primary, 0.12);
    ctx.fill();
}
function drawDots(drawContext) {
    paintCanvasBg(drawContext);
    const { ctx, height } = drawContext;
    forEachBar(drawContext, (index, level, x, barW) => {
        const radius = Math.max(1.5, level * Math.min(barW, height) * 0.42);
        const cx = x + barW / 2;
        const cy = height - radius - 2;
        ctx.fillStyle = themeColor(drawContext, level, index, drawContext.data.length);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
    });
}
function drawPeakBars(drawContext) {
    paintCanvasBg(drawContext);
    const { ctx, height, state } = drawContext;
    forEachBar(drawContext, (index, level, x, barW) => {
        state.peaks[index] = Math.max(level, state.peaks[index] * 0.94);
        const barH = Math.max(2, level * height * 0.84);
        const y = height - barH;
        ctx.fillStyle = themeColor(drawContext, level, index, drawContext.data.length);
        roundRect(ctx, x, y, barW, barH, Math.min(barW / 2, 3));
        ctx.fill();
        const peakY = height - state.peaks[index] * height * 0.88;
        ctx.fillStyle = rgba(drawContext.theme.secondary, 0.95);
        roundRect(ctx, x, peakY, barW, 2, 1);
        ctx.fill();
    });
}
function drawPrism(drawContext) {
    paintCanvasBg(drawContext);
    const { ctx, height } = drawContext;
    forEachBar(drawContext, (index, level, x, barW) => {
        const hue = (index / drawContext.data.length) * 300 + level * 40;
        const barH = Math.max(2, level * height * 0.88);
        const y = height - barH;
        ctx.fillStyle = `hsla(${hue}, 78%, 62%, ${0.35 + level * 0.55})`;
        roundRect(ctx, x, y, barW, barH, Math.min(barW / 2, 4));
        ctx.fill();
    });
}
function drawLedSegments(drawContext) {
    paintCanvasBg(drawContext);
    const { ctx, height } = drawContext;
    const segments = 6;
    forEachBar(drawContext, (index, level, x, barW) => {
        const lit = Math.round(level * segments);
        const segGap = 1;
        const segH = (height - segGap * (segments - 1)) / segments;
        for (let s = 0; s < segments; s += 1) {
            const segY = height - (s + 1) * segH - s * segGap;
            const active = s < lit;
            ctx.fillStyle = active
                ? themeColor(drawContext, (s + 1) / segments, index, drawContext.data.length)
                : rgba(drawContext.theme.primary, 0.08);
            roundRect(ctx, x, segY, barW, segH, 1);
            ctx.fill();
        }
    });
}
function drawAmbientGlow(drawContext) {
    paintCanvasBg(drawContext);
    const { ctx, width, height, theme } = drawContext;
    ctx.globalCompositeOperation = 'lighter';
    forEachBar(drawContext, (index, level, x, barW) => {
        const barH = Math.max(3, level * height * 0.95);
        const y = height - barH;
        const gradient = ctx.createLinearGradient(x, y, x, height);
        gradient.addColorStop(0, rgba(theme.primary, 0.05 + level * 0.35));
        gradient.addColorStop(1, rgba(theme.secondary, 0.45 + level * 0.35));
        ctx.fillStyle = gradient;
        roundRect(ctx, x - 1, y, barW + 2, barH, Math.min(barW, 8));
        ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
}
function drawSparkLines(drawContext) {
    paintCanvasBg(drawContext);
    const { ctx, height, theme } = drawContext;
    const mid = height / 2;
    forEachBar(drawContext, (index, level, x, barW) => {
        const span = Math.max(2, level * mid * 0.95);
        ctx.strokeStyle = themeColor(drawContext, level, index, drawContext.data.length);
        ctx.lineWidth = Math.max(1, barW * 0.35);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + barW / 2, mid - span);
        ctx.lineTo(x + barW / 2, mid + span);
        ctx.stroke();
    });
    ctx.strokeStyle = rgba(theme.primary, 0.25);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(drawContext.width, mid);
    ctx.stroke();
}
function drawOutlineBars(drawContext) {
    paintCanvasBg(drawContext);
    const { ctx, height } = drawContext;
    forEachBar(drawContext, (index, level, x, barW) => {
        const barH = Math.max(3, level * height * 0.86);
        const y = height - barH;
        ctx.strokeStyle = themeColor(drawContext, level, index, drawContext.data.length);
        ctx.lineWidth = 1.5;
        roundRect(ctx, x + 0.75, y, barW - 1.5, barH, Math.min(barW / 2, 3));
        ctx.stroke();
    });
}
function drawArcSpectrum(drawContext) {
    paintCanvasBg(drawContext);
    const { ctx, width, height, data, theme } = drawContext;
    const count = data.length;
    const compact = height < 36;
    const cx = width / 2;
    const cy = compact ? height - 0.5 : height + 4;
    const radiusBase = compact
        ? Math.min(width * 0.48, height * 2.4)
        : Math.min(width, height * 2) * 0.42;
    const inner = radiusBase * (compact ? 0.28 : 0.55);
    for (let i = 0; i < count; i += 1) {
        const level = data[i] ?? 0;
        const startAngle = compact
            ? Math.PI - (i / count) * Math.PI
            : Math.PI + (i / count) * Math.PI;
        const endAngle = compact
            ? Math.PI - ((i + 1) / count) * Math.PI
            : Math.PI + ((i + 1) / count) * Math.PI;
        const outer = inner + Math.max(2, level * radiusBase * (compact ? 0.55 : 0.45));
        ctx.beginPath();
        ctx.arc(cx, cy, outer, startAngle, endAngle);
        ctx.arc(cx, cy, inner, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = themeColor(drawContext, level, i, count);
        ctx.fill();
    }
    ctx.fillStyle = rgba(theme.primary, compact ? 0.12 : 0.18);
    ctx.beginPath();
    ctx.arc(cx, cy, inner * 0.92, 0, Math.PI * 2);
    ctx.fill();
}
function drawPulseBlob(drawContext) {
    paintCanvasBg(drawContext);
    const { ctx, width, height, data, theme, state } = drawContext;
    let energy = 0;
    for (let i = 0; i < data.length; i += 1) {
        energy += data[i] ?? 0;
    }
    energy /= Math.max(1, data.length);
    state.phase += 0.04 + energy * 0.08;
    const cx = width / 2;
    const cy = height / 2;
    const baseR = Math.min(width, height) * 0.18;
    const pulseR = baseR + energy * Math.min(width, height) * 0.28;
    const gradient = ctx.createRadialGradient(cx, cy, baseR * 0.2, cx, cy, pulseR);
    gradient.addColorStop(0, rgba(theme.primary, 0.55 + energy * 0.25));
    gradient.addColorStop(0.55, rgba(theme.secondary, 0.18 + energy * 0.25));
    gradient.addColorStop(1, rgba(theme.secondary, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba(theme.primary, 0.35 + energy * 0.35);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR + Math.sin(state.phase) * 3, 0, Math.PI * 2);
    ctx.stroke();
}
export const BAR_VISUALIZER_PRESET_DEFINITIONS = [
    { id: 'idling-bars', label: 'Idling bars', description: 'Default rounded bars', dockLayout: 'wide' },
    { id: 'mirror', label: 'Mirror', description: 'Symmetric reflection', dockLayout: 'wide' },
    { id: 'wave', label: 'Wave', description: 'Smooth line spectrum', dockLayout: 'wide' },
    { id: 'dots', label: 'Dots', description: 'Reactive dots', dockLayout: 'wide' },
    { id: 'peaks', label: 'Peaks', description: 'Bars with peak hold', dockLayout: 'wide' },
    { id: 'prism', label: 'Prism', description: 'Rainbow index colors', dockLayout: 'wide' },
    { id: 'led', label: 'LED', description: 'Segmented columns', dockLayout: 'wide' },
    { id: 'ambient', label: 'Ambient glow', description: 'Soft additive glow', dockLayout: 'wide' },
    { id: 'spark', label: 'Spark', description: 'Center spark lines', dockLayout: 'wide' },
    { id: 'outline', label: 'Outline', description: 'Wireframe bars', dockLayout: 'wide' },
    { id: 'arc', label: 'Arc', description: 'Radial arc spectrum', dockLayout: 'compact' },
    { id: 'pulse', label: 'Pulse', description: 'Energy blob', dockLayout: 'compact' },
];
const PRESET_DRAWERS = {
    'idling-bars': drawIdlingBars,
    mirror: drawMirrorBars,
    wave: drawWaveLine,
    dots: drawDots,
    peaks: drawPeakBars,
    prism: drawPrism,
    led: drawLedSegments,
    ambient: drawAmbientGlow,
    spark: drawSparkLines,
    outline: drawOutlineBars,
    arc: drawArcSpectrum,
    pulse: drawPulseBlob,
};
export function createBarVisualizerRuntime(presetId, barCount) {
    const drawer = PRESET_DRAWERS[presetId] ?? drawIdlingBars;
    const state = {
        peaks: new Float32Array(barCount),
        phase: 0,
    };
    return {
        presetId: PRESET_DRAWERS[presetId] ? presetId : 'idling-bars',
        draw(drawContext) {
            drawer(drawContext);
        },
        reset() {
            state.peaks.fill(0);
            state.phase = 0;
        },
        resize(nextBarCount) {
            if (state.peaks.length !== nextBarCount) {
                state.peaks = new Float32Array(nextBarCount);
            }
        },
        getState: () => state,
    };
}
export function getBarVisualizerPresetDefinition(presetId) {
    return (BAR_VISUALIZER_PRESET_DEFINITIONS.find((preset) => preset.id === presetId) ??
        BAR_VISUALIZER_PRESET_DEFINITIONS[0]);
}
export function getBarVisualizerDockLayout(presetId) {
    return getBarVisualizerPresetDefinition(presetId).dockLayout;
}
