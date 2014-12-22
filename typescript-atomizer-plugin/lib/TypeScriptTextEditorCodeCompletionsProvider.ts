/// <reference path="../node_modules/typescript-atomizer-typings/atom.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/TypeScriptServices.d.ts" />

import TypeScriptTextEditor = require("./TypeScriptTextEditor");

/**
 * Represents a suggestion that can be used by the 'autocomplete-plus' package.
 */
interface Suggestion {
    word?: string;
    prefix?: string;
    label?: string;
    data?: string;
    renderLabelAsHtml?: boolean;
    className?: string;
}

/**
 * An 'autocomplete-plus' compatible suggestion provider that returns TypeScript code completion suggestions.
 */
class TypeScriptTextEditorCodeCompletionsProvider {
    private static LastWordRegExp: RegExp = /(\w+?)$/;

    private _typescriptTextEditor: TypeScriptTextEditor;
    private _suggestions: Array<Suggestion>;

    /**
     * Initializes a new TypeScript code completion provider.
     *
     * @param {TypeScriptTextEditor} typescriptTextEditor - The TypeScript text editor from which completion hints will be obtained.
     */
    constructor(typescriptTextEditor: TypeScriptTextEditor) {
        this._typescriptTextEditor = typescriptTextEditor;
    }

    /**
     * Get a flag indicating whether the code completion provider supplied exlusive results.
     *
     * The TypeScript code completion provider always returns 'true' in order to override the 'autocomplete-plus' default behaviour of including all text
     * from the current buffer in the displayed selection overlay.
     */
    public get exclusive(): boolean {
        return true;
    }

    /**
     * Called by the 'autocomplete-plus' package to obtain code completion suggestions.
     *
     * @returns {Suggestion[]} The suggestions taken from the context provided by the current cursor position.
     */
    public buildSuggestions(): Suggestion[] {
        var completions: ts.CompletionInfo = this._typescriptTextEditor.getEditorCodeCompletionsForCursor();

        if (!completions || !completions.entries) return [ ];

        var textEditor: TextEditor = this._typescriptTextEditor.textEditor;

        var cursorPosition: Point = textEditor.getCursorBufferPosition();

        var lineTextToCursor: string =
            textEditor.lineTextForBufferRow(cursorPosition.row)
                .substring(0, cursorPosition.column);

        var matches = TypeScriptTextEditorCodeCompletionsProvider.LastWordRegExp.exec(lineTextToCursor);
        var currentWordPrefix = (matches) ? matches[0] : "";

        return completions.entries
            .filter((entry: ts.CompletionEntry) => { return entry.name.indexOf(currentWordPrefix) === 0 })
            .map((entry: ts.CompletionEntry) => { return { provider: this, word: entry.name, label: entry.kind, prefix: currentWordPrefix } });
    }

    /**
     * Called by the 'autocomplete-plus' package to confirm an entry.
     */
    public confirm(): boolean {
        return true;
    }
}

export = TypeScriptTextEditorCodeCompletionsProvider;
