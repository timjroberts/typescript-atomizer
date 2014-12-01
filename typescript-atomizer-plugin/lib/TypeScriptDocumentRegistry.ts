/// <reference path="../node_modules/typescript-atomizer-typings/atom.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/node/fs.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/rx/rx.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/rx/rx.async.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/TypeScriptServices.d.ts" />
/// <reference path="./StringIndexDictionary.d.ts" />

import fs = require("fs");
import Rx = require("rx");
import TypeScriptTextEditor = require("./TypeScriptTextEditor");
import TypeScriptDocument = require("./TypeScriptDocument");
import BufferedTypeScriptDocument = require("./BufferedTypeScriptDocument");

/**
 * Provides a registry of TypeScript documents.
 */
class TypeScriptDocumentRegistry implements ts.DocumentRegistry {
    private _typeScriptLibPath: string;
    private _documents: StringIndexDictionary<TypeScriptDocument>;

    /**
     * Initializes a new {TypeScriptDocumentRegistry}.
     *
     * @param {string} packageRootPath - The root path of where the plugin has been installed.
     */
    constructor(packageRootPath: string) {
        this._typeScriptLibPath = ts.normalizePath(ts.combinePaths(packageRootPath, "lib/TypeScript/lib.d.ts"));
        this._documents = { };

        // Load the default library declaration file and increment it's reference count. It will never be removed
        // from the registry since every opened TypeScript document will make reference to it
        var typescriptDocument: TypeScriptDocument = this.getOrCreateTypeScriptDocument(this._typeScriptLibPath);

        typescriptDocument.addReference();
    }

    /**
     * Ensures that a buffered TypeScript document is open in the document registry for a given
     * TypeScript text editor.
     *
     * @param {TypeScriptTextEditor} tsTextEditor - The TypeScript text editor from which the underlying
     * text buffer can be obtained.
     */
    public openBufferedDocumentForEditor(tsTextEditor: TypeScriptTextEditor): void {
        try {
            var bufferedTypeScriptDocument: BufferedTypeScriptDocument =
                this.getOrCreateBufferedTypeScriptDocument(tsTextEditor.path, tsTextEditor.textBuffer);

            bufferedTypeScriptDocument.addBufferReference();
        }
        finally {
            tsTextEditor.onContentsChanged.subscribe((tsTextEditor) => this.onTypeScriptTextEditorContentsChanged.call(this, tsTextEditor));
            tsTextEditor.onClosed.subscribe((tsTextEditor) => this.onTypeScriptTextEditorClosed.call(this, tsTextEditor));
        }
    }

    /**
     * Returns an array of filenames that represent the references and imports defined in the
     * buffered TypeScript document associated with a given TypeScript text editor.
     *
     * @param {TypeScriptTextEditor} tsTextEditor - The TypeScript text editor for which the program filenames
     * are required.
     * @returns {Array<string>} An array of filenames representing all the TypeScript documents referenced by the
     * TypeScript document associated with the supplied TypeScript text editor.
     */
    public getScriptFileNamesForEditor(tsTextEditor: TypeScriptTextEditor): Array<string> {
        var compilerOptions = tsTextEditor.getCompilationSettings();
        var path = tsTextEditor.path;

        if (compilerOptions.noResolve) return [ this._typeScriptLibPath, tsTextEditor.path ];

        var typescriptDocument: TypeScriptDocument = this._documents[path];

        TypeScriptDocumentRegistry.checkDocument(path, typescriptDocument);

        var sourceFile: ts.SourceFile = typescriptDocument.getSourceFile(compilerOptions.target);

        return [ this._typeScriptLibPath ]
            .concat(this.walkSourceFileReferences(sourceFile, ts.getDirectoryPath(path), compilerOptions.target, []));
    }

    /**
     * Returns a TypeScript document for the specified filename, or throws an error if the document could not be
     * found.
     *
     * @param {string} filename - The full path of the TypeScript document to return.
     */
    public getDocument(filename: string): TypeScriptDocument {
        var typescriptDocument: TypeScriptDocument = this._documents[filename];

        TypeScriptDocumentRegistry.checkDocument(filename, typescriptDocument);

        return typescriptDocument;
    }

    /**
     * Returns the full path to the TypeScript default library declaration file (lib.d.ts).
     */
    public getDefaultLibFilename(): string {
        return this._typeScriptLibPath;
    }

    /**
     * Acquires a TypeScript document.
     *
     * Once acquired, the TypeScript document will be held in the document registry until it has been released via
     * {@link TypeScriptDocumentRegistry#releaseDocument}.
     */
    public acquireDocument(filename: string, compilationSettings: ts.CompilerOptions, scriptSnapshot: TypeScript.IScriptSnapshot, version: string, isOpen: boolean): ts.SourceFile {
        var typescriptDocument: TypeScriptDocument = this._documents[filename];

        TypeScriptDocumentRegistry.checkDocument(filename, typescriptDocument);

        typescriptDocument.addReference();

        var sourceFile: ts.SourceFile = typescriptDocument.getSourceFile(compilationSettings.target);

        var w: any = sourceFile;

        w.getVersion = function() { return version; }
        w.isOpen = function() { return isOpen; }

        return w;
    }

