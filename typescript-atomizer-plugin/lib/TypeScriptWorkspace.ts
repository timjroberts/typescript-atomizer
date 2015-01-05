/// <reference path="./core/StringIndexDictionary.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/atom.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/TypeScriptServices.d.ts" />

import Rx = require("rx");
import TypeScriptTextEditor = require("./TypeScriptTextEditor");
import TypeScriptDiagnosticStatusBar = require("./TypeScriptDiagnosticStatusBar");
import TypeScriptDiagnosticStatusBarView = require("./TypeScriptDiagnosticStatusBarView");
import TypeScriptWorkspaceState = require("./TypeScriptWorkspaceState");

/**
 * Orchestrates the state of the user interface in regards to the open TypeScript text editors and any global
 * level views.
 */
class TypeScriptWorkspace implements Disposable
{
    private _atom: AtomGlobal;
    private _textEditorStates: StringIndexDictionary<TypeScriptWorkspaceState>;
    private _workspace: Workspace;
    private _workspaceView: WorkspaceView;
    private _viewRegistry: ViewRegistry;
    private _statusBar: TypeScriptDiagnosticStatusBar;
    private _disposables: Array<Disposable>;

    /**
     * Initializes a new {TypeScriptWorkspace}.
     *
     * @param {AtomGlobal} atom - The Atom global.
     * @param {Rx.Observable<TypeScriptTextEditor>} onTypeScriptTextEditorOpened - An observable stream of opened TypeScript text editors.
     * @param {Rx.Observable<TextEditor>} onTextEditorChanged - An observable stream of changes representing the current text editor.
     * text editors.
     */
    constructor(atom: AtomGlobal, onTypeScriptTextEditorOpened: Rx.Observable<TypeScriptTextEditor>, onTextEditorChanged: Rx.Observable<TextEditor>)
    {
        this._atom = atom;
        this._textEditorStates = { };
        this._workspace = atom.workspace;
        this._workspaceView = atom.workspaceView;
        this._viewRegistry = atom.views;
        this._statusBar = null;

        onTypeScriptTextEditorOpened.subscribe((tsTextEditor: TypeScriptTextEditor) => this.onTypeScriptTextEditorOpened.call(this, tsTextEditor));
        onTextEditorChanged.subscribe((textEditor: TextEditor) => this.onTextEditorChanged.call(this, textEditor));

        this._disposables =
            [
                this._atom.commands.add("atom-text-editor[data-grammar='source typescript']",
                                                               "typescript-atomizer-autocomplete:toggle",
                                                               (htmlEvent: Event) => this.onToggleAutoComplete.call(this, htmlEvent)),
                this._atom.commands.add("atom-text-editor[mini]",
                                                               "typescript-atomizer-autocomplete:toggle",
                                                               (htmlEvent: Event) => this.onToggleAutoComplete.call(this, htmlEvent))
            ];
    }

    /**
     * Disposes of the current TypeScript workspace.
     */
    public dispose(): void
    {
        this._disposables
            .forEach((disposable: Disposable) =>
            {
                disposable.dispose();
            });
    }

    /**
     * Called when a TypeScript text editor has been opened in the Atom workspace.
     *
     * @param {TypeScriptTextEditor} tsTextEditor - The TypeScript text editor that has been opened.
     */
    private onTypeScriptTextEditorOpened(typescriptTextEditor: TypeScriptTextEditor): void
    {
        this._textEditorStates[typescriptTextEditor.path] = new TypeScriptWorkspaceState(typescriptTextEditor);

        typescriptTextEditor.onContentsChaning
            .subscribe((tsTextEditor) => this.onTypeScriptTextEditorContentsChanging.call(this, tsTextEditor));
        typescriptTextEditor.onContentsChanged
            .subscribe((tsTextEditor) => this.onTypeScriptTextEditorContentsChanged.call(this, tsTextEditor));

        typescriptTextEditor.onCursorPositionChanged
            .subscribe((point) => this.onCursorPositionChanged.call(this, typescriptTextEditor, point));

        typescriptTextEditor.onClosed
            .subscribe((tsTextEditor: TypeScriptTextEditor) => this.onTypeScriptTextEditorClosed.call(this, tsTextEditor));
    }

    /**
     * Called when a text editor has been given focus in the Atom workspace.
     *
     * @param {TextEditor} textEditor - The text editor that has received focus in the Atom workspace.
     */
    private onTextEditorChanged(textEditor: TextEditor): void
    {
        var statusBar: TypeScriptDiagnosticStatusBar = this.getStatusBar();

        if (textEditor === undefined || textEditor.getGrammar().name !== "TypeScript")
        {
            statusBar.hide();
            return;
        }

        this.updateStatusBar(this._textEditorStates[TypeScript.switchToForwardSlashes(textEditor.getPath())]);
    }

