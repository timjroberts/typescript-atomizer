/// <reference path="../../../typings/TypeScriptServices.d.ts" />
/// <reference path="../../../atomizer-core/atomizer-core.d.ts" />
/// <reference path="../../../atomizer-views/atomizer-views.d.ts" />
/// <reference path="../../../typings/machina/machina.d.ts" />
/// <reference path="../core/StringIndexDictionary.d.ts" />

import machina = require("machina");
import ArrayUtils = require("atomizer-core/ArrayUtils");
import TypeScriptTextEditor = require("../TypeScriptTextEditor");
import DisposableArray = require("atomizer-core/DisposableArray");
import TypeScriptAutoCompleteState = require("./TypeScriptAutoCompleteState");
import TypeScriptQuickInfo = require("../TypeScriptQuickInfo");
import SelectionFixes = require("atomizer-views/SelectionFixes");
import SignatureHelpItemsView = require("./SignatureHelpItemsView");
import TooltipView = require("atomizer-views/TooltipView");
import QuickInfoTooltipView = require("./QuickInfoTooltipView");

/**
 * Manages state for a TypeScript Text Editor.
 *
 * State is managed internally using a 'machina' finite state machine.
 */
class TypeScriptTextEditorState implements Disposable
{
    private _cursorPositionFsm: machina.Fsm;
    private _cursorSignatureHelpItems: ts.SignatureHelpItems;
    private _dataSlots: StringIndexDictionary<any> = { };
    private _rowDeltaTotal: number = 0;
    private _columnDeltaTotal: number = 0;
    private _typescriptTextEditor: TypeScriptTextEditor;
    private _diagnostics: Array<ts.Diagnostic> = [ ];
    private _diagnosticMarkers: DisposableArray<Marker> = new DisposableArray<Marker>((m: Marker) => m.destroy());
    private _inError: boolean = false;
    private _autoCompleteState: TypeScriptAutoCompleteState;
    private _signatureHelpView: SignatureHelpItemsView;
    private _toolTip: TooltipView;

