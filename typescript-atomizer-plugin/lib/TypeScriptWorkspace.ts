/// <reference path="./HTMLExtensions.d.ts" />
/// <reference path="./StringIndexDictionary.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/atom.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/TypeScriptServices.d.ts" />

import Rx = require("rx");
import TypeScriptTextEditor = require("./TypeScriptTextEditor");
import TypeScriptDiagnosticStatusBar = require("./TypeScriptDiagnosticStatusBar");
import TypeScriptDiagnosticStatusBarView = require("./TypeScriptDiagnosticStatusBarView");

/**
 * A private class that represents the status bar state for an active TypeScript text editor.
 */
class TypeScriptTextEditorStatusBarState {
    private _inError: boolean;
    private _defaultMessage: string;
    private _currentMessage: string;

    /**
     * Updates the current state from the supplied TypeScript diagnostics.
     *
     * @param {Array<ts.Diagnostic>} diagnostics - The array of diagnostics from which the current state should be updated.
     */
    public updateFromDiagnostics(diagnostics: Array<ts.Diagnostic>): void {
        this._inError = diagnostics.length > 0;
        this._defaultMessage = this._inError ? diagnostics.length + " error(s)" : "";
        this._currentMessage = null;
    }

    /**
     * Gets a flag indicating whether the TypeScript text editor has diagnostic errors.
     */
    public get inError(): boolean { return this._inError; }

    /**
     * Gets a message to display (usually a TypeScript diagnostic error).
     */
    public get message(): string { return this._currentMessage !== null ? this._currentMessage : this._defaultMessage; }
    /**
     * Sets a message to display.
     *
     * @param {string} value - The message to be displayed. If null is specified, then the 'message' becomes
     * the default message determined by the current diagnostics.
     */
    public set message(value: string) {
        this._currentMessage = value;
    }
}

/**
 * Orchestrates the state of the user interface in regards to the open TypeScript text editors and any global
 * level views.
 */
class TypeScriptWorkspace {
    private _textEditorStates: StringIndexDictionary<TypeScriptTextEditorStatusBarState>;
    private _workspace: Workspace;
    private _workspaceView: WorkspaceView;
    private _viewRegistry: ViewRegistry
    private _statusBar: TypeScriptDiagnosticStatusBar;
    private _activeTextEditor: TextEditor;

    /**
     * Initializes a new {TypeScriptWorkspace}.
     *
     * @param {AtomGlobal} atom - The Atom global.
     * @param {Rx.Observable<TypeScriptTextEditor>} onTypeScriptTextEditorOpened - An observable stream of opened TypeScript text editors.
     * @param {Rx.Observable<TextEditor>} onTextEditorChanged - An observable stream of changes representing the current text editor.
     * text editors.
     */
    constructor(atom: AtomGlobal, onTypeScriptTextEditorOpened: Rx.Observable<TypeScriptTextEditor>, onTextEditorChanged: Rx.Observable<TextEditor>) {
        this._textEditorStates = { };
        this._workspace = atom.workspace;
        this._workspaceView = atom.workspaceView;
        this._viewRegistry = atom.views;
        this._statusBar = null;

        this._activeTextEditor = this._workspace.getActiveTextEditor();

        onTypeScriptTextEditorOpened.subscribe((tsTextEditor: TypeScriptTextEditor) => this.onTypeScriptTextEditorOpened.call(this, tsTextEditor));
        onTextEditorChanged.subscribe((textEditor: TextEditor) => this.onTextEditorChanged.call(this, textEditor));
    }

    /**
     * Called when a TypeScript text editor has been opened in the Atom workspace.
     *
     * @param {TypeScriptTextEditor} tsTextEditor - The TypeScript text editor that has been opened.
     */
    private onTypeScriptTextEditorOpened(tsTextEditor: TypeScriptTextEditor): void {
        tsTextEditor.onDiagnosticsChanged
            .filter((te: TypeScriptTextEditor, idx: number, obs: Rx.Observable<TypeScriptTextEditor>): boolean => {
                    return true; // TODO: Filter on the active text editor
                })
            .subscribe((tsTextEditor) => this.onTypeScriptTextEditorDiagnosticsChanged.call(this, tsTextEditor));

        tsTextEditor.onDiagnosticSelected
            .subscribe((diagnostic) => this.onTypeScriptDiagnosticSelected.call(this, diagnostic));

        tsTextEditor.onClosed
            .subscribe((tsTextEditor: TypeScriptTextEditor) => this.onTypeScriptTextEditorClosed.call(this, tsTextEditor));
    }

