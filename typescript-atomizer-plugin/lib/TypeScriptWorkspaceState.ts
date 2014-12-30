import TypeScriptTextEditor = require("./TypeScriptTextEditor");
import TypeScriptAutoCompleteView = require("./TypeScriptAutoCompleteView");

/**
 * A private class that represents the global state for an active TypeScript text editor that is
 * open in the document registry and managed in the TypeScript workspace.
 */
class TypeScriptWorkspaceState {
    private _typescriptTextEditor: TypeScriptTextEditor;
    private _autoCompleteView: TypeScriptAutoCompleteView;
    private _inError: boolean;
    private _defaultMessage: string;
    private _currentMessage: string;

    /**
     * Initializes a new state object for a given TypeScript text editor.
     *
     * @param {TypeScriptTextEditor} typescriptTextEditor - The TypeScript text editor that the state will apply to.
     */
    constructor(typescriptTextEditor: TypeScriptTextEditor) {
        this._typescriptTextEditor = typescriptTextEditor;
        this._autoCompleteView = new TypeScriptAutoCompleteView(typescriptTextEditor);
    }

    /**
     * Gets the TypeScript text editor for which the state applies.
     */
    public get typescriptTextEditor(): TypeScriptTextEditor { return this._typescriptTextEditor; }

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

    public get autoCompleteInProgress(): boolean { return this._autoCompleteView.isVisible(); }

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
     * Toggles the auto-complete view for the associated TypeScript text editor.
     */
    public toggleAutoComplete(): void {
        this._autoCompleteView.toggle();
    }
}

export = TypeScriptWorkspaceState;
