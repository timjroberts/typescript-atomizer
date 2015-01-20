/// <reference path="../typings/atom-space-pen-views.d.ts" />
/// <reference path="../typings/space-pen/space-pen.d.ts" />

import SpacePen = require("space-pen");
import AtomSpacePenViews = require("atom-space-pen-views");
import SelectionFixes = require("./SelectionFixes");

/**
 * Represents an 'auto-complete' view for a text editor.
 */
class AutoCompleteView<TItem> extends AtomSpacePenViews.SelectListView<AutoCompleteItem<TItem>>
{
    private _textEditor: TextEditor;
    private _getDisplayTextFunc: (item: TItem) => string;
    private _currentFixes: SelectionFixes;
    private _originalSelectionBufferRanges: Array<Range>;
    private _overlayDecoration: Decoration;
    private _isDismissing: boolean;

    /**
     * Initializes a new auto-complete view.
     *
     * @param textEditor - The text editor that the auto-complete view will be associated with.
     * @param getDisplayTextFunc - A function that returns the text to be displayed for a given item.
     */
    constructor(textEditor: TextEditor, getDisplayTextFunc: (item: TItem) => string)
    {
        super();
        this._textEditor = textEditor;
        this._getDisplayTextFunc = getDisplayTextFunc;

        this.addClass("atomizer-autocomplete popover-list");

        (<any>this.filterEditorView).hide();
        (<any>this.list).on("mousewheel", (e: Event) => e.stopPropagation());
    }

    /**
     * Toggles the auto-complete view.
     *
     * @returns true if the auto-complete view is now visible; otherwise false.
     */
    public toggle(): boolean
    {
        if (this.isVisible())
            this.cancel();
        else
            this.attach();

        return this.isVisible();
    }

    /**
     * Returns the rendered HTML view for a given auto-complete item.
     *
     * @param item - An auto-complete item containing the data that can be used to render the item's view.
     * @returns A JQuery object representing the view of the auto-complete item.
     */
    public viewForItem(item: AutoCompleteItem<TItem>): JQuery
    {
        return AutoCompleteView.render(() =>
            {
                AutoCompleteView.li(() =>
                    {
                        AutoCompleteView.span(this.renderViewForItem(item.item))
                    });
            });
    }

    /**
     * Select the current auto-complete item.
     */
    public selectItem()
    {
        this.confirmSelection();
    }

    /**
     * Moves the selection onto the previous item in the list.
     */
    public moveToPreviousItem()
    {
        this.selectPreviousItemView();
    }

    /**
     * Moves the selection onto the next item in the list.
     */
    public moveToNextItem()
    {
        this.selectNextItemView();
    }

    /**
     * Confirms the selection of an auto-complete item by writing the item into the text editor.
     *
     * @param item - The auto-complete item containing the data that has been selected.
     */
    public confirmed(item: AutoCompleteItem<TItem>): void
    {
        this._textEditor.getSelections().forEach((s: Selection) => s.clear());

        this.cancel();

        if (!item)
            return;

        this.replaceSelectedTextWithMatch(item);

        this._textEditor.getCursors().forEach((c: Cursor) => this.setBufferPositionForSelectedItem(c, item));
    }

    public dismiss(): void
    {
        this._isDismissing = true;
        this.cancel();
    }

    public updateSelectionFixes(fixes: SelectionFixes)
    {
        this._currentFixes = fixes;
        this._originalSelectionBufferRanges = this._textEditor.getSelections().map((s: Selection) => s.getBufferRange());

        this.updateCompletionsList();
    }

    /**
     * Called just before the view is attached to the text editor.
     */
    public attach(): void
    {
        this._isDismissing = false;
        this._originalSelectionBufferRanges = this._textEditor.getSelections().map((s: Selection) => s.getBufferRange());

        this._currentFixes = SelectionFixes.getFixesForSelection(this._textEditor, this._textEditor.getLastSelection());

        this.updateCompletionsList();

        this._overlayDecoration = this._textEditor.decorateMarker(this._textEditor.getLastCursor().getMarker(), { type: "overlay", position: "tail", item: this });
    }

    /**
     * Renderes the default HTML view for a given auto-complete item.
     *
     * Derived classes should override this function to override the default view.
     *
     * @param item - An item containing the data that can be used to render the item's view.
     */
    protected renderViewForItem(item: TItem): void
    {
        AutoCompleteView.span(this._getDisplayTextFunc(item));
    }

