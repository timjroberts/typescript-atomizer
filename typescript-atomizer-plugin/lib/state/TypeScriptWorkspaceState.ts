/// <reference path="../../../typings/TypeScriptServices.d.ts" />
/// <reference path="../../../atomizer-core/atomizer-core.d.ts" />

import ArrayUtils = require("atomizer-core/ArrayUtils");
import TypeScriptTextEditor = require("../TypeScriptTextEditor");
import TypeScriptAutoCompleteView = require("../TypeScriptAutoCompleteView");
import TypeScriptContextView = require("../TypeScriptContextView");
import DisposableArray = require("atomizer-core/DisposableArray");
import SelectionFixes = require("atomizer-views/SelectionFixes");
import TypeScriptAutoCompleteState = require("./TypeScriptAutoCompleteState");

/**
 * A private class that represents the global state for an active TypeScript text editor that is
 * open in the document registry and managed in the TypeScript workspace.
 */
class TypeScriptWorkspaceState implements Disposable
{
    private _typescriptTextEditor: TypeScriptTextEditor;
    private _autoCompleteState: TypeScriptAutoCompleteState;
    private _contextView: TypeScriptContextView;
    private _inError: boolean;
    private _defaultMessage: string;
    private _currentMessage: string;
    private _diagnostics: Array<ts.Diagnostic>;
    private _diagnosticMarkers: DisposableArray<Marker>;
    private _contentsChanging: boolean;
    private _currentCursorPosition: Point;
    private _ignoreNextChange: boolean;

    /**
     * Initializes a new state object for a given TypeScript text editor.
     *
     * @param {TypeScriptTextEditor} typescriptTextEditor - The TypeScript text editor that the state will apply to.
     */
    constructor(typescriptTextEditor: TypeScriptTextEditor)
    {
        this._typescriptTextEditor = typescriptTextEditor;
        this._autoCompleteState = new TypeScriptAutoCompleteState(typescriptTextEditor);
        this._contextView = new TypeScriptContextView(typescriptTextEditor);

        this._diagnostics = [ ];
        this._diagnosticMarkers = new DisposableArray<Marker>((m: Marker) => m.destroy());
        this._contentsChanging = false;
        this._inError = false;
        this._currentMessage = null;
        this._defaultMessage = "";
        this._ignoreNextChange = true;
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
    public set message(value: string)
    {
        this._currentMessage = value;
    }

    /**
     * Gets a flag indicating whether the TypeScript text editor is changing its buffer contents.
     */
    public get contentsChanging(): boolean
    {
        return this._contentsChanging;
    }
    /**
     * Sets a flag indicating whether the TypeScript text editor is changing its buffer contents.
     */
    public set contentsChanging(value: boolean)
    {
        this._contentsChanging = value;
    }

    public get ignoreNextContentChange(): boolean { return this._ignoreNextChange; }
    public set ignoreNextContentChange(value: boolean) { this._ignoreNextChange = value; }

    /**
     * Gets the auto-complete state.
     */
    public get autoCompleteState(): TypeScriptAutoCompleteState { return this._autoCompleteState; }

    public get isInsideComment(): boolean
    {
        var scopes = this._typescriptTextEditor.textEditor.getLastCursor().getScopeDescriptor().getScopesArray();

        var index = ArrayUtils.findIndex(scopes, (s: string) =>
            {
                return s.indexOf("comment") === 0;
            });

        return index >= 0;
    }

    /**
     * Disposes of the current TypeScript workspace state.
     */
    public dispose(): void
    {
        this._diagnosticMarkers.dispose();
    }

    /**
     * Updates the current state from the supplied TypeScript diagnostics.
     *
     * @param {Array<ts.Diagnostic>} diagnostics - The array of diagnostics from which the current state should be updated.
     */
    public updateFromTypeScriptDiagnostics(diagnostics: Array<ts.Diagnostic>): void
    {
        this._diagnostics = diagnostics;
        this._inError = diagnostics.length > 0;
        this._defaultMessage = this._inError ? diagnostics.length + " error(s)" : "";
        this._currentMessage = null;

        this._diagnosticMarkers.clear();

        var textEditor = this._typescriptTextEditor.textEditor;
        var bufferLineStartPositions: number[] = TypeScript.TextUtilities.parseLineStarts(textEditor.getText());

        this._diagnostics
            .forEach((diagnostic: ts.Diagnostic) =>
            {
                var linePos = ArrayUtils.findIndex(bufferLineStartPositions, (pos: number) => { return diagnostic.start < pos; });

                if (linePos < 0)
                    linePos = bufferLineStartPositions.length;

                linePos--;

                var columnPos = diagnostic.start - bufferLineStartPositions[linePos];

                var start: Point = textEditor.screenPositionForBufferPosition([linePos, columnPos]);
                var end: Point   = textEditor.screenPositionForBufferPosition([linePos, columnPos + diagnostic.length]);

                var diagnosticMarker: Marker = textEditor.markScreenRange([start, end], { invalidate: "never" });

                this._diagnosticMarkers.push(diagnosticMarker);

                textEditor.decorateMarker(diagnosticMarker, { type: "highlight", class: TypeScriptWorkspaceState.getClassForDiagnostic(diagnostic) });
            });
    }

    /**
     * Updates the current state from the supplied cursor position.
     *
     * If the cursor has moved into the bounds of a marker that represents a diagnostic error, then the diagnostic text will
     * be displayed in the status bar.
     *
     * @param {Point} cursorPosition - The row and column of the cursor position.
     */
    public updateFromCursorPosition(cursorPosition: Point)
    {
        if (this._currentCursorPosition && this._currentCursorPosition.row !== cursorPosition.row)
        {
            if (this._autoCompleteState.inProgress)
                this._autoCompleteState.toggleView();
        }

        var index: number = this._diagnosticMarkers.findIndex((m: Marker) => { return m.getScreenRange().containsPoint(cursorPosition); });

        if (index >= 0)
        {
            this.message = this._diagnostics[index].messageText;
            //this.toggleContext();
        }
        else
        {
            this.message = null;
        }

        this._currentCursorPosition = cursorPosition;
    }

    /**
     * Toggles the auto-complete view for the associated TypeScript text editor.
     */
    public toggleAutoComplete(): void
    {
        this._autoCompleteState.toggleView();
    }

    public toggleContext(): void
    {
        this._contextView.toggle();
    }

    /**
     * Returns a class name to be applied for diagnostic.
     *
     * @param diagnostic - The TypeScript diagnostic for which a class name should be determined.
     */
    private static getClassForDiagnostic(diagnostic: ts.Diagnostic): string
    {
        if (diagnostic.category === ts.DiagnosticCategory.Error)
            return "typescript-error";
        else
            return "typescript-warning";
    }
}

export = TypeScriptWorkspaceState;
