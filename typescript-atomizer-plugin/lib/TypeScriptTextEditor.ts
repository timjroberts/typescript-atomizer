/// <reference path="../../typings/atom.d.ts" />
/// <reference path="../../typings/rx/rx.d.ts" />
/// <reference path="../../typings/TypeScriptServices.d.ts" />
/// <reference path="../../atomizer-core/atomizer-core.d.ts" />
/// <reference path="../../atomizer-views/atomizer-views.d.ts" />
/// <reference path="./core/HTMLExtensions.d.ts" />

import ObservableFactory = require("atomizer-core/ObservableFactory");
import Rx = require("rx");
import TypeScriptDocumentRegistry = require("./TypeScriptDocumentRegistry");
import TypeScriptDocument = require("./TypeScriptDocument");
import CompositeDisposable = require("atomizer-core/CompositeDisposable");
import HtmlElementAdapter = require("atomizer-views/HtmlElementAdapter");
import TypeScriptQuickInfo = require("./TypeScriptQuickInfo");

/**
 * Represents all the essential state for a text buffer opened upon a TypeScript
 * document. This includes markers that represent TypeScript diagnostic messages.
 */
class TypeScriptTextEditor implements ts.LanguageServiceHost
{
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
    private _onMouseHoverPositionChanged: Rx.Subject<Point>;
    private _onBeforePathChanged: Rx.Subject<TypeScriptTextEditor>;
    private _textEditorElement: TextEditorElement;
    private _htmlElement: HTMLElement;

    /**
     * Initializes a new {TypeScriptTextEditor}.
     *
     * @param {TextEditor} textEditor - The Atom TextEditor which will be used to reflect the associated
     * TypeScript document state.
     * @param {TypeScriptDocumentRegistry} documentRegistry - The TypeScript document registry that can be used
     * to manage TypeScript document references.
     */
    constructor(textEditor: TextEditor, documentRegistry: TypeScriptDocumentRegistry)
    {
        this._textEditor = textEditor;
        this._textBuffer = this._textEditor.getBuffer();
        this._documentRegistry = documentRegistry;
        this._normalizedPath = TypeScript.switchToForwardSlashes(this._textEditor.getPath());

        this._onClosed = new Rx.Subject<TypeScriptTextEditor>();
        this._onContentsChanging = new Rx.Subject<TypeScriptTextEditor>();
        this._onContentsChanged = new Rx.Subject<TypeScriptTextEditor>();
        this._onCursorPositionChanged = new Rx.Subject<Point>();
        this._onMouseHoverPositionChanged = new Rx.Subject<Point>();
        this._onBeforePathChanged = new Rx.Subject<TypeScriptTextEditor>();

        this._textEditorElement = <TextEditorElement>atom.views.getView(textEditor);
        this._htmlElement = (<any>this._textEditorElement).shadowRoot.getElementsByClassName("lines")[0];

        var subscriptions = new CompositeDisposable();
        var editorViewAdapter = new HtmlElementAdapter(this._htmlElement);

        subscriptions.push(ObservableFactory.createDisposableObservable<void>((h) => this._textEditor.onDidChange(h))
            .subscribe(() =>
            {
                this._onContentsChanging.onNext(this);
            }));

        subscriptions.push(ObservableFactory.createDisposableObservable<void>((h) => this._textEditor.onDidStopChanging(h))
            .subscribe(() =>
            {
                this._onContentsChanged.onNext(this);
            }));

        subscriptions.push(ObservableFactory.createDisposableObservable<void>((h) => this._textEditor.getLastCursor().onDidChangePosition(h))
            .select((_, idx: number, obs: Rx.Observable<void>) =>
            {
                return this._textEditor.getLastCursor().getScreenPosition();
            })
            .subscribe((point: Point) =>
            {
                this._onCursorPositionChanged.onNext(point);
            }));

        subscriptions.push(ObservableFactory.createDisposableObservable<void>((h) => this._textEditor.onDidChangePath(h))
            .subscribe(() =>
            {
                this.onPathChanged(this._textEditor.getPath());
                this._onBeforePathChanged.onNext(this);
            }));

        subscriptions.push(ObservableFactory.createDisposableObservable<void>((h) => this._textEditor.onDidDestroy(h))
            .subscribe(() =>
            {
                editorViewAdapter.dispose();

                this._onClosed.onNext(this);

                this._onContentsChanging.onCompleted();
                this._onContentsChanged.onCompleted();
                this._onCursorPositionChanged.onCompleted();
                this._onMouseHoverPositionChanged.onCompleted();
                this._onBeforePathChanged.onCompleted();
                this._onClosed.onCompleted();

                subscriptions.dispose();

                this._languageService.dispose();
            }));

        subscriptions.push(editorViewAdapter.onMouseMove.subscribe((e) => this.onMouseMove.call(this, e)));
        subscriptions.push(editorViewAdapter.onMouseOut.subscribe((e) => this.onMouseOut.call(this, e)));
        subscriptions.push(editorViewAdapter.onMouseHover.subscribe((e) => this.onMouseHover.call(this, e)));

        this._documentRegistry.openBufferedDocumentForEditor(this);
        this._languageService = ts.createLanguageService(this, this._documentRegistry);
    }

