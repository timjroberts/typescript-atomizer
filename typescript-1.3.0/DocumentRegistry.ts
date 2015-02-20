/// <reference path="./typescript-1-3-0.d.ts" />
/// <reference path="../typings/node/path.d.ts" />
/// <reference path="../typescript-core/typescript-core.d.ts" />

import BaseDocumentRegistry = require("typescript-core/DocumentRegistry");
import PathUtils = require("typescript-core/PathUtils");

class DocumentRegistry extends BaseDocumentRegistry implements ts.DocumentRegistry {

    constructor() {
        super();
    }

    public acquireDocument(filename: string, compilationSettings: ts.CompilerOptions, scriptSnapshot: TypeScript.IScriptSnapshot, version: string, isOpen: boolean): ts.SourceFile
    {
        return null;
    }

    public updateDocument(soruceFile: ts.SourceFile, filename: string, compilationSettings: ts.CompilerOptions, scriptSnapshot: TypeScript.IScriptSnapshot, version: string, isOpen: boolean, textChangeRange: TypeScript.TextChangeRange): ts.SourceFile
    {
        return null;
    }

    public releaseDocument(filename: string, compilationSettings: ts.CompilerOptions): void
    {

    }

    protected getDefaultLibPath(): string {
        return PathUtils.combinePaths(__dirname, "lib.d.ts");
    }
}

export = DocumentRegistry;
