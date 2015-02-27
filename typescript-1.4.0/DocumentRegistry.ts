/// <reference path="./typescript-1-4-0.d.ts" />
/// <reference path="../typings/node/path.d.ts" />
/// <reference path="../typings/node/fs.d.ts" />
/// <reference path="../typescript-core/typescript-core.d.ts" />

import ts = require("ts");
import TypeScript = require("TypeScript");
import fs = require("fs");
import BaseDocumentRegistry = require("typescript-core/DocumentRegistry");
import PathUtils = require("typescript-core/PathUtils");
import CompilerOptions = require("typescript-core/CompilerOptions");

class DocumentRegistry extends BaseDocumentRegistry implements ts.DocumentRegistry {
    constructor() {
        super();
    }

    public acquireDocument(path: string, compilationSettings: ts.CompilerOptions, scriptSnapshot: ts.IScriptSnapshot, version: string, isOpen: boolean): ts.SourceFile
    {
        return ts.createSourceFile(path, super.captureTypeScriptDocument(path, true), compilationSettings.target, version.toString(), false);
    }

    public updateDocument(soruceFile: ts.SourceFile, path: string, compilationSettings: ts.CompilerOptions, scriptSnapshot: ts.IScriptSnapshot, version: string, isOpen: boolean, textChangeRange: ts.TextChangeRange): ts.SourceFile
    {
        return ts.createSourceFile(path, super.captureTypeScriptDocument(path, false), compilationSettings.target, version.toString(), false);
    }

    public releaseDocument(path: string, compilationSettings: ts.CompilerOptions): void
    {
        super.releaseTypeScriptDocument(path);
    }

    protected getDefaultLibPath(): string {
        return PathUtils.combinePaths(__dirname, "lib.d.ts");
    }

    protected getCompiledSource(path: string, scriptTarget: CompilerOptions.ScriptTarget, version: number, getTextFunction: () => string, isOpenFunction: () => boolean): any {
        return ts.createSourceFile(path, getTextFunction(), DocumentRegistry.mapScriptTarget(scriptTarget), version.toString(), false);
    }

    protected getCompiledSourceVersion(path: string, compiledSource: any): number {
        return parseInt((<ts.SourceFile>compiledSource).version);
    }

    protected getCompiledSourceReferencePaths(path: string, basePath: string, compiledSource: any): string[] {
        var sourceFile = <ts.SourceFile> compiledSource;

        var referencedPaths: string[] = [ ];

        sourceFile.referencedFiles.forEach((fileReference: ts.FileReference) => {
                var referencedFilePath = PathUtils.isRootedDiskPath(fileReference.filename)
                    ? fileReference.filename
                    : PathUtils.combinePaths(basePath, fileReference.filename);
                var normalizedReferencedFilePath = PathUtils.normalizePath(referencedFilePath);

                if (!fs.existsSync(normalizedReferencedFilePath) || fs.lstatSync(normalizedReferencedFilePath).isDirectory())
                    return;

                referencedPaths.push(normalizedReferencedFilePath);
            });

        sourceFile.statements.forEach((node: ts.Statement) => {
                if (node.kind !== ts.SyntaxKind.ImportDeclaration)
                    return;

                var importDeclaration: ts.ImportDeclaration = <ts.ImportDeclaration> node;

                if (!importDeclaration || !importDeclaration.externalModuleName)
                    return;

                var nameLiteral = importDeclaration.externalModuleName;
                var moduleName = nameLiteral.text;

                if (moduleName)
                {
                    if (!PathUtils.isRelativePath(moduleName))
                        return;

                    var searchName = PathUtils.normalizePath(PathUtils.combinePaths(basePath, moduleName));
                    var searchNameSource = searchName + ".ts";
                    var searchNameHeader = searchName + ".d.ts";

                    if (fs.existsSync(searchNameSource))
                        referencedPaths.push(searchNameSource);
                    else if (fs.existsSync(searchNameHeader))
                        referencedPaths.push(searchNameHeader);
                }
            });

        return referencedPaths;
    }

    private static mapScriptTarget(scriptTarget: CompilerOptions.ScriptTarget): ts.ScriptTarget {
        if (scriptTarget === CompilerOptions.ScriptTarget.ES3)
            return ts.ScriptTarget.ES3;
        else if (scriptTarget === CompilerOptions.ScriptTarget.ES5)
            return ts.ScriptTarget.ES5;

        throw new Error("Unknown ScriptTarget encountered.");
    }
}

export = DocumentRegistry;
