/// <reference path="../typings/node/fs.d.ts" />
/// <reference path="./IDocumentRegistry.d.ts" />
/// <reference path="./TextInfoProviderFuncs.d.ts" />

import fs = require("fs");
import PathUtils = require("./PathUtils");

interface StringIndexDictionary<T>
{
    [key: string]: T;
}

class TypeScriptDocument {
    private _path: string;
    private _textInfoProvider: TextInfoProviderFuncs;
    private _bufferReferenceCount: number = 0;
    private _referenceCount: number = 0;

    constructor(path: string, textInfoProvider: TextInfoProviderFuncs) {
        this._path = path;
        this._textInfoProvider = textInfoProvider;
    }

    public get path(): string {
        return this._path;
    }

    public get text(): string {
        return this._textInfoProvider.textProvider(this._path);
    }

    public get version(): number {
        return this._textInfoProvider.versionProvider(this._path);
    }

    public get isOpen(): boolean {
        return this._bufferReferenceCount > 0;
    }

    public addReference(): number {
        return this._referenceCount++;
    }

    public setTextInfoProvider(textInfoProvider: TextInfoProviderFuncs) {
        this._textInfoProvider = textInfoProvider;
    }
}

class DocumentRegistry implements IDocumentRegistry {
    private static staticFileTextInfoProvider: TextInfoProviderFuncs
        = {
            textProvider:    (path) => fs.readFileSync(path, "utf8"),
            versionProvider: (path) => 1
        };

    private _typescriptDocuments: StringIndexDictionary<TypeScriptDocument> = { };

    constructor() {
        this.getOrCreateTypeScriptDocument(this.getDefaultLibPath()).addReference();
    }

    public get defaultLibPath(): string {
        return this.getDefaultLibPath();
    }

    public getScriptCompilationOptions(path: string): CompilerOptions {
        return {
            noLib: false,
            noResolve: false,
            module: ModuleKind.CommonJS,
            target: ScriptTarget.ES5,
            noImplicitAny: true
        };
    }

    public getScriptFileNames(path: string): string[] {
        var compileOptions = this.getScriptCompilationOptions(path);

        if (compileOptions.noResolve)
            return [ this.defaultLibPath, path ];

        var typescriptDocument = this.getOrCreateTypeScriptDocument(path);



        return [ ];
    }

    public getScriptVersion(path: string): number {
        var typescriptDocument = this.getOrCreateTypeScriptDocument(path);

        return typescriptDocument.version;
    }

    public getScriptText(path: string): string {
        var typescriptDocument = this.getOrCreateTypeScriptDocument(path);

        return typescriptDocument.text;
    }

    protected getDefaultLibPath(): string {
        throw new Error("getDefaultLibPath() should be overriden in the derived DocumentRegistry.");
    }

    private getOrCreateTypeScriptDocument(path: string): TypeScriptDocument
    {
        var normalizedPath = PathUtils.normalizePath(path);
        var typescriptDocument: TypeScriptDocument = this._typescriptDocuments[normalizedPath];

        if (!typescriptDocument)
        {
            typescriptDocument = new TypeScriptDocument(normalizedPath, DocumentRegistry.staticFileTextInfoProvider);

            this._typescriptDocuments[normalizedPath] = typescriptDocument;
        }

        return typescriptDocument;
    }
}

export = DocumentRegistry;