    /**
     * Called when the contents of a TypeScript text editor has began to change.
     *
     * @param {TypeScriptTextEditor} typescriptTextEditor - The TypeScript text editor.
     */
    public onTypeScriptTextEditorContentsChanging(typescriptTextEditor: TypeScriptTextEditor)
    {
        var state = this._textEditorStates[typescriptTextEditor.path];

        state.contentsChanging = true;
    }

    /**
     * Called when the contents of a TypeScript text editor changes.
     *
     * @param {TypeScriptTextEditor} typescriptTextEditor - The TypeScript text editor.
     */
    private onTypeScriptTextEditorContentsChanged(typescriptTextEditor: TypeScriptTextEditor): void
    {
        var state = this._textEditorStates[typescriptTextEditor.path];

        if (state.autoCompleteInProgress)
            return;

        state.contentsChanging = false;
        state.updateFromTypeScriptDiagnostics(typescriptTextEditor.getLanguageDiagnostics());

        this.updateStatusBar(state);
    }

    /**
     * Called when the cursor position has changed within a TypeScript text editor.
     *
     * @param {ts.Diagnostic} diagnostic - The diagnostic that has been selected.
     */
    private onCursorPositionChanged(typescriptTextEditor: TypeScriptTextEditor, point: Point): void
    {
        var state = this._textEditorStates[typescriptTextEditor.path];

        state.updateFromCursorPosition(point);
        this.updateStatusBar(state);
    }

    /**
     * Called when a TypeScript text editor has been closed in the Atom workspace.
     *
     * @param {TypeScriptTextEditor} typescriptTextEditor - The TypeScript text editor that has been closed.
     */
    private onTypeScriptTextEditorClosed(typescriptTextEditor: TypeScriptTextEditor): void
    {
        var state = this._textEditorStates[typescriptTextEditor.path];

        state.dispose();

        this._textEditorStates[typescriptTextEditor.path] = undefined;
    }

    /**
     * Called when the auto-complete 'toggle' command has been activated.
     */
    private onToggleAutoComplete(htmlEvent: Event)
    {
        var textEditor: TextEditor = this._workspace.getActiveTextEditor();

        if (textEditor.getGrammar().name !== "TypeScript")
        {
            (<any>htmlEvent).abortKeyBinding();

            return;
        }

        htmlEvent.stopPropagation();

        var state: TypeScriptWorkspaceState = this._textEditorStates[TypeScript.switchToForwardSlashes(textEditor.getPath())];

        this.executeAfterContentChange(state, () => state.toggleAutoComplete());
    }

    /**
     * Updates the TypeScript diagnostic status bar with the supplied state.
     *
     * @param {TypeScriptTextEditorStatusBarState} state - The state which will be used to update the status bar. If not
     * specified, then state is retrieved for the currently active text editor.
     */
    private updateStatusBar(state: TypeScriptWorkspaceState): void
    {
        if (this._workspace.getActiveTextEditor() !== state.typescriptTextEditor.textEditor)
            return; // The state being updated is not for the active TextEditor

        var statusBar: TypeScriptDiagnosticStatusBar = this.getStatusBar();

        statusBar.inError = state.inError;
        statusBar.message = state.message;

        statusBar.show();
    }

    /**
     * Returns the TypeScript diagnostic status bar, and sets up the associated global level view.
     *
     * @returns {TypeScriptDiagnosticStatusBar} The model representing the TypeScript diagnostic status bar.
     */
    private getStatusBar(): TypeScriptDiagnosticStatusBar
    {
        if (!this._statusBar)
        {
            this._statusBar = new TypeScriptDiagnosticStatusBar();

            var statusBarView = <ModelBasedHTMLElement<TypeScriptDiagnosticStatusBar>>this._viewRegistry.getView(this._statusBar);

            statusBarView.setModel(this._statusBar);

            if (this._workspaceView.statusBar)
            {
                statusBarView.classList.add("inline-block");

                this._workspaceView.statusBar.prependLeft(statusBarView);
            }
        }

        return this._statusBar;
    }

    /**
     * Delays execution of a function until a state indicates that it is no longer processing content changes.
     *
     * @param {TypeScriptWorkspaceState} state - The state object to track the content changing process on.
     * @param {Function} func - The function to execute when the 'contentsChanging' property of the supplied state
     * objects becomes false.
     */
    private executeAfterContentChange(state: TypeScriptWorkspaceState, func: Function): void
    {
        var intervalCount = 0;
        var maxIntervals = 3;

        var interval = setInterval(() =>
            {
                if (!state.contentsChanging || intervalCount++ > 3)
                {
                    func();
                    state.contentsChanging = false;

                    clearInterval(interval);
                }
            }, 150);
    }
}

export = TypeScriptWorkspace;
