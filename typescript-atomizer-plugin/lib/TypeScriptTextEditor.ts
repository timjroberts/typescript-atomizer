/// <reference path="../node_modules/typescript-atomizer-typings/atom.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/rx/rx.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/TypeScriptServices.d.ts" />

import Rx = require("rx");
import ArrayUtils = require("./ArrayUtils");
import TypeScriptDocumentRegistry = require("./TypeScriptDocumentRegistry");
import TypeScriptDocument = require("./TypeScriptDocument");

/**
 * Represents all the essential state for a text buffer opened upon a TypeScript
 * document. This includes markers that represent TypeScript diagnostic messages.
 */
class TypeScriptTextEditor implements ts.LanguageServiceHost {
    private _textEditor: TextEditor;
    private _textBuffer: TextBuffer;
    private _documentRegistry: TypeScriptDocumentRegistry;
    private _normalizedPath: string;
    private _languageService: ts.LanguageService;
    private _diagnostics: Array<ts.Diagnostic>;
    private _onClosed: Rx.Subject<TypeScriptTextEditor>;
    private _onContentsChanging: Rx.Subject<TypeScriptTextEditor>;
    private _onContentsChanged: Rx.Subject<TypeScriptTextEditor>;
    private _onCursorPositionChanged: Rx.Subject<Point>;

    /**
     * Initializes a new {TypeScriptTextEditor}.
     *
     * @param {TextEditor} textEditor - The Atom TextEditor which will be used to reflect the associated
     * TypeScript document state.
     * @param {TypeScriptDocumentRegistry} documentRegistry - The TypeScript document registry that can be used
     * to manage TypeScript document references.
     */
    constructor(textEditor: TextEditor, documentRegistry: TypeScriptDocumentRegistry) {
        this._textEditor = textEditor;
        this._textBuffer = this._textEditor.getBuffer();
        this._documentRegistry = documentRegistry;
        this._normalizedPath = TypeScript.switchToForwardSlashes(this._textEditor.getPath());

        this._onClosed = new Rx.Subject<TypeScriptTextEditor>();
        this._onContentsChanging = new Rx.Subject<TypeScriptTextEditor>();
        this._onContentsChanged = new Rx.Subject<TypeScriptTextEditor>();
        this._onCursorPositionChanged = new Rx.Subject<Point>();

        var onContentsChanging =
            TypeScriptTextEditor.createOnContentsChangingObservable(this._textEditor)
                .subscribe(() => {
                        this._onContentsChanging.onNext(this);
                    });

        var onContentsChangedSubscription =
            TypeScriptTextEditor.createOnContentsChangedObservable(this._textEditor)
                .subscribe(() => {
                        this._onContentsChanged.onNext(this);
                    });

        var onCursorChangedSubscription =
            TypeScriptTextEditor.createOnCursorChangedPositionObservable(this._textEditor)
                .select((_, idx: number, obs: Rx.Observable<void>) => {
                        return this._textEditor.getLastCursor().getScreenPosition();
                    })
                .subscribe((point: Point) => {
                        this._onCursorPositionChanged.onNext(point);
                    });

        var onDestroySubscription =
            TypeScriptTextEditor.createOnDestroyObservable(this._textEditor)
                .subscribe(() => {
                        this._onClosed.onNext(this);

                        this._onContentsChanging.onCompleted();
                        this._onContentsChanged.onCompleted();
                        this._onCursorPositionChanged.onCompleted();
                        this._onClosed.onCompleted();

                        onContentsChanging.dispose();
                        onContentsChangedSubscription.dispose();
                        onCursorChangedSubscription.dispose();
                        onDestroySubscription.dispose();

                        this._languageService.dispose();
                    });

        this._documentRegistry.openBufferedDocumentForEditor(this);
        this._languageService = ts.createLanguageService(this, this._documentRegistry);
    }

    /**
     * Gets the underlying text editor being wrapped by the current TypeScript text editor.
     */
    public get textEditor(): TextEditor {
        return this._textEditor;
    }

    /**
     * Gets the full path of the current TypeScript text editor.
     */
    public get path(): string {
        return this._normalizedPath;
    }

    /**
     * Gets the underlying Atom TextBuffer.
     */
    public get textBuffer(): TextBuffer {
        return this._textBuffer;
    }

    /**
     * Gets an observable that when subscribed to will indicate when the TypeScript text
     * editor is closed.
     */
    public get onClosed(): Rx.Observable<TypeScriptTextEditor> {
        return this._onClosed;
    }

    /**
     * Gets an observable that when subscribed to will indicate when the TypeScript text
     * editor contents have began changing.
     */
    public get onContentsChaning(): Rx.Observable<TypeScriptTextEditor> {
        return this._onContentsChanging;
    }

    /**
     * Gets an observable that when subscribed to will indicate when the TypeScript text
     * editor contents change.
     */
    public get onContentsChanged(): Rx.Observable<TypeScriptTextEditor> {
        return this._onContentsChanged;
    }

    /**
     * Gets an observable that when subscribed to will indicate when the cursor position
     * has changed in the editor.
     */
    public get onCursorPositionChanged(): Rx.Observable<Point> {
        return this._onCursorPositionChanged;
    }

    /**
     * Retrieves the current TypeScript diagnostic messages.
     */
    public getLanguageDiagnostics(): Array<ts.Diagnostic> {
        var diagnostics = this._languageService.getSemanticDiagnostics(this._normalizedPath);

        return diagnostics ? diagnostics : [ ];
    }

    /**
     * Logs a message.
     *
     * @param {string} message - The message to be logged.
     */
    public log(message: string): void {
        console.log(message + " (" + this._normalizedPath + ")");
    }