    /**
     * Called when a text editor has been given focus in the Atom workspace.
     *
     * @param {TextEditor} textEditor - The text editor that has received focus in the Atom workspace.
     */
    private onTextEditorChanged(textEditor: TextEditor): void {
        var statusBar: TypeScriptDiagnosticStatusBar = this.getStatusBar();

        if (textEditor === undefined || textEditor.getGrammar().name !== "TypeScript") {
            statusBar.hide();
            return;
        }

        this._activeTextEditor = textEditor;

        this.updateStatusBar();
    }

    /**
     * Called when the diagnostics change within a TypeScript text editor.
     *
     * @param {TypeScriptTextEditor} tsTextEditor - The TypeScript text editor for which diagnostics have changed.
     */
    private onTypeScriptTextEditorDiagnosticsChanged(tsTextEditor: TypeScriptTextEditor): void {
        var state: TypeScriptTextEditorStatusBarState = this.getOrCreateTypeScriptTextEditorStatusBarState(this._activeTextEditor.getPath());

        state.updateFromDiagnostics(tsTextEditor.getLanguageDiagnostics());

        this.updateStatusBar(state);
    }

    /**
     * Called when a diagnostic has been selected within a TypeScript text editor.
     *
     * @param {ts.Diagnostic} diagnostic - The diagnostic that has been selected.
     */
    private onTypeScriptDiagnosticSelected(diagnostic: ts.Diagnostic): void {
        var state: TypeScriptTextEditorStatusBarState = this.getOrCreateTypeScriptTextEditorStatusBarState(this._activeTextEditor.getPath());

        state.message = diagnostic ? diagnostic.messageText : null;

        this.updateStatusBar(state);
    }

    /**
     * Called when a TypeScript text editor has been closed in the Atom workspace.
     *
     * @param {TypeScriptTextEditor} tsTextEditor - The TypeScript text editor that has been closed.
     */
    private onTypeScriptTextEditorClosed(tsTextEditor: TypeScriptTextEditor): void {
        this._textEditorStates[tsTextEditor.path] = undefined;
    }

    /**
     * Updates the TypeScript diagnostic status bar with the supplied state.
     *
     * @param {TypeScriptTextEditorStatusBarState} state - The state which will be used to update the status bar. If not
     * specified, then state is retrieved for the currently active text editor.
     */
    private updateStatusBar(state?: TypeScriptTextEditorStatusBarState): void {
        if (!state) state = this.getOrCreateTypeScriptTextEditorStatusBarState(this._activeTextEditor.getPath());

        var statusBar: TypeScriptDiagnosticStatusBar = this.getStatusBar();

        statusBar.inError = state.inError;
        statusBar.message = state.message;

        statusBar.show();
    }

    /**
     * Creates or returns an existing status bar state object for a given path.
     *
     * @param {string} path - The full path for which a state object is required.
     */
    private getOrCreateTypeScriptTextEditorStatusBarState(path: string): TypeScriptTextEditorStatusBarState {
        var state: TypeScriptTextEditorStatusBarState = this._textEditorStates[path];

        if (!state) {
            state = new TypeScriptTextEditorStatusBarState();

            this._textEditorStates[path] = state;
        }

        return state;
    }

    /**
     * Returns the TypeScript diagnostic status bar, and sets up the associated global level view.
     *
     * @returns {TypeScriptDiagnosticStatusBar} The model representing the TypeScript diagnostic status bar.
     */
    private getStatusBar(): TypeScriptDiagnosticStatusBar {
        if (!this._statusBar) {
            this._statusBar = new TypeScriptDiagnosticStatusBar();

            var statusBarView = <ModelBasedHTMLElement<TypeScriptDiagnosticStatusBar>>this._viewRegistry.getView(this._statusBar);

            statusBarView.setModel(this._statusBar);

            if (this._workspaceView.statusBar) {
                statusBarView.classList.add("inline-block");

                this._workspaceView.statusBar.prependLeft(statusBarView);
            }
        }

        return this._statusBar;
    }
}

export = TypeScriptWorkspace;
