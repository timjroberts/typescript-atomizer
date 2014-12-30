/// <reference path="../node_modules/typescript-atomizer-typings/TypeScriptServices.d.ts" />

import AutoCompleView = require("./AutoCompleteView");
import TypeScriptTextEditor = require("./TypeScriptTextEditor");

/**
 * Represents an 'auto-complete' view for a TypeScript text editor.
 */
class TypeScriptAutoCompleteView extends AutoCompleView<ts.CompletionEntry> {
    private _typescriptTextEditor: TypeScriptTextEditor;

    /**
     * Initializes a new auto-complete view.
     *
     * @param typescriptTextEditor - The TypeScript text editor that the auto-complete view will be associated with.
     */
    constructor(typescriptTextEditor: TypeScriptTextEditor) {
        super(typescriptTextEditor.textEditor, TypeScriptAutoCompleteView.getDisplayTextForCompletionEntry);

        this._typescriptTextEditor = typescriptTextEditor;
    }

    /**
     * Retrieves the current TypeScript completion entries that should be displayed into the auto-complete view.
     *
     * The underlying TypeScript language services determine any context from the current cursor position.
     *
     * @returns An array of TypeScript completion entries.
     */
    protected getCompletionItems(): Array<ts.CompletionEntry> {
        var completionInfo: ts.CompletionInfo = this._typescriptTextEditor.getEditorCodeCompletionsForCursor();

        var completions: Array<ts.CompletionEntry> =
            completionInfo && completionInfo.entries
            ? completionInfo.entries
            : [ ];

        return completions;
    }

    /**
     * A function that returns the text to be displayed in the auto-complete view for a given
     * TypeScript completion entry.
     *
     * @param item - The TypeScript completion entry for which the display text is required.
     * @returns The name of the supplied TypeScript completion entry.
     */
    private static getDisplayTextForCompletionEntry(item: ts.CompletionEntry): string {
        return item.name;
    }
}


export = TypeScriptAutoCompleteView;