    /**
     * Get the unique identifier of the current TypeScript text editor.
     */
    public get id(): number
    {
        return this._textEditor.id;
    }

    /**
     * Gets the underlying text editor being wrapped by the current TypeScript text editor.
     */
    public get textEditor(): TextEditor
    {
        return this._textEditor;
    }

    /**
     * Gets the full path of the current TypeScript text editor.
     */
    public get path(): string
    {
        return this._normalizedPath;
    }

    /**
     * Gets the underlying Atom TextBuffer.
     */
    public get textBuffer(): TextBuffer
    {
        return this._textBuffer;
    }

    /**
     * Gets an observable that when subscribed to will indicate when the TypeScript text
     * editor is closed.
     */
    public get onClosed(): Rx.Observable<TypeScriptTextEditor>
    {
        return this._onClosed;
    }

    /**
     * Gets an observable that when subscribed to will indicate when the TypeScript text
     * editor contents have began changing.
     */
    public get onContentsChanging(): Rx.Observable<TypeScriptTextEditor>
    {
        return this._onContentsChanging;
    }

    /**
     * Gets an observable that when subscribed to will indicate when the TypeScript text
     * editor contents change.
     */
    public get onContentsChanged(): Rx.Observable<TypeScriptTextEditor>
    {
        return this._onContentsChanged;
    }

    /**
     * Gets an observable that when subscribed to will indicate when the cursor position
     * has changed in the editor.
     */
    public get onCursorPositionChanged(): Rx.Observable<Point>
    {
        return this._onCursorPositionChanged;
    }

    /**
     * Gets an observable that when subscribed to will yield data about changes in buffer positions
     * for which the mouse has hovered over.
     */
    public get onMouseHoverPositionChanged(): Rx.Observable<Point>
    {
        return this._onMouseHoverPositionChanged;
    }

    /**
     * Gets an observable that when subscribed to will indicate when the underlying path has changed.
     */
    public get onBeforePathChanged(): Rx.Observable<TypeScriptTextEditor>
    {
        return this._onBeforePathChanged;
    }

    /**
     * Retrieves the current TypeScript diagnostic messages.
     */
    public getLanguageDiagnostics(): Array<ts.Diagnostic>
    {
        var diagnostics =
            this._languageService.getSyntacticDiagnostics(this._normalizedPath)
                                 .concat(this._languageService.getSemanticDiagnostics(this._normalizedPath));

        return diagnostics ? diagnostics : [ ];
    }

    /**
     * Logs a message.
     *
     * @param {string} message - The message to be logged.
     */
    public log(message: string): void
    {
        console.log(message + " (" + this._normalizedPath + ")");
    }

    /**
     * Retrieves the known script paths.
     *
     * @returns {Array<string>} An array of strings representing the full paths of the TypeScript documents
     * referenced by the current TypeScript text editor.
     */
    public getScriptFileNames(): Array<string>
    {
        return this._documentRegistry.getScriptFileNamesForEditor(this);
    }

    /**
     * Retrieves the version of a given TypeScript document.
     *
     * @returns {string} The version of the TypeScript document associated with the supplied path.
     */
    public getScriptVersion(filename: string): string
    {
        return this._documentRegistry.getDocument(filename).version;
    }

    /**
     * Retrieves a boolean indicator to determine if a TypeScript document is 'open'.
     *
     * @returns {boolean} true if the TypeScript document is currently open in the Atom workspace; otherwise false.
     */
    public getScriptIsOpen(filename: string): boolean
    {
        return false;
    }

    /**
     * Retrieves the byte order mark of a given TypeScript document.
     */
    public getScriptByteOrderMark(filename: string): ts.ByteOrderMark
    {
        return this._documentRegistry.getDocument(filename).byteOrderMark;
    }

    /**
     * Retrieves the script snapshot from the contents of the TypeScript document.
     */
    public getScriptSnapshot(filename: string): TypeScript.IScriptSnapshot
    {
        var typescriptDocument: TypeScriptDocument = this._documentRegistry.getDocument(filename);

        return TypeScript.ScriptSnapshot.fromString(typescriptDocument.text);
    }

