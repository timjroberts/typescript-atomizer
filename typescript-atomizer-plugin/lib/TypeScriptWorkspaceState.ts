/// <reference path="../node_modules/typescript-atomizer-typings/TypeScriptServices.d.ts" />

import ArrayUtils = require("./ArrayUtils");
import TypeScriptTextEditor = require("./TypeScriptTextEditor");
import TypeScriptAutoCompleteView = require("./TypeScriptAutoCompleteView");

/**
 * A private class that represents the global state for an active TypeScript text editor that is
 * open in the document registry and managed in the TypeScript workspace.
 */
class TypeScriptWorkspaceState implements Disposable {
    private _typescriptTextEditor: TypeScriptTextEditor;
    private _autoCompleteView: TypeScriptAutoCompleteView;
    private _inError: boolean;
    private _defaultMessage: string;
    private _currentMessage: string;
    private _diagnostics: Array<ts.Diagnostic>;
    private _diagnosticMarkers: Array<Marker>;

    /**
     * Initializes a new state object for a given TypeScript text editor.
     *
     * @param {TypeScriptTextEditor} typescriptTextEditor - The TypeScript text editor that the state will apply to.
     */
    constructor(typescriptTextEditor: TypeScriptTextEditor) {
        this._typescriptTextEditor = typescriptTextEditor;
        this._autoCompleteView = new TypeScriptAutoCompleteView(typescriptTextEditor);

        this._diagnostics = [ ];
        this._diagnosticMarkers = [ ];
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

    /**
     * Gets a flag indicating whether the auto-complete view is active.
     */
    public get autoCompleteInProgress(): boolean { return this._autoCompleteView.isVisible(); }

    /**
     * Disposes of the current TypeScript workspace state.
     */
    public dispose(): void {
        this.disposeCurrentDiagnosticMarkers();
    }

    /**
     * Updates the current state from the supplied TypeScript diagnostics.
     *
     * @param {Array<ts.Diagnostic>} diagnostics - The array of diagnostics from which the current state should be updated.
     */
    public updateFromTypeScriptDiagnostics(diagnostics: Array<ts.Diagnostic>): void {
        this._diagnostics = diagnostics;
        this._inError = diagnostics.length > 0;
        this._defaultMessage = this._inError ? diagnostics.length + " error(s)" : "";
        this._currentMessage = null;

        this.disposeCurrentDiagnosticMarkers();

        var textEditor = this._typescriptTextEditor.textEditor;
        var bufferLineStartPositions: number[] = TypeScript.TextUtilities.parseLineStarts(textEditor.getText());

        this._diagnostics.forEach((diagnostic: ts.Diagnostic) => {
                var linePos = ArrayUtils.findIndex(bufferLineStartPositions, (pos: number) => { return diagnostic.start < pos; });

                if (linePos < 0) {
                    linePos = bufferLineStartPositions.length;
                }

                linePos--;

                var columnPos = diagnostic.start - bufferLineStartPositions[linePos];

                var start: Point = textEditor.screenPositionForBufferPosition([linePos, columnPos]);
                var end: Point   = textEditor.screenPositionForBufferPosition([linePos, columnPos + diagnostic.length]);

                var diagnosticMarker: Marker = textEditor.markScreenRange([start, end], { invalidate: "never" });

                this._diagnosticMarkers.push(diagnosticMarker);

                textEditor.decorateMarker(diagnosticMarker, { type: "highlight", class: "typescript-error" });
            });
    }

    public updateFromCursorPosition(cursorPosition: Point) {
        var index: number =
            ArrayUtils.findIndex(this._diagnosticMarkers, (marker: Marker) => { return marker.getScreenRange().containsPoint(cursorPosition); });

        this.message =
            index >= 0
            ? this._diagnostics[index].messageText
            : null;
    }

    /**
     * Toggles the auto-complete view for the associated TypeScript text editor.
     */
    public toggleAutoComplete(): void {
        this._autoCompleteView.toggle();
    }

    /**
     * Destroys the existing markers representing TypeScript diagnostic messages.
     */
    private disposeCurrentDiagnosticMarkers(): void {
        this._diagnosticMarkers.forEach((diagnosticMarker: Marker) => {
                diagnosticMarker.destroy();
            });

        this._diagnosticMarkers = [];
    }
}

export = TypeScriptWorkspaceState;
