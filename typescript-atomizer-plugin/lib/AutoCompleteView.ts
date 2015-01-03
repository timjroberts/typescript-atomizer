/// <reference path="../node_modules/typescript-atomizer-typings/atom-space-pen-views.d.ts" />

import SpacePenViews = require("atom-space-pen-views");

/**
 * Represents an 'auto-complete' view for a text editor.
 */
class AutoCompleteView<TItem> extends SpacePenViews.SelectListView<AutoCompleteItem<TItem>> {
    private static WordRegExp: RegExp = /\w+/g;

    private _textEditor: TextEditor;
    private _getDisplayTextFunc: (item: TItem) => string;
    private _checkpoint: Checkpoint;
    private _originalSelectionBufferRanges: Array<Range>;
    private _overlayDecoration: Decoration;

    /**
     * Initializes a new auto-complete view.
     *
     * @param textEditor - The text editor that the auto-complete view will be associated with.
     * @param getDisplayTextFunc - A function that returns the text to be displayed for a given item.
     */
    constructor(textEditor: TextEditor, getDisplayTextFunc: (item: TItem) => string) {
        super();
        this._textEditor = textEditor;
        this._getDisplayTextFunc = getDisplayTextFunc;

        this.addClass("autocomplete popover-list");

        (<any>this.list).on("mousewheel", (e: Event) => e.stopPropagation());
    }

    /**
     * Toggles the auto-complete view.
     *
     * @returns true if the auto-complete view is now visible; otherwise false.
     */
    public toggle(): boolean {
        this.isVisible()
            ? this.cancel()
            : this.attach();

        return this.isVisible();
    }

    /**
     * Returns the HTML view for a given auto-complete item.
     *
     * @param item - An auto-complete item containing the data that can be used to render the item's view.
     * @returns A HTMLElement representing the view of the auto-complete item.
     */
    public viewForItem(item: AutoCompleteItem<TItem>): HTMLElement {
        var itemElemenet: HTMLElement = document.createElement("li");
        var spanElement: HTMLElement = document.createElement("span");

        spanElement.appendChild(this.getViewForItem(item.item));

        itemElemenet.appendChild(spanElement);

        return itemElemenet;
    }

    /**
     * Confirms the selection of an auto-complete item by writing the item into the text editor.
     *
     * @param item - The auto-complete item containing the data that has been selected.
     */
    public confirmed(item: AutoCompleteItem<TItem>): void {
        this._textEditor.getSelections().forEach((selection: Selection) => {
                selection.clear();
            });

        this.cancel();

        if (!item)
            return;

        this.replaceSelectedTextWithMatch(item);

        this._textEditor.getCursors().forEach((cursor: Cursor) => {
                var cusorPosition: Point = cursor.getBufferPosition();

                cursor.setBufferPosition([cusorPosition.row, cusorPosition.column + item.suffix.length]);
            });
    }

    /**
     * Updates the text editor with a visual cue of the currently selected auto-complete item.
     *
     * @param item - The auto-complete item containing the data that is currently selected.
     */
    public selectItemView(item: any) {
        super.selectItemView(item);

        this.replaceSelectedTextWithMatch(this.getSelectedItem())
    }

    /**
     * Called just before the view is attached to the text editor.
     */
    public attach(): void {
        this._checkpoint = this._textEditor.createCheckpoint();
        this._originalSelectionBufferRanges =
            this._textEditor.getSelections()
                .map((s: Selection) => s.getBufferRange());

        var fixes: Fixes = AutoCompleteView.getFixesForSelection(this._textEditor, this._textEditor.getLastSelection());
        var completions: Array<TItem> = this.getCompletionItems();

        if (fixes.prefix.length + fixes.suffix.length > 0) {
            var regExp: RegExp = new RegExp("^" + fixes.prefix + ".*" + fixes.suffix + "$");

            completions = completions.filter((e: TItem) => regExp.test(this._getDisplayTextFunc(e)));
        }

        this.setItems(completions.map((e: TItem) => new AutoCompleteItem<TItem>(e, this._getDisplayTextFunc, fixes)));

        this._overlayDecoration =
            this._textEditor.decorateMarker(this._textEditor.getLastCursor().getMarker(), { type: "overlay", position: "tail", item: this });
    }

    /**
     * Returns the HTML view for a given auto-complete item.
     *
     * Derived classes should override this function to override the default view.
     *
     * @param item - An item containing the data that can be used to render the item's view.
     * @returns A HTMLElement representing the view of the auto-complete item.
     */
    protected getViewForItem(item: TItem): HTMLElement {
        var spanElement: HTMLElement = document.createElement("span");

        spanElement.textContent = this._getDisplayTextFunc(item);

        return spanElement;
    }

    /**
     * Returns the auto-complete items.
     *
     * Derived classes should override this function to return appropriate items.
     *
     * @returns An array of items to be displayed in the auto-complete view.
     */
    protected getCompletionItems(): Array<TItem> {
        return [ ];
    }

    /**
     * Returns the name of the property that SelectListView will use to obtain the 'word' from the
     * auto-complete item.
     *
     * @returns A string with the value 'word'.
     */
    private getFilterKey(): string {
        return "word";
    }