    /**
     * Updates a TypeScript document in the registry from a given text change.
     */
    public updateDocument(soruceFile: ts.SourceFile, filename: string, compilationSettings: ts.CompilerOptions, scriptSnapshot: TypeScript.IScriptSnapshot, version: string, isOpen: boolean, textChangeRange: TypeScript.TextChangeRange): ts.SourceFile {
        var typescriptDocument: TypeScriptDocument = this._documents[filename];

        TypeScriptDocumentRegistry.checkDocument(filename, typescriptDocument);

        var sourceFile: ts.SourceFile = typescriptDocument.getSourceFile(compilationSettings.target);

        var w: any = sourceFile;

        w.getVersion = function() { return version; }
        w.isOpen = function() { return isOpen; }

        return w;
    }

    /**
     * Releases a TypeScript document from the registry.
     *
     * If the reference count of the TypeScript document is zero, then it is removed from the document registry.
     */
    public releaseDocument(filename: string, compilationSettings: ts.CompilerOptions): void {
        var typescriptDocument: TypeScriptDocument = this._documents[filename];

        TypeScriptDocumentRegistry.checkDocument(filename, typescriptDocument);

        if (typescriptDocument.release() === 0) {
            this._documents[filename] = undefined;
        }
    }

    /**
     * Called when the contents of a TypeScript text editor has changed in the Atom workspace.
     *
     * @param {TypeScriptTextEditor} tsTextEditor - The TypeScript text editor that has changed.
     */
    private onTypeScriptTextEditorContentsChanged(tsTextEditor: TypeScriptTextEditor): void {
        var bufferedTypeScriptDocument: BufferedTypeScriptDocument = <BufferedTypeScriptDocument>this._documents[tsTextEditor.path];

        bufferedTypeScriptDocument.incrementVersion();
    }

    /**
     * Called when a TypeScript text editor has been closed in the Atom workspace.
     *
     * If the buffer reference count of the TypeScript document is zero, then the {BufferedTypeScriptDocument} is
     * replaced with a base {TypeScriptDocument}.
     *
     * @param {TypeScriptTextEditor} tsTextEditor - The TypeScript text editor that has been closed.
     */
    private onTypeScriptTextEditorClosed(tsTextEditor: TypeScriptTextEditor): void {
        var path = tsTextEditor.path;
        var bufferedTypeScriptDocument: BufferedTypeScriptDocument = <BufferedTypeScriptDocument>this._documents[path];

        if (bufferedTypeScriptDocument.releaseBuffer() === 0) {
            // No more references to this buffered document, so replace it with a base
            // TypeScriptDocument object
            this._documents[path] = new TypeScriptDocument(bufferedTypeScriptDocument);
        }
    }

    /**
     * Creates or returns an existing TypeScript document for a given path.
     *
     * @param {string} path - The full path for which a TypeScript document is required.
     */
    private getOrCreateTypeScriptDocument(path: string): TypeScriptDocument {
        var typescriptDocument: TypeScriptDocument = this._documents[path];

        if (!typescriptDocument) {
            typescriptDocument = new TypeScriptDocument(path);

            this._documents[path] = typescriptDocument;
        }

        return typescriptDocument;
    }

    /**
     * Creates or returns an existing buffered TypeScript document for a given path.
     *
     * @param {string} path - The full path for which a buffered TypeScript document is required.
     * @param {TextBuffer} textBuffer - The text buffer that will be wrapped by the returned buffered TypeScript document.
     * @returns {BufferedTypeScriptDocument} A buffered TypeScript document that wraps an underlying {TextBuffer}.
     */
    private getOrCreateBufferedTypeScriptDocument(path: string, textBuffer: TextBuffer): BufferedTypeScriptDocument {
        var typescriptDocument: TypeScriptDocument = this._documents[path];

        if (!typescriptDocument) {
            typescriptDocument = new BufferedTypeScriptDocument(path, textBuffer);

            this._documents[path] = typescriptDocument;
        } else if (!(typescriptDocument instanceof BufferedTypeScriptDocument)) {
            typescriptDocument = new BufferedTypeScriptDocument(typescriptDocument, textBuffer);

            this._documents[path] = typescriptDocument;
        }

        return <BufferedTypeScriptDocument>typescriptDocument;
    }