    /**
     * Retrieves localized diagnostic messages.
     *
     * Returns null allowing TypeScript to localize the diagnostic messages that it produces.
     */
    public getLocalizedDiagnosticMessages(): any
    {
        return null; // Use the TypeScript localized messages
    }

    /**
     * Retrieves a cancellation token.
     */
    public getCancellationToken(): ts.CancellationToken
    {
        return null;
    }

    /**
     * Retrieves the full path to the TypeScript default library declaration file.
     */
    public getDefaultLibFilename(): string
    {
        return this._documentRegistry.getDefaultLibFilename();
    }

    /**
     * Retrieves the compilation settings for the current TypeScript text editor.
     */
    public getCompilationSettings(): ts.CompilerOptions
    {
        var settings: ts.CompilerOptions =
            {
                noLib: false,
                module: ts.ModuleKind.CommonJS, //ts.ModuleKind.None,
                target: ts.ScriptTarget.ES5,
                noResolve: false
            }

        return settings;
    }

    /**
     * Retrieves the TypeScript code completion information from the current cursor position.
     */
    public getEditorCodeCompletionsForCursor(): ts.CompletionInfo
    {
        var cursorPosition: Point = this._textEditor.getCursorBufferPosition();
        var cursorScope: ScopeDescriptor = this._textEditor.scopeDescriptorForBufferPosition(cursorPosition);
        var typescriptPosition: number = TypeScriptTextEditor.bufferPositionToTypeScriptPosition(this._textEditor, cursorPosition);

        try
        {
            return this._languageService.getCompletionsAtPosition(this._normalizedPath, typescriptPosition, true);
        }
        catch (error)
        { }
    }

    /**
     * Retrieves the TypeScript quick-info details for a given buffer position (or the current cursor position
     * if not supplied).
     *
     * @param bufferPosition (optional) The buffer position to obtain a quick-info object for.
     */
    public getQuickInfoForBufferPosition(bufferPosition?: Point): ts.QuickInfo
    {
        if (!bufferPosition)
            bufferPosition = this._textEditor.getCursorBufferPosition();

        var typescriptPosition: number = TypeScriptTextEditor.bufferPositionToTypeScriptPosition(this._textEditor, bufferPosition);

        return this._languageService.getQuickInfoAtPosition(this._normalizedPath, typescriptPosition);
    }

    /**
     * called when the path of the underlying text buffer changes.
     *
     * @param newPath The new path of the text buffer.
     */
    private onPathChanged(newPath: string): void
    {
        var normalizedNewPath = TypeScript.switchToForwardSlashes(newPath);

        this._documentRegistry.updateDocumentPath(this, normalizedNewPath);
        this._normalizedPath = normalizedNewPath;
    }

    /**
     * called when the mouse pointer moves over the text editor.
     *
     * @param htmlEvent The event data.
     */
    private onMouseMove(htmlEvent: Event): void
    {
        this._onMouseHoverPositionChanged.onNext(null);
    }

    /**
     * called when the mouse pointer moves out of the text editor.
     *
     * @param htmlEvent The event data.
     */
    private onMouseOut(htmlElement: Event): void
    {
        this._onMouseHoverPositionChanged.onNext(null);
    }

    /**
     * called when the mouse pointer hovers over the text editor.
     *
     * Will place an event in the 'onMouseHoverPositionChanged' observable.
     *
     * @param htmlEvent The event data.
     */
    private onMouseHover(htmlEvent: Event): void
    {
        var rect: ClientRect = this._htmlElement.getBoundingClientRect();

        var pos =
            {
                top: (<any>htmlEvent).clientY - rect.top,
                left: (<any>htmlEvent).clientX - rect.left
            };

        var screenPosition: Point = this._textEditor.screenPositionForPixelPosition(pos);
        var bufferPosition: Point = this._textEditor.bufferPositionForScreenPosition(screenPosition);

        var currentCharacterPixel = this._textEditorElement.pixelPositionForBufferPosition(bufferPosition);
        var nextCharacterPixel = this._textEditorElement.pixelPositionForBufferPosition([bufferPosition.row, bufferPosition.column + 1]);

        this._onMouseHoverPositionChanged.onNext(currentCharacterPixel.left >= nextCharacterPixel.left ? null : bufferPosition);
    }

    private static bufferPositionToTypeScriptPosition(textEditor: TextEditor, bufferPos: Point): number
    {
        var bufferLineStartPositions: number[] = TypeScript.TextUtilities.parseLineStarts(textEditor.getText());

        return bufferLineStartPositions[bufferPos.row] + bufferPos.column;
    }
}

export = TypeScriptTextEditor;
