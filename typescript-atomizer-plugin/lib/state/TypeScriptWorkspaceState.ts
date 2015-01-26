/// <reference path="../../../typings/TypeScriptServices.d.ts" />
/// <reference path="../../../atomizer-core/atomizer-core.d.ts" />
/// <reference path="../../../atomizer-views/atomizer-views.d.ts" />

import ArrayUtils = require("atomizer-core/ArrayUtils");
import TypeScriptTextEditor = require("../TypeScriptTextEditor");
import TypeScriptAutoCompleteView = require("../TypeScriptAutoCompleteView");
import TypeScriptContextView = require("../TypeScriptContextView");
import DisposableArray = require("atomizer-core/DisposableArray");
import SelectionFixes = require("atomizer-views/SelectionFixes");
import TypeScriptAutoCompleteState = require("./TypeScriptAutoCompleteState");
import TypeScriptQuickInfo = require("../TypeScriptQuickInfo");
import TooltipView = require("atomizer-views/TooltipView");
import QuickInfoTooltipView = require("./QuickInfoTooltipView");

enum CursorPosition
{
    Previous = 0,
    Current = 1
}

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
    private _contentsChanged: boolean;
    private _currentCursorPosition: Point;
    private _ignoreNextChange: boolean;
    private _toolTip: TooltipView;
    private _cursorPositions: Array<Point>;

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

        this._cursorPositions = [];
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

    /**
     * Gets a flag indicating whether the TypeScript text editor has changed its buffer contents.
     */
    public get contentsChanged(): boolean
    {
        return this._contentsChanged;
    }
    /**
     * Sets a flag indicating whether the TypeScript text editor has changed its buffer contents.
     */
    public set contentsChanged(value: boolean)
    {
        this._contentsChanged = value;
    }

    public get ignoreNextContentChange(): boolean { return this._ignoreNextChange; }
    public set ignoreNextContentChange(value: boolean) { this._ignoreNextChange = value; }

    /**
     * Gets the auto-complete state.
     */
    public get autoCompleteState(): TypeScriptAutoCompleteState { return this._autoCompleteState; }

    public get isInsideComment(): boolean
    {
        return this.getIndexOfPartialCursorScope("comment") >= 0;
    }

    public get isInsideString(): boolean
    {
        return this.getIndexOfPartialCursorScope("string.quoted") >= 0;
    }

    /**
     * Disposes of the current TypeScript workspace state.
     */
    public dispose(): void
    {
        this._diagnosticMarkers.dispose();
    }

    public setTooltip(text: string, bufferPosition: Point): void;
    public setTooltip(info: TypeScriptQuickInfo): void;
    public setTooltip(p1: any, bufferPosition?: Point)
    {
        if (p1 instanceof TypeScriptQuickInfo)
        {
            this._toolTip = new QuickInfoTooltipView(this._typescriptTextEditor.textEditor, <TypeScriptQuickInfo>p1);
        }
        else
        {
            this._toolTip = new TooltipView(this._typescriptTextEditor.textEditor, bufferPosition, <string>p1);
        }

        this._toolTip.attach();
    }

    public removeTooltip(): void
    {
        if (this._toolTip)
            this._toolTip.detach();

        this._toolTip = null;
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

    public updateCursorPosition(cursorPosition: Point)
    {
        this._cursorPositions[CursorPosition.Previous] = this._cursorPositions[CursorPosition.Current];
        this._cursorPositions[CursorPosition.Current] = cursorPosition;
    }

    public cursorRowChanged(): boolean
    {
        var previousRow: number = this._cursorPositions[CursorPosition.Previous] ? this._cursorPositions[CursorPosition.Previous].row : 0;
        var currentRow: number = this._cursorPositions[CursorPosition.Current].row;

        return currentRow != previousRow;
    }

    public getDiagnosticForBufferPosition(bufferPosition: Point): ts.Diagnostic
    {
        var index: number = this._diagnosticMarkers.findIndex((m: Marker) => { return m.getScreenRange().containsPoint(bufferPosition); });

        return index >= 0 ? this._diagnostics[index] : null;
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

    private getIndexOfPartialCursorScope(scope: string): number
    {
        var scopes = this._typescriptTextEditor.textEditor.getLastCursor().getScopeDescriptor().getScopesArray();

        var index = ArrayUtils.findIndex(scopes, (s: string) =>
            {
                return s.indexOf(scope) === 0;
            });

        return index;
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
