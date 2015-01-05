/// <reference path="../node_modules/typescript-atomizer-typings/atom.d.ts" />

import TypeScriptDocument = require("./TypeScriptDocument");

/**
 * Represents a TypeScript document that is open in the Atom workspace.
 */
class BufferedTypeScriptDocument extends TypeScriptDocument
{
    private _textBuffer: TextBuffer;
    private _documentVersion: number;
    private _bufferReferenceCount: number;

    /**
     * Initializes a new {BufferedTypeScriptDocument} by copying an instance of {TypeScriptDocument}.
     *
     * @param {TypeScriptDocument} typescriptDocument - The TypeScript document to copy.
     * @param {TextBuffer} textBuffer - The text buffer that representing the underlying TypeScript document.
     */
    constructor(typescriptDocument: TypeScriptDocument, textBuffer: TextBuffer)
    /**
     * Initializes a new {BufferedTypeScriptDocument}.
     *
     * @param {string} documentPath - The full path to the TypeScript document.
     * @param {TextBuffer} textBuffer - The text buffer that representing the underlying TypeScript document.
     */
    constructor(documentPath: string, textBuffer: TextBuffer)
    constructor(p1: any, textBuffer: TextBuffer)
    {
        if (p1 instanceof TypeScriptDocument)
        {
            var typescriptDocumentToCopy = <TypeScriptDocument>p1;

            super(typescriptDocumentToCopy);
        }
        else
        {
            var documentPath = <string>p1;

            super(documentPath);
        }

        this._textBuffer = textBuffer;
        this._documentVersion = 0;
        this._bufferReferenceCount = 0;
    }

    /**
     * Gets the current buffer reference count.
     */
    public get bufferReferenceCount(): number { return this._bufferReferenceCount; }

    /**
     * Increments and returns the buffer reference count.
     */
    public addBufferReference(): number
    {
        this._bufferReferenceCount++;

        return this._bufferReferenceCount;
    }

    /**
     * Decrements and returns the buffer reference count.
     */
    public releaseBuffer(): number
    {
        this._bufferReferenceCount--;

        return this._bufferReferenceCount;
    }

    /**
     * Increments and returns the document version.
     */
    public incrementVersion(): number
    {
        return this._documentVersion++;
    }

    /**
     * Overrides {TypeScriptDocument#getCurrentDocumentVersion} to return the interally tracked
     * document version.
     *
     * @returns {number} The document version.
     */
    protected getCurrentDocumentVersion(): string
    {
        return this._documentVersion.toString();
    }

    /**
     * Overrides {TypeScriptDocument#getDocumentText} to return the contents of the underlying text buffer.
     *
     * @returns {string} The contents of the underlying buffer.
     */
    protected getDocumentText(): string
    {
        return this._textBuffer.getText();
    }
}

export = BufferedTypeScriptDocument;
