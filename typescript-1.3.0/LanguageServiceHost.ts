/// <reference path="./typescript-1-3-0.d.ts" />
/// <reference path="../typescript-core/typescript-core.d.ts" />

import DocumentRegistry = require("./DocumentRegistry");
import PathUtils = require("typescript-core/PathUtils");

var ts: any;
var TypeScript: any;

class LanguageServiceHost implements ts.LanguageServiceHost {
    private _path: string;
    private _documentRegistry: DocumentRegistry;

    constructor(path: string, documentRegistry: DocumentRegistry, tsRef: any, typeScriptRef: any) {
        this._path = path;
        this._documentRegistry = documentRegistry;

        ts = tsRef;
        TypeScript = typeScriptRef;
    }

    public log(message: string): void {
        console.log(message + " (" + this._path + ")");
    }

    public getCompilationSettings(): ts.CompilerOptions {
        var scriptCompilerOptions = this._documentRegistry.getScriptCompilationOptions(this._path);

        // TODO: map the received script options into the TypeScript ones for this version

        var settings: ts.CompilerOptions =
            {
                noLib: false,
                module: ts.ModuleKind.CommonJS, //ts.ModuleKind.None,
                target: ts.ScriptTarget.ES5,
                noResolve: false
            }

        return settings;
    }

    public getScriptFileNames(): string[] {
        return this._documentRegistry.getScriptFileNames(this._path);
    }

    public getScriptVersion(fileName: string): string {
        return this._documentRegistry.getScriptVersion(fileName).toString();
    }

    public getScriptIsOpen(fileName: string): boolean {
        //return this._documentRegistry.getScriptIsOpen(fileName);
        return false;
    }

    public getScriptSnapshot(fileName: string): TypeScript.IScriptSnapshot {
        return TypeScript.ScriptSnapshot.fromString(this._documentRegistry.getScriptText(fileName));
    }

    public getLocalizedDiagnosticMessages(): any {
        return null; // Use the localized messages from TypeScript
    }

    public getCancellationToken(): ts.CancellationToken {
        return null;
    }

    public getDefaultLibFilename(): string {
        return PathUtils.normalizePath(this._documentRegistry.defaultLibPath);
    }
}

export = LanguageServiceHost;