    /**
     * Retrieves the known script paths.
     *
     * @returns {Array<string>} An array of strings representing the full paths of the TypeScript documents
     * referenced by the current TypeScript text editor.
     */
    public getScriptFileNames(): Array<string> {
        return this._documentRegistry.getScriptFileNamesForEditor(this);
    }

    /**
     * Retrieves the version of a given TypeScript document.
     *
     * @returns {string} The version of the TypeScript document associated with the supplied path.
     */
    public getScriptVersion(filename: string): string {
        return this._documentRegistry.getDocument(filename).version;
    }

    /**
     * Retrieves a boolean indicator to determine if a TypeScript document is 'open'.
     *
     * @returns {boolean} true if the TypeScript document is currently open in the Atom workspace; otherwise false.
     */
    public getScriptIsOpen(filename: string): boolean {
        return false;
    }

    /**
     * Retrieves the byte order mark of a given TypeScript document.
     */
    public getScriptByteOrderMark(filename: string): ts.ByteOrderMark {
        return this._documentRegistry.getDocument(filename).byteOrderMark;
    }

    /**
     * Retrieves the script snapshot from the contents of the TypeScript document.
     */
    public getScriptSnapshot(filename: string): TypeScript.IScriptSnapshot {
        var typescriptDocument: TypeScriptDocument = this._documentRegistry.getDocument(filename);

        return TypeScript.ScriptSnapshot.fromString(typescriptDocument.text);
    }

    /**
     * Retrieves localized diagnostic messages.
     *
     * Returns null allowing TypeScript to localize the diagnostic messages that it produces.
     */
    public getLocalizedDiagnosticMessages(): any {
        return null; // Use the TypeScript localized messages
    }

    /**
     * Retrieves a cancellation token.
     */
    public getCancellationToken(): ts.CancellationToken {
        return null;
    }

    /**
     * Retrieves the full path to the TypeScript default library declaration file.
     */
    public getDefaultLibFilename(): string {
        return this._documentRegistry.getDefaultLibFilename();
    }

    /**
     * Retrieves the compilation settings for the current TypeScript text editor.
     */
    public getCompilationSettings(): ts.CompilerOptions {
        return {
            noLib: false,
            module: ts.ModuleKind.CommonJS, //ts.ModuleKind.None,
            target: ts.ScriptTarget.ES5,
            noResolve: false
        };
    }

    /**
     * Retrieves the TypeScript code completion information from the current cursor position.
     */
    public getEditorCodeCompletionsForCursor(): ts.CompletionInfo {
        var cursorPosition: Point = this._textEditor.getCursorBufferPosition();
        var cursorScope: ScopeDescriptor = this._textEditor.scopeDescriptorForBufferPosition(cursorPosition);

        var bufferLineStartPositions: number[] = TypeScript.TextUtilities.parseLineStarts(this._textEditor.getText());
        var typeScriptPosition = bufferLineStartPositions[cursorPosition.row] + cursorPosition.column;

        try {
            return this._languageService.getCompletionsAtPosition(this._normalizedPath, typeScriptPosition, true);
        }
        catch (error)
        { }
    }

    /**
     * Returns an observable stream of text editor change by subscribing to the underlying
     * Atom Text Editor.
     *
     * @param {TextEditor} textEditor - The Atom TextEditor.
     * @returns {Rx.Observable<void>} Returns an observable stream of text editor changes.
     */
    private static createOnContentsChangingObservable(textEditor: TextEditor): Rx.Observable<void> {
        var addHandler =
            (h) => {
                return textEditor.onDidChange(h);
            };

        var removeHandler =
            (...args) => {
                var disposable = <Disposable>args[1];

                disposable.dispose();
            };

        return Rx.Observable.fromEventPattern<void>(addHandler, removeHandler);
    }

    /**
     * Returns an observable stream of text editor changes by subscribing to the underlying
     * Atom Text Editor.
     *
     * @param {TextEditor} textEditor - The Atom TextEditor.
     * @returns {Rx.Observable<void>} Returns an observable stream of text editor changes.
     */
    private static createOnContentsChangedObservable(textEditor: TextEditor): Rx.Observable<void> {
        var addHandler =
            (h) => {
                return textEditor.onDidStopChanging(h);
            };

        var removeHandler =
            (...args) => {
                var disposable = <Disposable>args[1];

                disposable.dispose();
            };

        return Rx.Observable.fromEventPattern<void>(addHandler, removeHandler);
    }

    /**
     * Returns an observable stream of text editor destroyed events by subscribing to the underlying
     * Atom Text Editor.
     *
     * @param {TextEditor} textEditor - The Atom TextEditor.
     * @returns {Rx.Observable<void>} Returns an observable stream of text editor destroyed events.
     */
    private static createOnDestroyObservable(textEditor: TextEditor): Rx.Observable<void> {
        var addHandler =
            (h) => {
                return textEditor.onDidDestroy(h);
            };

        var removeHandler =
            (...args) => {
                var disposable = <Disposable>args[1];

                disposable.dispose();
            };

        return Rx.Observable.fromEventPattern<void>(addHandler, removeHandler);
    }

    /**
     * Returns an observable stream of text editor cursor changed events by subscribing to the last cursor
     * added to the Text Editor.
     *
     * @param {TextEditor} textEditor - The Atom TextEditor.
     * @returns {Rx.Observable<void>} Returns an observable stream of text editor cursor changed events.
     */
    private static createOnCursorChangedPositionObservable(textEditor: TextEditor): Rx.Observable<void> {
        var addHandler =
            (h) => {
                return textEditor.getLastCursor().onDidChangePosition(h);
            };

        var removeHandler =
            (...args) => {
                var disposable = <Disposable>args[1];

                disposable.dispose();
            };

        return Rx.Observable.fromEventPattern<void>(addHandler, removeHandler);
    }
}

export = TypeScriptTextEditor;
