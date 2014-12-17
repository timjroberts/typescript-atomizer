
declare module ts {
    export enum ModuleKind {
        None,
        CommonJS,
        AMD,
    }

    export enum ScriptTarget {
        ES3,
        ES5,
    }

    export interface Diagnostic {
        file: SourceFile;
        start: number;
        length: number;
        messageText: string;
        category: DiagnosticCategory;
        code: number;
    }

    export enum DiagnosticCategory {
        Warning,
        Error,
        Message,
    }

    export interface CompilerOptions {
        charset?: string;
        codepage?: number;
        declaration?: boolean;
        diagnostics?: boolean;
        help?: boolean;
        locale?: string;
        mapRoot?: string;
        module?: ModuleKind;
        noImplicitAny?: boolean;
        noLib?: boolean;
        noLibCheck?: boolean;
        noResolve?: boolean;
        out?: string;
        outDir?: string;
        removeComments?: boolean;
        sourceMap?: boolean;
        sourceRoot?: string;
        target?: ScriptTarget;
        version?: boolean;
        watch?: boolean;

        [option: string]: any;
    }

    export interface LiteralExpression {
        text: string;
    }

    export interface Declaration extends Node {

    }

    export interface ImportDeclaration extends Declaration {
        externalModuleName?: LiteralExpression;
    }

    export enum ByteOrderMark {
        None = 0,
        Utf8 = 1,
        Utf16BigEndian = 2,
        Utf16LittleEndian = 3,
    }

    export enum SyntaxKind {
        ImportDeclaration,
        ModuleDeclaration,
        StringLiteral
    }

    /*
    export enum NodeFlags {
        Export           = 0x00000001,  // Declarations
        Ambient          = 0x00000002,  // Declarations
        QuestionMark     = 0x00000004,  // Parameter/Property/Method
        Rest             = 0x00000008,  // Parameter
        Public           = 0x00000010,  // Property/Method
        Private          = 0x00000020,  // Property/Method
        Protected        = 0x00000040,  // Property/Method
        Static           = 0x00000080,  // Property/Method
        MultiLine        = 0x00000100,  // Multi-line array or object literal
        Synthetic        = 0x00000200,  // Synthetic node (for full fidelity)
        DeclarationFile  = 0x00000400,  // Node is a .d.ts file

        Modifier = Export | Ambient | Public | Private | Protected | Static,
        AccessibilityModifier = Public | Private | Protected
    }
    */

    export interface Node extends TextRange {
        kind: SyntaxKind;
        //flags: NodeFlags;
    }

    export interface Statement extends Node {

    }

    export interface Block {
        byteOrderMark: ByteOrderMark;
        statements: Statement[];
    }

    export interface TextRange {
        pos: number;
        end: number;
    }

    export interface FileReference extends TextRange {
        filename: string;
    }

    export interface SourceFile extends Block {
        filename: string;
        version: string;
        referencedFiles: FileReference[];
        getSourceUnit(): any; // TypeScript.SourceUnitSyntax;
        getSyntaxTree(): any; // TypeScript.SyntaxTree;
        getBloomFilter(): any; // TypeScript.BloomFilter;
        update(scriptSnapshot: TypeScript.IScriptSnapshot, version: number, isOpen: boolean, textChangeRange: TypeScript.TextChangeRange): SourceFile;
    }

    export interface DocumentRegistry {
        acquireDocument(
            filename: string,
            compilationSettings: CompilerOptions,
            scriptSnapshot: TypeScript.IScriptSnapshot,
            version: string,
            isOpen: boolean): SourceFile;

        updateDocument(
            soruceFile: ts.SourceFile,
            filename: string,
            compilationSettings: CompilerOptions,
            scriptSnapshot: TypeScript.IScriptSnapshot,
            version: string,
            isOpen: boolean,
            textChangeRange: TypeScript.TextChangeRange): SourceFile;

        releaseDocument(filename: string, compilationSettings: CompilerOptions): void
    }

    export interface CompletionEntry {
        name: string;
        kind: string;            // see ScriptElementKind
        kindModifiers: string;   // see ScriptElementKindModifier, comma separated
    }
    export interface CompletionInfo {
        isMemberCompletion: boolean;
        entries: CompletionEntry[];
    }

    export interface CancellationToken {
        isCancellationRequested(): boolean;
    }

    export interface Logger {
        log(s: string): void;
    }

    export interface LanguageServiceHost extends Logger {
        getCompilationSettings(): CompilerOptions;
        getScriptFileNames(): string[];
        getScriptVersion(fileName: string): string;
        getScriptIsOpen(fileName: string): boolean;
        getScriptSnapshot(fileName: string): TypeScript.IScriptSnapshot;
        getLocalizedDiagnosticMessages(): any;
        getCancellationToken(): CancellationToken;
        getDefaultLibFilename(): string;
    }

    export interface LanguageService {
        getSyntacticDiagnostics(fileName: string): Diagnostic[];
        getSemanticDiagnostics(fileName: string): Diagnostic[];

        getCompletionsAtPosition(fileName: string, position: number, isMemberCompletion: boolean): CompletionInfo;

        dispose(): void;
    }

    export function createLanguageService(host: LanguageServiceHost, documentRegistry: DocumentRegistry): LanguageService

    export function createSourceFile(filename: string, sourceText: string, languageVersion: ScriptTarget, version: string, isOpen: boolean): SourceFile;

    export function isRootedDiskPath(path: string): boolean;

    export function combinePaths(path1: string, path2: string): string;

    export function normalizePath(path: string): string;

    export function getDirectoryPath(path: string): string;
}

declare module TypeScript {
    module TextUtilities {
        export interface ICharacterSequence {
            charCodeAt(index: number): number;
            length: number;
        }

        export function parseLineStarts(text: ICharacterSequence): number[];
    }

    export interface IScriptSnapshot {
        getText(start: number, end: number): string;

        getLength(): number;

        getLineStartPositions(): number[];

        getTextChangeRangeSinceVersion(scriptVersion: number): TextChangeRange;
    }

    export class TextChangeRange {
    }

    export class ScriptSnapshot {
        public static fromString(text: string): IScriptSnapshot;
    }

    export function switchToForwardSlashes(filename): string;
}

declare var require: any;

declare var global: any;
