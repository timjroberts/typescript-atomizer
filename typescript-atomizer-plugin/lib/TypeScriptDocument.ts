/// <reference path="../../typings/node/fs.d.ts" />
/// <reference path="../../typings/TypeScriptServices.d.ts" />
/// <reference path="./core/NumberIndexDictionary.d.ts" />

import fs = require("fs");

/**
 * Represents a TypeScript document.
 */
class TypeScriptDocument
{
    private _normalizedPath: string;
    private _referenceCount: number;
    private _compiledSourceFileObjects: NumberIndexDictionary<ts.SourceFile>;

    /**
     * Initializes a new {TypeScriptDocument} by copying an existing instance.
     *
     * @param {TypeScriptDocument} typescriptDocument - The TypeScript document to copy.
     */
    constructor(typescriptDocument: TypeScriptDocument)
    /**
     * Initializes a new {TypeScriptDocument}.
     *
     * @param {string} documentPath - The full path of the TypeScript document.
     */
    constructor(documentPath: string)
    constructor(p1: any)
    {
        if (p1 instanceof TypeScriptDocument)
        {
            var typescriptDocumentToCopy = <TypeScriptDocument>p1;

            this._normalizedPath = typescriptDocumentToCopy._normalizedPath;
            this._referenceCount = typescriptDocumentToCopy._referenceCount;
            this._compiledSourceFileObjects = typescriptDocumentToCopy._compiledSourceFileObjects;
        }
        else
        {
            var documentPath = <string>p1;

            this._normalizedPath = TypeScript.switchToForwardSlashes(documentPath);
            this._referenceCount = 0;
            this._compiledSourceFileObjects = { };
        }
    }

    /**
     * Gets the current reference count.
     */
    public get referenceCount(): number { return this._referenceCount; }

    /**
     * Gets the current TypeScript document version.
     */
    public get version(): string { return this.getCurrentDocumentVersion(); }

    /**
     * Gets the full path of the current TypeScript document.
     */
    public get path(): string { return this._normalizedPath; }
    /**
     * Sets the full path of the current TypeScript document.
     */
    public set path(value: string) { this._normalizedPath = TypeScript.switchToForwardSlashes(value); }

    /**
     * Gets the byte order mark of the current TypeScript document.
     */
    public get byteOrderMark(): ts.ByteOrderMark { return this.getByteOrderMark(); }

    /**
     * Gets the current TypeScript document text.
     */
    public get text(): string { return this.getDocumentText(); }

    /**
     * Increments and returns the internal reference count.
     */
    public addReference(): number
    {
        this._referenceCount++;

        return this._referenceCount;
    }

    /**
     * Decrements and returns the internal reference count.
     */
    public release(): number
    {
        this._referenceCount--;

        return this._referenceCount;
    }

    /**
     * Retrieves the compiled SourceFile for the current TypeScript document for a given script target.
     *
     * @param {ts.ScriptTarget} scriptTarget - The script target for which a SourceFile is required.
     * @returns {ts.SourceFile} The up to date SourceFile compiled from the current document text.
     */
    public getSourceFile(scriptTarget: ts.ScriptTarget): ts.SourceFile
    {
        var sourceFile: ts.SourceFile = this._compiledSourceFileObjects[scriptTarget];
        var currentVersion = this.getCurrentDocumentVersion();

        if (!sourceFile || sourceFile.version != currentVersion)
        {
            sourceFile = ts.createSourceFile(this._normalizedPath, this.getDocumentText(), scriptTarget, currentVersion, false);

            this._compiledSourceFileObjects[scriptTarget] = sourceFile;
        }

        return sourceFile;
    }

    /**
     * Retrieves the current TypeScript document version.
     *
     * @returns {string} The {TypeScriptDocument} class represents a static file and therefore it will
     * always return "0".
     */
    protected getCurrentDocumentVersion(): string
    {
        return "0";
    }

    /**
     * Retrives the current TypeScript document text.
     *
     * @returns {string} The {TypeScriptDocument} class represents a static file and therefore it will
     * return the contents of the file from disk.
     */
    protected getDocumentText(): string
    {
        return fs.readFileSync(this._normalizedPath, "utf8");
    }

    /**
     * Retrieves the byte order mark of the current TypeScript document.
     */
    protected getByteOrderMark(): ts.ByteOrderMark
    {
        return ts.ByteOrderMark.Utf8;
    }
}

export = TypeScriptDocument;
