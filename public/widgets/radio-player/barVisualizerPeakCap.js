export function resolveRoundedBarPeakCapMetrics(barWidth, peakY, maxCornerRadius = 4) {
    const cornerRadius = Math.min(barWidth / 2, maxCornerRadius);
    const capHeight = Math.max(cornerRadius * 2, Math.min(barWidth * 0.5, 6));
    return {
        capY: peakY - capHeight,
        capHeight,
        cornerRadius,
    };
}
export function traceRoundedBarPeakCapPath(ctx, x, barWidth, peakY, maxCornerRadius = 4) {
    const metrics = resolveRoundedBarPeakCapMetrics(barWidth, peakY, maxCornerRadius);
    const radius = Math.min(metrics.cornerRadius, metrics.capHeight / 2, barWidth / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, metrics.capY);
    ctx.lineTo(x + barWidth - radius, metrics.capY);
    ctx.quadraticCurveTo(x + barWidth, metrics.capY, x + barWidth, metrics.capY + radius);
    ctx.lineTo(x + barWidth, metrics.capY + metrics.capHeight - radius);
    ctx.quadraticCurveTo(x + barWidth, metrics.capY + metrics.capHeight, x + barWidth - radius, metrics.capY + metrics.capHeight);
    ctx.lineTo(x + radius, metrics.capY + metrics.capHeight);
    ctx.quadraticCurveTo(x, metrics.capY + metrics.capHeight, x, metrics.capY + metrics.capHeight - radius);
    ctx.lineTo(x, metrics.capY + radius);
    ctx.quadraticCurveTo(x, metrics.capY, x + radius, metrics.capY);
    ctx.closePath();
    return metrics;
}
export function drawRoundedBarPeakCap(input) {
    const { ctx, x, barWidth, peakY, fillStyle, alpha = 1, maxCornerRadius } = input;
    if (barWidth <= 0 || alpha <= 0.01) {
        return;
    }
    const previousAlpha = ctx.globalAlpha;
    ctx.globalAlpha = previousAlpha * alpha;
    ctx.fillStyle = fillStyle;
    traceRoundedBarPeakCapPath(ctx, x, barWidth, peakY, maxCornerRadius);
    ctx.fill();
    ctx.globalAlpha = previousAlpha;
}
