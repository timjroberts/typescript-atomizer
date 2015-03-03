/// <reference path="../typings/node/fs.d.ts" />
/// <reference path="./TextInfoProviderFuncs.d.ts" />

import fs = require("fs");
import PathUtils = require("./PathUtils");
import CompilerOptions = require("./CompilerOptions");

interface StringIndexDictionary<T> {
    [key: string]: T;
}

interface NumberIndexDictionary<T> {
    [key: number]: T;
}

/**
 * A private representation of a TypeScript document.
 */
class TypeScriptDocument {
    private _path: string;
    private _textInfoProvider: TextInfoProviderFuncs;
    private _compiledSources: NumberIndexDictionary<any> = { };
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

    public releaseReference(): number {
        return this._referenceCount--;
    }

    public setTextInfoProvider(textInfoProvider: TextInfoProviderFuncs) {
        this._textInfoProvider = textInfoProvider;
    }

    public getCompiledSource(scriptTarget: CompilerOptions.ScriptTarget): any {
        return this._compiledSources[scriptTarget];
    }

    public setCompiledSource(scriptTarget: CompilerOptions.ScriptTarget, compiledSource: any): void {
        this._compiledSources[scriptTarget] = compiledSource;
    }
}

/**
 * A base Document Registry.
 */
class DocumentRegistry {
    /**
     * TextInfo provider functions that assume that a path yields a file on disk.
     */
    private static diskFileTextInfoProvider: TextInfoProviderFuncs
        = {
            textProvider:    (path) => fs.readFileSync(path, "utf8"),
            versionProvider: (path) => 1
        };

    private _typescriptDocuments: StringIndexDictionary<TypeScriptDocument> = { };

    /**
     * Initializes the DocumentRegistry instance.
     */
    constructor() {
        this.getOrCreateTypeScriptDocument(this.getDefaultLibPath()).addReference();
    }

    /**
     * Gets the path to the default TypeScript library declaration file.
     */
    public get defaultLibPath(): string {
        return PathUtils.normalizePath(this.getDefaultLibPath());
    }

    public getScriptCompilationOptions(path: string): CompilerOptions.Options {
        return {
            noLib: false,
            noResolve: false,
            module: CompilerOptions.ModuleKind.CommonJS,
            target: CompilerOptions.ScriptTarget.ES5,
            noImplicitAny: true
        };
    }

    /**
     * Retrieves the list of paths that define the TypeScript project beginning with a given path.
     *
     * References and imported modules path are recursively scanned to return the complete set of known paths.
     *
     * @param path The path from which to begin.
     * @returns An array of paths that are referenced or imported into the given path.
     */
    public getScriptFileNames(path: string): string[] {
        var compileOptions = this.getScriptCompilationOptions(path);

        if (compileOptions.noResolve)
            return [ this.defaultLibPath, path ];

        var typescriptDocument = this.getOrCreateTypeScriptDocument(path);
        var compiledSource = this.getCompiledSourceForTypeScriptDocument(typescriptDocument, compileOptions.target);

        return [ this.defaultLibPath ]
            .concat(this.walkCompiledReferencePaths(path, compiledSource, PathUtils.getDirectoryPath(path), compileOptions.target, [ ]));
    }

    /**
     * Returns the version number of the document identified by a given path.
     *
     * @param path The document path.
     * @returns A number representing the version of the specified document path.
     */
    public getScriptVersion(path: string): number {
        var typescriptDocument = this.getOrCreateTypeScriptDocument(path);

        return typescriptDocument.version;
    }

    /**
     * Returns the text of the document identified by a given path.
     *
     * @param path The document path.
     * @returns A string containing the text of the specified document path.
     */
    public getScriptText(path: string): string {
        var typescriptDocument = this.getOrCreateTypeScriptDocument(path);

        return typescriptDocument.text;
    }

    protected getDefaultLibPath(): string {
        throw new Error("getDefaultLibPath() should be overriden in the derived DocumentRegistry.");
    }

    protected getCompiledSource(path: string, scriptTarget: CompilerOptions.ScriptTarget, version: number, getTextFunction: () => string, isOpenFunction: () => boolean): any {
        throw new Error("getCompiledSource() should be overriden in the derived DocumentRegistry.");
    }

    protected getCompiledSourceVersion(path: string, compiledSource: any): number {
        throw new Error("getCompiledSourceVersion() should be overriden in the derived DocumentRegistry.");
    }

