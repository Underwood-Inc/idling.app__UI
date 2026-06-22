function resolvePlaylistUrl(rawUrl, baseUrl) {
    try {
        return new URL(rawUrl.trim(), baseUrl).toString();
    }
    catch {
        return rawUrl.trim();
    }
}
function parsePlsPlaylist(content, baseUrl) {
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
        const match = line.match(/^File\d+=(.+)$/i);
        if (match?.[1]) {
            return {
                ok: true,
                streamUrl: resolvePlaylistUrl(match[1], baseUrl),
            };
        }
    }
    return { ok: false, message: 'PLS playlist did not contain a File entry.' };
}
function parseM3uPlaylist(content, baseUrl) {
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }
        return {
            ok: true,
            streamUrl: resolvePlaylistUrl(trimmed, baseUrl),
        };
    }
    return { ok: false, message: 'M3U playlist did not contain a stream URL.' };
}
export function parseRadioPlaylist(input) {
    const formatHint = input.baseUrl.toLowerCase();
    if (formatHint.includes('.pls')) {
        return parsePlsPlaylist(input.content, input.baseUrl);
    }
    return parseM3uPlaylist(input.content, input.baseUrl);
}