    /**
     * Initializes a new TypeScriptTextEditorState object.
     *
     * @param typescriptTextEditor The TypeScript Text Editor for which the state will be managed.
     */
    constructor(typescriptTextEditor: TypeScriptTextEditor)
    {
        this._typescriptTextEditor = typescriptTextEditor;

        this._autoCompleteState = new TypeScriptAutoCompleteState(typescriptTextEditor);
        this._signatureHelpView = new SignatureHelpItemsView(typescriptTextEditor.textEditor);

        var options: machina.IFsmInitializationOptions = {
                initialState: "text",
                states:
                {
                    /**
                     * Provides actions for handling state for when the text editor is inactive.
                     */
                    "inactive":
                    {
                        _onEnter: () =>
                            {
                                if (this._autoCompleteState.inProgress)
                                    this._autoCompleteState.toggleView();

                                if (this._signatureHelpView.isVisible())
                                    this._signatureHelpView.detach();
                            },

                        /*
                         * If we receive any actions while we're inactive, then assume that we've been
                         * activated.
                         */
                        "*": () =>
                            {
                                this.transistionStateForCursor();
                            }
                    },

                    /**
                     * Provides actions for handling state for when the text editor cursor is positioned
                     * within text.
                     */
                    "text":
                    {
                        _onExit: () =>
                            {
                                if (this._autoCompleteState.inProgress)
                                    this._autoCompleteState.toggleView();
                            },

                        "deactivate": () =>
                            {
                                this._cursorPositionFsm.transition("inactive");
                            },

                        "cursor-position-change": (cursorPosition: Point, rowDelta: number, columnDelta: number, textChanged: boolean) =>
                            {
                                if (this._autoCompleteState.inProgress && (rowDelta !== 0 || (rowDelta === 0 && (columnDelta < 0 || columnDelta > 1))))
                                    this._autoCompleteState.toggleView();

                                if (textChanged)
                                    return;

                                this.transistionStateForCursor();
                            },

                        "content-change": () =>
                            {
                                if (this._autoCompleteState.inProgress && this._rowDeltaTotal > 0) // turn off auto-complete if we pressed <enter>
                                {
                                    this._autoCompleteState.toggleView();
                                }
                                else
                                {
                                    var fixes = SelectionFixes.getFixesForSelection(this._typescriptTextEditor.textEditor, this._typescriptTextEditor.textEditor.getLastSelection());

                                    if (this._autoCompleteState.inProgress)
                                    {
                                        this._autoCompleteState.updateAutoCompleteFromSelectionFixes(fixes);
                                    }
                                    else if (!this._autoCompleteState.inProgress &&
                                             ((!fixes.isEmpty && this._rowDeltaTotal == 0 && this._columnDeltaTotal >= 2)
                                              || (fixes.isStartOfMemberCompletion && this._rowDeltaTotal == 0))) // turn on auto-complete if we type a few characters or at the start of member completion
                                    {
                                        this._autoCompleteState.toggleView();
                                    }
                                }

                                this.transistionStateForCursor();
                            },

                        "toggle-autocomplete": () =>
                            {
                                this._autoCompleteState.toggleView();
                            },

                        "autocomplete-select-next": () =>
                            {
                                this._autoCompleteState.selectNextAutoCompleteItem();
                            },

                        "autocomplete-select-previous": () =>
                            {
                                this._autoCompleteState.selectPreviousAutoCompleteItem();
                            },

                        "autocomplete-confirm": () =>
                            {
                                this._autoCompleteState.confirmAutoComplete();
                            }
                    },

                    /**
                     * Provides actions for handling state for when the text editor cursor is positioned
                     * inside a function call.
                     */
                    "function-call":
                    {
                        _onEnter: () =>
                            {
                                this._cursorSignatureHelpItems = this._typescriptTextEditor.getSignatureHelpForCursor();
                                this._signatureHelpView.setHelpItems(this._cursorSignatureHelpItems);
                                this._signatureHelpView.attach();
                            },

                        _onExit: () =>
                            {
                                this._signatureHelpView.detach();

                                if (this._autoCompleteState.inProgress)
                                    this._autoCompleteState.toggleView();
                            },

                        "deactivate": () =>
                            {
                                this._cursorPositionFsm.transition("inactive");
                            },

                        "cursor-position-change": (cursorPosition: Point, rowDelta: number, columnDelta: number, textChanged: boolean) =>
                            {
                                if (this._autoCompleteState.inProgress && (rowDelta !== 0 || (rowDelta === 0 && (columnDelta < 0 || columnDelta > 1))))
                                {
                                    this._autoCompleteState.toggleView();

                                    this._signatureHelpView.setHelpItems(this._cursorSignatureHelpItems);
                                    this._signatureHelpView.attach();
                                }
                                else if (!textChanged && this._signatureHelpView.isVisible())
                                {
                                    this._signatureHelpView.setHelpItems(this._cursorSignatureHelpItems);
                                }

                                if (textChanged)
                                    return;

                                this.transistionStateForCursor();
                            },

                        "content-change": (cursorPosition: Point, rowDelta: number, columnDelta: number) =>
                            {
                                if (this._autoCompleteState.inProgress && this._rowDeltaTotal > 0) // turn off auto-complete if we pressed <enter>
                                {
                                    this._autoCompleteState.toggleView();

                                    this._signatureHelpView.setHelpItems(this._cursorSignatureHelpItems);
                                    this._signatureHelpView.attach();
                                }
                                else
                                {
                                    var fixes = SelectionFixes.getFixesForSelection(this._typescriptTextEditor.textEditor, this._typescriptTextEditor.textEditor.getLastSelection());

                                    if (this._autoCompleteState.inProgress)
                                    {
                                        this._autoCompleteState.updateAutoCompleteFromSelectionFixes(fixes);
                                    }
                                    else if (!this._autoCompleteState.inProgress &&
                                             ((!fixes.isEmpty && this._rowDeltaTotal == 0 && this._columnDeltaTotal >= 2)
                                              || (fixes.isStartOfMemberCompletion && this._rowDeltaTotal == 0))) // turn on auto-complete if we type a few characters or at the start of member completion
                                    {
                                        this._signatureHelpView.detach();

                                        this._autoCompleteState.toggleView();
                                    }
                                    else
                                    {
                                        this._signatureHelpView.setHelpItems(this._cursorSignatureHelpItems);
                                    }
                                }

                                if (!this._cursorSignatureHelpItems)
                                    this.transistionStateForCursor();
                            },

                        "toggle-autocomplete": () =>
                            {
                                if (this._autoCompleteState.inProgress)
                                {
                                    this._autoCompleteState.toggleView();

                                    this._cursorSignatureHelpItems = this._typescriptTextEditor.getSignatureHelpForCursor();
                                    this._signatureHelpView.setHelpItems(this._cursorSignatureHelpItems);
                                    this._signatureHelpView.attach();
                                }
                                else
                                {
                                    this._signatureHelpView.detach();

                                    this._autoCompleteState.toggleView();
                                }
                            },

                        "autocomplete-select-next": () =>
                            {
                                this._autoCompleteState.selectNextAutoCompleteItem();
                            },

                        "autocomplete-select-previous": () =>
                            {
                                this._autoCompleteState.selectPreviousAutoCompleteItem();
                            },

                        "autocomplete-confirm": () =>
                            {
                                this._autoCompleteState.confirmAutoComplete();

                                this.toggleAutoComplete();
                            }
                    },

                    /**
                     * Provides actions for handling state for when the text editor cursor is positioned
                     * inside a string.
                     */
                    "string":
                    {
                        "deactivate": () =>
                            {
                                this._cursorPositionFsm.transition("inactive");
                            },

                        "cursor-position-change": (cursorPosition: Point, rowDelta: number, columnDelta: number) =>
                            {
                                this.transistionStateForCursor();
                            },
                    },

                    /**
                     * Provides actions for handling state for when the text editor cursor is positioned
                     * inside a single or multi-line comment.
                     */
                    "comment":
                    {
                        "deactivate": () =>
                            {
                                this._cursorPositionFsm.transition("inactive");
                            },

                        "cursor-position-change": (cursorPosition: Point, rowDelta: number, columnDelta: number) =>
                            {
                                this.transistionStateForCursor();
                            },
                    }
                }
            };

        this._cursorPositionFsm = new machina.Fsm(options);
    }