    /**
     * Walks a SourceFile object and returns the path names that represent the entire 'program'.
     *
     * @param {ts.SourceFile} sourceFile - The SourceFile representing the beginning of the traversal.
     * @param {string} basePath - The base path from which referenced files will be searched for.
     * @param {ts.ScriptTarget} scriptTarget - The flavour of Script that will be used to compile any reference files.
     * @param {Array<string>} sourceFilesVisited - Any array of files that have been visted (used to prevent circular references).
     * @returns {Array<string>} The full paths to all the TypeScript documents referenced by the given SourceFile.
     */
    private walkSourceFileReferences(sourceFile: ts.SourceFile, basePath: string, scriptTarget: ts.ScriptTarget, sourceFilesVisited: Array<string>): Array<string> {
        if (sourceFilesVisited.indexOf(sourceFile.filename) > -1) return [ ]; // We've done this source file already

        sourceFilesVisited.push(sourceFile.filename);

        return [ sourceFile.filename ]
            .concat(this.processReferencedFiles(sourceFile, basePath, scriptTarget, sourceFilesVisited))
            .concat(this.processImportedModules(sourceFile, basePath, scriptTarget, sourceFilesVisited));

    }

    /**
     * Processes any referenced files in a given SoureFile.
     *
     * @param {ts.SourceFile} sourceFile - The SourceFile representing the beginning of the traversal.
     * @param {string} basePath - The base path from which referenced files will be searched for.
     * @param {ts.ScriptTarget} scriptTarget - The flavour of Script that will be used to compile any reference files.
     * @param {Array<string>} sourceFilesVisited - Any array of files that have been visted (used to prevent circular references).
     * @returns {Array<string>} The full paths to all the TypeScript documents referenced by the given SourceFile.
     */
    private processReferencedFiles(sourceFile: ts.SourceFile, basePath: string, scriptTarget: ts.ScriptTarget, sourceFilesVisited: Array<string>): Array<string> {
        var paths = [ ];

        sourceFile.referencedFiles.forEach((fileRef: ts.FileReference) => {
                var path = ts.isRootedDiskPath(fileRef.filename)
                    ? fileRef.filename
                    : ts.combinePaths(basePath, fileRef.filename);
                var normalizedPath = ts.normalizePath(path);

                var typescriptDocument: TypeScriptDocument = this.getOrCreateTypeScriptDocument(normalizedPath);
                var sourceFile = typescriptDocument.getSourceFile(scriptTarget);

                paths = paths.concat(this.walkSourceFileReferences(sourceFile, ts.getDirectoryPath(normalizedPath), scriptTarget, sourceFilesVisited));
            });

        return paths;
    }

    /**
     * Processes any imported files in a given SourceFile.
     *
     * @param {ts.SourceFile} sourceFile - The SourceFile representing the beginning of the traversal.
     * @param {string} basePath - The base path from which referenced files will be searched for.
     * @param {ts.ScriptTarget} scriptTarget - The flavour of Script that will be used to compile any reference files.
     * @param {Array<string>} sourceFilesVisited - Any array of files that have been visted (used to prevent circular references).
     * @returns {Array<string>} The full paths to all the TypeScript documents referenced by the given SourceFile.
     */
    private processImportedModules(sourceFile: ts.SourceFile, basePath: string, scriptTarget: ts.ScriptTarget, sourceFilesVisited: Array<string>): Array<string> {
        var paths = [ ];

        sourceFile.statements.forEach((node: ts.Statement) => {
                if (node.kind === ts.SyntaxKind.ImportDeclaration) {
                    var importDeclaration: ts.ImportDeclaration = <ts.ImportDeclaration>node;
                    var nameLiteral = importDeclaration.externalModuleName;
                    var moduleName = nameLiteral.text;

                    if (moduleName) {
                        var processModuleSourceFile = (filename: string) => {
                                var typescriptDocument: TypeScriptDocument = this.getOrCreateTypeScriptDocument(filename);
                                var sourceFile = typescriptDocument.getSourceFile(scriptTarget);

                                paths = paths.concat(this.walkSourceFileReferences(sourceFile, ts.getDirectoryPath(filename), scriptTarget, sourceFilesVisited));
                            };

                        var searchPath = basePath;

                        while (true) {
                            var searchName = ts.normalizePath(ts.combinePaths(searchPath, moduleName));
                            var searchNameSource = searchName + ".ts";
                            var searchNameHeader = searchName + ".d.ts";

                            if (fs.existsSync(searchNameSource)) {
                                processModuleSourceFile(searchNameSource);
                                break;
                            } else if (fs.existsSync(searchNameHeader)) {
                                processModuleSourceFile(searchNameHeader);
                                break;
                            }

                            var parentPath = ts.getDirectoryPath(searchPath);

                            if (parentPath === searchPath) break;

                            searchPath = parentPath;
                        }
                    }
                }
            });

        return paths;
    }

    /**
     * Determines if a TypeScript document was yielded from a given path. If not, then it will
     * throw an error.
     */
    private static checkDocument(path: string, doc: TypeScriptDocument): void {
        if (!doc) {
            throw new Error("File '" + path + "' is unknown to the TypeScript document registry.");
        }
    }
}

export = TypeScriptDocumentRegistry;
