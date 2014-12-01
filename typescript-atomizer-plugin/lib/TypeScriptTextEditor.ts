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
    private _diagnosticMarkers: Array<Marker>;
    private _onClosed: Rx.Subject<TypeScriptTextEditor>;
    private _onContentsChanged: Rx.Subject<TypeScriptTextEditor>;
    private _onDiagnosticsChanged: Rx.Subject<TypeScriptTextEditor>;

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
        this._diagnosticMarkers = [];
        this._diagnostics = [];

        this._onClosed = new Rx.Subject<TypeScriptTextEditor>();
        this._onContentsChanged = new Rx.Subject<TypeScriptTextEditor>();
        this._onDiagnosticsChanged = new Rx.Subject<TypeScriptTextEditor>();

        var onContentsChangedSubscription =
            TypeScriptTextEditor.createOnContentsChangedObservable(this._textEditor)
                .subscribe(() => {
                        this._onContentsChanged.onNext(this);

                        this.performDiagnostics.call(this);
                        this._onDiagnosticsChanged.onNext(this);
                    });

        var onDestroySubscription =
            TypeScriptTextEditor.createOnDestroyObservable(this._textEditor)
                .subscribe(() => {
                        this._onClosed.onNext(this);

                        this._onDiagnosticsChanged.onCompleted();
                        this._onContentsChanged.onCompleted();
                        this._onClosed.onCompleted();

                        onContentsChangedSubscription.dispose();
                        onDestroySubscription.dispose();

                        this.disposeCurrentDiagnosticMarkers();
                        this._languageService.dispose();
                    });

        this._documentRegistry.openBufferedDocumentForEditor(this);
        this._languageService = ts.createLanguageService(this, this._documentRegistry);
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
     * editor contents change.
     */
    public get onContentsChanged(): Rx.Observable<TypeScriptTextEditor> {
        return this._onContentsChanged;
    }

    /**
     * Retrieves the current TypeScript diagnostic messages.
     */
    public getLanguageDiagnostics(): Array<ts.Diagnostic> {
        return this._diagnostics;
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
     * Destroys the existing markers representing TypeScript diagnostic messages.
     */
    private disposeCurrentDiagnosticMarkers(): void {
        this._diagnosticMarkers.forEach((diagnosticMarker: Marker) => {
                diagnosticMarker.destroy();
            });
    }

    /**
     * Requests diagnostics from the underlying TypeScript language services for the current TypeScript text
     * editor and creates markers for any diagnostic message returned.
     */
    private performDiagnostics(): void {
        this.disposeCurrentDiagnosticMarkers();

        this._diagnostics = this._languageService.getSemanticDiagnostics(this._normalizedPath);

        if (!Array.isArray(this._diagnostics) || this._diagnostics.length === 0) return;

        var bufferLineStartPositions: number[] = TypeScript.TextUtilities.parseLineStarts(this._textEditor.getText());

        this._diagnostics.forEach((diagnostic: ts.Diagnostic) => {
                var linePos = ArrayUtils.findIndex(bufferLineStartPositions, (pos: number) => { return diagnostic.start < pos; });

                if (linePos < 0) {
                    linePos = bufferLineStartPositions.length;
                }

                linePos--;

                var columnPos = diagnostic.start - bufferLineStartPositions[linePos];

                var start: Point = this._textEditor.screenPositionForBufferPosition([linePos, columnPos]);
                var end: Point   = this._textEditor.screenPositionForBufferPosition([linePos, columnPos + diagnostic.length]);

                var diagnosticMarker: Marker = this._textEditor.markScreenRange([start, end], { invalidate: "never" });

                this._diagnosticMarkers.push(diagnosticMarker);

                this._textEditor.decorateMarker(diagnosticMarker, { type: "highlight", class: "typescript-error" });
            });

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
}

export = TypeScriptTextEditor;