    /**
     * Gets the data slots for the current TypeScript Text Editor.
     *
     * Data slots allow data to be externally associated with the TypeScript Text Editor state.
     */
    public get dataSlots(): StringIndexDictionary<any>
    {
        return this._dataSlots;
    }

    /**
     * Gets a flag indicating whether the TypeScript Text Editor has any TypeScript
     * diagnostic errors.
     */
    public get inError(): boolean
    {
        return this._inError;
    }

    /**
     * Gets a flag indicating whether the auto-complete view is active within the
     * TypeScript Text Editor.
     */
    public get autoCompleteInProgress(): boolean
    {
        return this._autoCompleteState.inProgress;
    }

    /**
     * Disposes of the current TypeScript Text Editor.
     */
    public dispose(): void
    {
        this._diagnosticMarkers.dispose();
    }

    /**
     * Activates the TypeScript Text Editor.
     */
    public activate(): void
    {
        this._cursorPositionFsm.handle("activate");
    }

    /**
     * Deactivates the TypeScript Text Editor.
     */
    public deactivate(): void
    {
        this._cursorPositionFsm.handle("deactivate");
    }

    /**
     * Toggles the auto-complete view on or off.
     */
    public toggleAutoComplete(): void
    {
        this._cursorPositionFsm.handle("toggle-autocomplete");
    }

    /**
     * Selects the next item in the auto-complete view.
     *
     * Ignored if auto-complete is not active.
     */
    public selectNextAutoCompleteItem(): void
    {
        this._cursorPositionFsm.handle("autocomplete-select-next");
    }

    /**
     * Selects the previous item in the auto-complete view.
     *
     * Ignored if auto-complete is not active.
     */
    public selectPreviousAutoCompleteItem(): void
    {
        this._cursorPositionFsm.handle("autocomplete-select-previous");
    }

    /**
     * Selects the currently selected item in the auto-complete view.
     *
     * Ignored if auto-complete is not active.
     */
    public confirmAutoCompleteItem(): void
    {
        this._cursorPositionFsm.handle("autocomplete-confirm");
    }

    /**
     * Displays a tooltip at a given buffer position.
     *
     * @param text The tooltip text to be displayed.
     * @param bufferPosition A Point representing the position of where the tooltip should
     * be displayed.
     */
    public setTooltip(text: string, bufferPosition: Point): void;
    /**
     * Displays a tooltip for a TypeScript quick-info object.
     *
     * @param info The TypeScript quick-info object that contains the tooltip text and the
     * buffer position.
     */
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

    /**
     * Removes any tooltip that is currently being displayed.
     */
    public removeTooltip(): void
    {
        if (this._toolTip)
            this._toolTip.detach();

        this._toolTip = null;
    }

    /**
     * Retrieves a TypeSript diagnostic for a given buffer position.
     *
     * @param bufferPosition A Point representing the buffer position for which a
     * diagnostic object is required.
     *
     * @returns The TypeScript diagnostic that is currently in range of the given
     * buffer position; otherwise null.
     */
    public getDiagnosticForBufferPosition(bufferPosition: Point): ts.Diagnostic
    {
        var index: number = this._diagnosticMarkers.findIndex((m: Marker) => { return m.getScreenRange().containsPoint(bufferPosition); });

        return index >= 0 ? this._diagnostics[index] : null;
    }