    /**
     * Called just after the view has been attached to the text editor.
     */
    private attached(): void {
        var spans = (<any>this.list).find("span");
        var widestSpan: number = parseInt((<any>this).css("min-width"));

        spans.each((idx: number, span: any) => {
                widestSpan = Math.max(widestSpan, span.offsetWidth);
            });

        (<any>this.list).width(widestSpan + 20);
        this.width((<any>this.list).outerWidth());

        this.storeFocusedElement();
        this.focusFilterEditor();
    }

    /**
     * Called when the view is being detached and removed from the text editor without any auto-complete item
     * being selected.
     */
    private cancelled(): void {
        if (this._overlayDecoration)
            this._overlayDecoration.destroy();

        if (!this._textEditor.isDestroyed()) {
            this._textEditor.revertToCheckpoint(this._checkpoint);
            this._textEditor.setSelectedBufferRanges(this._originalSelectionBufferRanges);

            //atom.workspace.getActivePane().activate();
        }
    }

    /**
     * Updates all the selections in the text editor with the selected auto-complete item.
     *
     * @param item - The auto-complete item containing the data that has been selected.
     */
    private replaceSelectedTextWithMatch(item: AutoCompleteItem<TItem>): void {
        var newSelectedBufferRanges = [ ];

        this._textEditor.transact(() => {
                this._textEditor.getSelections().forEach((selection: Selection, idx: number) => {
                        var buffer = this._textEditor.getBuffer();
                        var selectionRange: Range = selection.getBufferRange();
                        var startPosition: Point = selectionRange.start;

                        selection.deleteSelectedText();

                        var cursorPosition: Point = this._textEditor.getCursors()[idx].getBufferPosition();
                        var prefixRange = selectionRange.copy();
                        var suffixRange = selectionRange.copy();

                        prefixRange.start.column = cursorPosition.column - item.prefix.length;
                        prefixRange.end.column = cursorPosition.column;

                        suffixRange.start.column = cursorPosition.column;
                        suffixRange.end.column = cursorPosition.column + item.suffix.length;

                        buffer.delete(suffixRange);
                        buffer.delete(prefixRange);

                        newSelectedBufferRanges.push([startPosition, [startPosition.row, startPosition.column + item.infixLength]]);
                    });
            });

        this._textEditor.insertText(item.word);
        this._textEditor.setSelectedBufferRanges(newSelectedBufferRanges);
    }

    /**
     * Retrieves the prefix and suffix for a given selection.
     *
     * @param textEditor - The text editor that contains the selection.
     * @param selection - The selection from which a prefix and suffix can be computed.
     * @returns An object containing the prefix and suffix.
     */
    private static getFixesForSelection(textEditor: TextEditor, selection: Selection): Fixes {
        var selectionRange: Range = selection.getBufferRange();
        var lineRange = [[selectionRange.start.row, 0], [selectionRange.end.row, textEditor.lineTextForBufferRow(selectionRange.end.row).length]]
        var prefix: string = "";
        var suffix: string = "";

        textEditor.getBuffer().scanInRange(AutoCompleteView.WordRegExp, lineRange, (match: ScanMatch) => {
                if (match.range.start.isGreaterThan(selectionRange.end))
                    match.stop();

                if (match.range.intersectsWith(selectionRange)) {
                    var prefixOffset: number = selectionRange.start.column - match.range.start.column;
                    var suffixOffset: number = match.range.end.column - selectionRange.end.column;

                    if (match.range.start.isLessThan(selectionRange.start))
                        prefix = match.matchText.substring(0, prefixOffset);

                    if (match.range.end.isGreaterThan(selectionRange.end))
                        suffix = match.matchText.substring(match.matchText.length - suffixOffset);
                }
            });

        return { prefix: prefix, suffix: suffix };
    }
}

/**
 * Captures a prefix and a suffix.
 */
interface Fixes {
    /**
     * The prefix.
     */
    prefix: string;

    /**
     * The suffix.
     */
    suffix: string;
}

/**
 * Represents an auto-complete item.
 *
 * An AutoCompleteItem captures the item that is to be displayed in an auto-complete view, along with
 * any prefix and suffix information that is present when the auto-complete was acivated.
 */
class AutoCompleteItem<T> implements Fixes {
    private _item: T;
    private _fixes: Fixes;
    private _getDisplayTextFunc: (item: T) => string;

    /**
     * Initializes a new auto-complete item.
     *
     * @param item - The item being displayed in the auto-complete view.
     * @param getDisplayTextFunc - A function that returns the text to be displayed for the item.
     * @param fixes - The captured prefix and suffix.
     */
    constructor(item: T, getDisplayTextFunc: (item: T) => string, fixes: Fixes) {
        this._item = item;
        this._fixes = fixes;
        this._getDisplayTextFunc = getDisplayTextFunc;
    }

    /**
     * Gets the word associated with this auto-complete item by applying the 'word function' to the stored item.
     */
    public get word(): string { return this._getDisplayTextFunc(this._item); }

    /**
     * Gets the item.
     */
    public get item(): T { return this._item; }

    /**
     * Gets the prefix.
     */
    public get prefix(): string { return this._fixes.prefix; }

    /**
     * Gets the suffix.
     */
    public get suffix(): string { return this._fixes.suffix; }

    /**
     * Gets the infix length by subtracting the length of the prefix and suffix from the length of the
     * associated word.
     */
    public get infixLength(): number { return this.word.length - this._fixes.prefix.length - this._fixes.suffix.length; }
}

export = AutoCompleteView;
