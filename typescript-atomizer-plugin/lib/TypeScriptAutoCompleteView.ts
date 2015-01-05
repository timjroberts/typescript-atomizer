/// <reference path="../../typings/TypeScriptServices.d.ts" />
/// <reference path="../../typings/space-pen/space-pen.d.ts" />

import SpacePen = require("space-pen");
import AutoCompleteView = require("./core/views/AutoCompleteView");
import TypeScriptTextEditor = require("./TypeScriptTextEditor");

/**
 * Represents an 'auto-complete' view for a TypeScript text editor.
 */
class TypeScriptAutoCompleteView extends AutoCompleteView<ts.CompletionEntry>
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

        return completionInfo && completionInfo.entries
            ? completionInfo.entries
            : [ ];
    }
    /**
     * Renderes the HTML view for a given auto-complete item (includes its kind icon and name).
     *
     * @param item - A completion entry item for which the view should be rendered.
     */
    protected renderViewForItem(item: ts.CompletionEntry): void
    {
        AutoCompleteView.span({ class: "autocomplete-item" }, () =>
            {
                AutoCompleteView.span({ class: "inline-block kind " + TypeScriptAutoCompleteView.getClassForKind(item) });
                AutoCompleteView.span({ class: "name" }, item.name);
            });
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

        if (kind === "var")
            return "localvar";
            
        if (kind === "local var")
            return "localvar-protected";

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
        if (modifier === "" || modifier === "public" || modifier === "declare")
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