    /**
     * Refreshes the state for a change in the cursor's position.
     *
     * @param previousCursorPosition A point representing the cursor's previous position.
     * @param newCursorPosition A point representing the cursor's current position.
     * @param textChanged A flag indicating whether the cursor has changed as a result of text
     * changing within the underlying text editor.
     */
    public updateFromCursorPosition(previousCursorPosition: Point, newCursorPosition: Point, textChanged: boolean): void
    {
        this._cursorSignatureHelpItems = this._typescriptTextEditor.getSignatureHelpForCursor();

        var rowDelta    = newCursorPosition.row - previousCursorPosition.row;
        var columnDelta = newCursorPosition.column - previousCursorPosition.column;

        this._rowDeltaTotal += rowDelta;
        this._columnDeltaTotal += columnDelta;

        this._cursorPositionFsm.handle("cursor-position-change", newCursorPosition, rowDelta, columnDelta, textChanged);
    }

    /**
     * Refreshes the state for a content change.
     */
    public updateFromContentChange(): void
    {
        try
        {
            this._cursorSignatureHelpItems = this._typescriptTextEditor.getSignatureHelpForCursor();

            this._cursorPositionFsm.handle("content-change");
            this.updateDiagnosticMarkers();
        }
        finally
        {
            this._rowDeltaTotal = 0;
            this._columnDeltaTotal = 0;
        }
    }

    /**
     * Updates the markers associated with any TypeScript diagnostic messages in the underlying
     * text editor.
     */
    private updateDiagnosticMarkers(): void
    {
        this._diagnostics = this._typescriptTextEditor.getLanguageDiagnostics();
        this._inError = this._diagnostics.length > 0;

        this._diagnosticMarkers.clear();

        var textEditor = this._typescriptTextEditor.textEditor;
        var bufferLineStartPositions: number[] = TypeScript.TextUtilities.parseLineStarts(textEditor.getText());

        this._diagnostics.forEach((diagnostic: ts.Diagnostic) =>
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

                textEditor.decorateMarker(diagnosticMarker, { type: "highlight", class: TypeScriptTextEditorState.getClassForDiagnostic(diagnostic) });
            });

    }

    /**
     * Transitions the finite state machine into the next state based on the context of
     * the current cursor position and other associated state.
     */
    private transistionStateForCursor(): void
    {
        var currentState = this._cursorPositionFsm.state;
        var nextState: string;

        if (this.isInsideComment()) nextState = "comment";
        else if(this.isInsideString()) nextState = "string";
        else if (this._cursorSignatureHelpItems) nextState = "function-call";
        else nextState = "text";

        if (nextState !== currentState)
            this._cursorPositionFsm.transition(nextState);
    }

    /**
     * Determines if the cursor is currently positioned inside a comment.
     */
    private isInsideComment(): boolean
    {
        return TypeScriptTextEditorState.getIndexOfPartialCursorScope(this._typescriptTextEditor, "comment") >= 0;
    }

    /**
     * Determines if the cursor is currently positioned inside a string.
     */
    private isInsideString(): boolean
    {
        return TypeScriptTextEditorState.getIndexOfPartialCursorScope(this._typescriptTextEditor, "string.quoted") >= 0;
    }

    /**
     * Returns the index of a grammar scope based on the grammatical context of the cursor's current
     * position.
     *
     * @param typescriptTextEditor The TypeScript text editor.
     * @param scope The scope to search for.
     *
     * @returns An index representing the position of the supplied scope within the grammatical context
     * of the text editor's current cursor position.
     */
    private static getIndexOfPartialCursorScope(typescriptTextEditor: TypeScriptTextEditor, scope: string): number
    {
        var scopes = typescriptTextEditor.textEditor.getLastCursor().getScopeDescriptor().getScopesArray();

        var index = ArrayUtils.findIndex(scopes, (s: string) =>
            {
                return s.indexOf(scope) === 0;
            });

        return index;
    }

    /**
     * Returns a class name from the category of a given TypeScript diagnostic.
     *
     * @param diagnostic The TypeScript diagnostic for which a class name should be determined.
     *
     * @returns A string representing a CSS class name for the category of the
     * supplied diagnostic.
     */
    private static getClassForDiagnostic(diagnostic: ts.Diagnostic): string
    {
        return (diagnostic.category === ts.DiagnosticCategory.Error)
            ? "typescript-error"
            : "typescript-warning";
    }
}

export = TypeScriptTextEditorState;
