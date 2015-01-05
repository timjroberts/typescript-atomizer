/// <reference path="../node_modules/typescript-atomizer-typings/TypeScriptServices.d.ts" />

import AutoCompleView = require("./core/views/AutoCompleteView");
import TypeScriptTextEditor = require("./TypeScriptTextEditor");

/**
 * Represents an 'auto-complete' view for a TypeScript text editor.
 */
class TypeScriptAutoCompleteView extends AutoCompleView<ts.CompletionEntry>
{
    private _typescriptTextEditor: TypeScriptTextEditor;

    /**
     * Initializes a new auto-complete view.
     *
     * @param typescriptTextEditor - The TypeScript text editor that the auto-complete view will be associated with.
     */
    constructor(typescriptTextEditor: TypeScriptTextEditor)
    {
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
    protected getCompletionItems(): Array<ts.CompletionEntry>
    {
        var completionInfo: ts.CompletionInfo = this._typescriptTextEditor.getEditorCodeCompletionsForCursor();

        var completions: Array<ts.CompletionEntry> =
            completionInfo && completionInfo.entries
            ? completionInfo.entries
            : [ ];

        return completions;
    }
    /**
     * Returns the HTML view for a given auto-complete item.
     *
     * Derived classes should override this function to override the default view.
     *
     * @param item - An item containing the data that can be used to render the item's view.
     * @returns A HTMLElement representing the view of the auto-complete item.
     */
    protected getViewForItem(item: ts.CompletionEntry): HTMLElement
    {
        var spanElement: HTMLElement = document.createElement("span");

        spanElement.classList.add("autocomplete-item");

        var kindSpanElement = document.createElement("span");
        var nameSpanElement = document.createElement("span");

        kindSpanElement.classList.add("inline-block");
        kindSpanElement.classList.add("kind");
        kindSpanElement.classList.add(TypeScriptAutoCompleteView.getClassForKind(item));

        nameSpanElement.classList.add("name");
        nameSpanElement.textContent = item.name;

        spanElement.appendChild(kindSpanElement);
        spanElement.appendChild(nameSpanElement);

        return spanElement;
    }

    /**
     * Returns a class name to be applied for an auto-complete item to indicate its type.
     *
     * @param item - The item for which a class name should be determined.
     */
    private static getClassForKind(item: ts.CompletionEntry): string
    {
        var kind: string = item.kind;

        if (kind === "")
            return "unknown";

        if (kind === "type parameter")
            return "typeparam";

        if (kind === "var" || kind === "local var")
            return "parameter";

        if (kind === "method")
            return TypeScriptAutoCompleteView.appendClassNameForKindModifier("function", item.kindModifiers);

        if (kind === "property" || kind === "getter" || kind === "setter")
            return TypeScriptAutoCompleteView.appendClassNameForKindModifier("property", item.kindModifiers);

        return kind;
    }

    /**
     * Appends the public/private modifier to a given class based on the modifier value that is also provided.
     *
     * @param currentClassName - The current class name that should be modified.
     * @param modifier - The modifier to use in determining if a the current class name should be modified to indicate
     * public or private access.
     */
    private static appendClassNameForKindModifier(currentClassName: string, modifier: string): string
    {
        if (modifier === "" || modifier === "public")
            return currentClassName;

        return currentClassName + "-" + modifier;
    }

    /**
     * A function that returns the text to be displayed in the auto-complete view for a given
     * TypeScript completion entry.
     *
     * @param item - The TypeScript completion entry for which the display text is required.
     * @returns The name of the supplied TypeScript completion entry.
     */
    private static getDisplayTextForCompletionEntry(item: ts.CompletionEntry): string
    {
        return item.name;
    }
}


export = TypeScriptAutoCompleteView;
