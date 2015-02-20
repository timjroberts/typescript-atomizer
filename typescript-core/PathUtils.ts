var directorySeparator: string = "/";

enum CharacterCodes {
    slash = 47,
    colon = 58
}

export function normalizePath(path: string): string {
    var path = normalizeSlashes(path);
    var rootLength = getRootLength(path);
    var normalized = getNormalizedParts(path, rootLength);
    return path.substr(0, rootLength) + normalized.join(directorySeparator);
}

export function combinePaths(path1: string, path2: string): string {
    if (!(path1 && path1.length)) return path2;
    if (!(path2 && path2.length)) return path1;
    if (path2.charAt(0) === directorySeparator) return path2;
    if (path1.charAt(path1.length - 1) === directorySeparator) return path1 + path2;
    return path1 + directorySeparator + path2;
}

function normalizeSlashes(path: string): string {
    return path.replace(/\\/g, "/");
}

function getRootLength(path: string): number {
    if (path.charCodeAt(0) === CharacterCodes.slash) {
        if (path.charCodeAt(1) !== CharacterCodes.slash) return 1;
        var p1 = path.indexOf("/", 2);
        if (p1 < 0) return 2;
        var p2 = path.indexOf("/", p1 + 1);
        if (p2 < 0) return p1 + 1;
        return p2 + 1;
    }

    if (path.charCodeAt(1) === CharacterCodes.colon) {
        if (path.charCodeAt(2) === CharacterCodes.slash) return 3;
        return 2;
    }

    return 0;
}

function getNormalizedParts(normalizedSlashedPath: string, rootLength: number) {
    var parts = normalizedSlashedPath.substr(rootLength).split(directorySeparator);
    var normalized: string[] = [];

    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];

        if (part !== ".") {
            if (part === ".." && normalized.length > 0 && normalized[normalized.length - 1] !== "..") {
                normalized.pop();
            }
            else {
                normalized.push(part);
            }
        }
    }

    return normalized;
}
