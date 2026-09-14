export function fileFromDataUrl(dataUrl, mime) {
    const comma = dataUrl.indexOf(",");
    const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
    const resolvedMime = mime ?? (comma >= 0 ? dataUrl.slice(5, dataUrl.indexOf(";")) : "application/octet-stream");
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++)
        bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: resolvedMime });
}
//# sourceMappingURL=media.js.map