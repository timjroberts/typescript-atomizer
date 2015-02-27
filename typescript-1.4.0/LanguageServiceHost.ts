/// <reference path="./typescript-1-4-0.d.ts" />
/// <reference path="../typescript-core/typescript-core.d.ts" />

import ts = require("ts");
import TypeScript = require("TypeScript");
import DocumentRegistry = require("./DocumentRegistry");
import PathUtils = require("typescript-core/PathUtils");
import CompilerOptions = require("typescript-core/CompilerOptions");

class LanguageServiceHost implements ts.LanguageServiceHost {
    private _path: string;
    private _documentRegistry: DocumentRegistry;

    constructor(path: string, documentRegistry: DocumentRegistry) {
        this._path = PathUtils.normalizePath(path);
        this._documentRegistry = documentRegistry;

        this.getScriptFileNames();
    }

    public log(message: string): void {
        console.log(message + " (" + this._path + ")");
    }

    public getCompilationSettings(): ts.CompilerOptions {
        var scriptCompilerOptions: CompilerOptions.Options = this._documentRegistry.getScriptCompilationOptions(this._path);

        // TODO: map the received script options into the TypeScript options relevant for this version

        var settings: ts.CompilerOptions = {
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

    public getScriptSnapshot(fileName: string): ts.IScriptSnapshot {
        return ts.ScriptSnapshot.fromString(this._documentRegistry.getScriptText(fileName));
    }

    public getLocalizedDiagnosticMessages(): any {
        return null; // Use the localized messages from TypeScript
    }

    public getCancellationToken(): ts.CancellationToken {
        return null;
    }

    public getCurrentDirectory(): string {
        return PathUtils.getDirectoryPath(this._path);
    }

    public getDefaultLibFilename(): string {
        return PathUtils.normalizePath(this._documentRegistry.defaultLibPath);
    }
}

export = LanguageServiceHost;
