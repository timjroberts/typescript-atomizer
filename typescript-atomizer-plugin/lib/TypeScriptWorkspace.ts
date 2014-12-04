/// <reference path="./HTMLExtensions.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/atom.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/TypeScriptServices.d.ts" />

import Rx = require("rx");
import TypeScriptTextEditor = require("./TypeScriptTextEditor");
import TypeScriptDiagnosticStatusBar = require("./TypeScriptDiagnosticStatusBar");
import TypeScriptDiagnosticStatusBarView = require("./TypeScriptDiagnosticStatusBarView");

/**
 * Orchestrates the state of the user interface in regards to the open TypeScript text editors and any global
 * level views.
 */
class TypeScriptWorkspace {
    private _workspaceView: WorkspaceView;
    private _viewRegistry: ViewRegistry
    private _statusBar: TypeScriptDiagnosticStatusBar;
    private _defaultStatusBarMessage: string;

    /**
     * Initializes a new {TypeScriptWorkspace}.
     *
     * @param {WorkspaceView} workspaceView - The Atom global Workspace view.
     * @param {ViewRegistry} viewRegistry - The Atom global view registry from which global level views can be obtained.
     * @param {Rx.Observable<TypeScriptTextEditor>} onTypeScriptTextEditorOpened - An observable stream of opened TypeScript
     * text editors.
     */
    constructor(workspaceView: WorkspaceView, viewRegistry: ViewRegistry, onTypeScriptTextEditorOpened: Rx.Observable<TypeScriptTextEditor>) {
        this._workspaceView = workspaceView;
        this._viewRegistry = viewRegistry;
        this._statusBar = null;

        onTypeScriptTextEditorOpened.subscribe((tsTextEditor: TypeScriptTextEditor) => this.onTypeScriptTextEditorOpened.call(this, tsTextEditor));
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
    }

    /**
     * Called when the diagnostics change within a TypeScript text editor.
     *
     * @param {TypeScriptTextEditor} tsTextEditor - The TypeScript text editor for which diagnostics have changed.
     */
    private onTypeScriptTextEditorDiagnosticsChanged(tsTextEditor: TypeScriptTextEditor): void {
        var diagnostics: Array<ts.Diagnostic> = tsTextEditor.getLanguageDiagnostics();
        var inError = diagnostics.length !== 0

        this._defaultStatusBarMessage = inError ? diagnostics.length + " error(s)" : "";

        var statusBar: TypeScriptDiagnosticStatusBar = this.getStatusBar();

        statusBar.error = inError;
        statusBar.message = this._defaultStatusBarMessage;
    }

    /**
     * Called when a diagnostic has been selected within a TypeScript text editor.
     *
     * @param {ts.Diagnostic} diagnostic - The diagnostic that has been selected.
     */
    private onTypeScriptDiagnosticSelected(diagnostic: ts.Diagnostic): void {
        this.getStatusBar().message = diagnostic ? diagnostic.messageText : this._defaultStatusBarMessage;
    }

    /**
     * Returns the TypeScript diagnostic status bar.
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