    protected getCompiledSourceReferencePaths(path: string, basePath: string, compiledSource: any): string[] {
        throw new Error("getCompiledSourceReferencePaths() should be overriden in the derived DocumentRegistry.");
    }

    /**
     * Captures the current contents of the specified TypeScript document, and optionally increments
     * its reference count.
     *
     * @param path The path of the TypeScript document to capture the contents of.
     * @param addReference If true, then the reference count of the TypeScript document is incremented.
     * @returns The text of the specified TypeScript document.
     */
    protected captureTypeScriptDocument(path: string, addReference: boolean = true): string {
        var typescriptDocument = this.getTypeScriptDocument(PathUtils.normalizePath(path));

        if (addReference)
            typescriptDocument.addReference();

        return typescriptDocument.text;
    }

    /**
     * Releases a TypeScript document.
     *
     * @param path The path of the TypeScript document to release.
     */
    protected releaseTypeScriptDocument(path: string): void {
        var refCount = this.getTypeScriptDocument(PathUtils.normalizePath(path)).releaseReference();
    }

    private walkCompiledReferencePaths(path: string, compiledSource: any, basePath: string, scriptTarget: CompilerOptions.ScriptTarget, pathsAlreadyVisited: string[]): string[] {
        if (pathsAlreadyVisited.indexOf(path) > -1)
            return [ ]; // already seen this path

        var paths: string[] = [ ];

        paths.push(path);
        pathsAlreadyVisited.push(path);

        var referencedPaths = this.getCompiledSourceReferencePaths(path, basePath, compiledSource);

        for (var pathIdx = 0; pathIdx < referencedPaths.length; pathIdx++) {
            path = referencedPaths[pathIdx];

            var typescriptDocument = this.getOrCreateTypeScriptDocument(path);
            var compiledSource = this.getCompiledSourceForTypeScriptDocument(typescriptDocument, scriptTarget);

            paths = paths.concat(this.walkCompiledReferencePaths(path, compiledSource, PathUtils.getDirectoryPath(path), scriptTarget, pathsAlreadyVisited));
        }

        return paths;
    }

    /**
     * Retrieves the up to date compiled source object for a given script target from a given
     * TypeScript document.
     *
     * @param typescriptDocument The TypeScript document for which a compiled source object is required.
     * @param scriptTarget The script target that should be used to generate the compiled source object.
     * @returns An object that represents the compiled version of the TypeScript document for the specified script
     * target.
     */
    private getCompiledSourceForTypeScriptDocument(typescriptDocument: TypeScriptDocument, scriptTarget: CompilerOptions.ScriptTarget): any {
        var compiledSource: any = typescriptDocument.getCompiledSource(scriptTarget);

        if (!compiledSource || typescriptDocument.version != this.getCompiledSourceVersion(typescriptDocument.path, compiledSource)) {
            compiledSource = this.getCompiledSource(typescriptDocument.path, scriptTarget, typescriptDocument.version, () => typescriptDocument.text, () => typescriptDocument.isOpen);

            typescriptDocument.setCompiledSource(scriptTarget, compiledSource);
        }

        return compiledSource;
    }

    /**
     * Returns a TypeScript document for a given path.
     *
     * If the document is not present in the registry then an Error is thrown.
     *
     * @param path The path for which a TypeScript document should be returned.
     */
    private getTypeScriptDocument(path: string): TypeScriptDocument
    {
        var normalizedPath = PathUtils.normalizePath(path);
        var typescriptDocument: TypeScriptDocument = this._typescriptDocuments[normalizedPath];

        if (!typescriptDocument)
            throw new Error("TypeScript document '" + normalizedPath + "' is not present in the document registry.");

        return typescriptDocument;
    }

    /**
     * Returns a TypeScript document for a given path.
     *
     * If the document is not present in the registry then a default TypeScript document reference
     * is created and added to th registry before being returned.
     *
     * @param path The path for which a TypeScript document should be returned.
     * @returns The TypeScript document that can be referenced by the supplied path.
     */
    private getOrCreateTypeScriptDocument(path: string): TypeScriptDocument
    {
        var normalizedPath = PathUtils.normalizePath(path);
        var typescriptDocument: TypeScriptDocument = this._typescriptDocuments[normalizedPath];

        if (!typescriptDocument)
        {
            typescriptDocument = new TypeScriptDocument(normalizedPath, DocumentRegistry.diskFileTextInfoProvider);

            this._typescriptDocuments[normalizedPath] = typescriptDocument;
        }

        return typescriptDocument;
    }
}

export = DocumentRegistry;