    /**
     * Returns the auto-complete items.
     *
     * Derived classes should override this function to return appropriate items.
     *
     * @returns An array of items to be displayed in the auto-complete view.
     */
    protected getCompletionItems(): Array<TItem>
    {
        return [ ];
    }

    /**
     * Sets the buffer position within a cusor for a selected auto-complete item.
     *
     * @param cursor - The cursor for which the buffer position should be changed.
     * @param selectedItem - The selected auto-complete item from which the buffer position is calculated.
     */
    private setBufferPositionForSelectedItem(cursor: Cursor, selectedItem: AutoCompleteItem<TItem>): void
    {
        var cusorPosition: Point = cursor.getBufferPosition();

        cursor.setBufferPosition([cusorPosition.row, cusorPosition.column + selectedItem.suffix.length]);
    }

    /**
     * Updates the auto-complete selection list from the current prefix and suffix.
     */
    private updateCompletionsList(): void
    {
        var completions: Array<TItem> = this.getCompletionItems();

        if (!this._currentFixes.isEmpty)
        {
            var regExp: RegExp = new RegExp("^" + this._currentFixes.prefix + ".*" + this._currentFixes.suffix + "$");

            completions = completions.filter((e: TItem) => regExp.test(this._getDisplayTextFunc(e)));
        }

        this.setItems(completions.map((e: TItem) => new AutoCompleteItem<TItem>(e, this._getDisplayTextFunc, this._currentFixes)));
        this.resize();
    }

    /**
     * Returns the name of the property that SelectListView will use to obtain the 'word' from the
     * auto-complete item.
     *
     * @returns A string with the value 'word'.
     */
    private getFilterKey(): string
    {
        return "word";
    }

    /**
     * Called just after the view has been attached to the text editor.
     */
    private attached(): void
    {
        this.resize();
    }

    /**
     * Resizes the auto-complete pop-over to the width of the largest auto-complete item.
     */
    private resize(): void
    {
        var spans = (<any>this.list).find("span");
        var widestSpan: number = parseInt((<any>this).css("min-width"));

        spans.each((idx: number, span: any) =>
        {
            widestSpan = Math.max(widestSpan, span.offsetWidth);
        });

        (<any>this.list).width(widestSpan + 25);
        this.width((<any>this.list).outerWidth());
    }

    /**
     * Called when the view is being detached and removed from the text editor without any auto-complete item
     * being selected.
     */
    private cancelled(): void
    {
        if (this._overlayDecoration)
            this._overlayDecoration.destroy();
    }

    /**
     * Updates all the selections in the text editor with the selected auto-complete item.
     *
     * @param item - The auto-complete item containing the data that has been selected.
     */
    private replaceSelectedTextWithMatch(item: AutoCompleteItem<TItem>): void
    {
        var newSelectedBufferRanges = [ ];

        this._textEditor.transact(() =>
        {
            this._textEditor.getSelections()
                .forEach((selection: Selection, idx: number) =>
                {
                    var buffer = this._textEditor.getBuffer();
                    var selectionRange: Range = selection.getBufferRange();
                    var startPosition: Point = selectionRange.start;

                    var cursorPosition: Point = this._textEditor.getCursors()[idx].getBufferPosition();
                    var prefixRange = selectionRange.copy();
                    var suffixRange = selectionRange.copy();

                    prefixRange.start.column = cursorPosition.column - item.prefix.length;
                    prefixRange.end.column = cursorPosition.column;

                    suffixRange.start.column = cursorPosition.column;
                    suffixRange.end.column = cursorPosition.column + item.suffix.length;

                    newSelectedBufferRanges.push([startPosition, [startPosition.row, startPosition.column + item.infixLength]]);
                });
        });

        this._textEditor.insertText(item.word.substring(item.prefix.length, item.word.length - item.suffix.length));
        this._textEditor.setSelectedBufferRanges(newSelectedBufferRanges);
    }
}

/**
 * Represents an auto-complete item.
 *
 * An AutoCompleteItem captures the item that is to be displayed in an auto-complete view, along with
 * any prefix and suffix information that is present when the auto-complete view was acivated.
 */
class AutoCompleteItem<T> {
    private _item: T;
    private _fixes: SelectionFixes;
    private _getDisplayTextFunc: (item: T) => string;

    /**
     * Initializes a new auto-complete item.
     *
     * @param item - The item being displayed in the auto-complete view.
     * @param getDisplayTextFunc - A function that returns the text to be displayed for the item.
     * @param fixes - The captured prefix and suffix.
     */
    constructor(item: T, getDisplayTextFunc: (item: T) => string, fixes: SelectionFixes)
    {
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
