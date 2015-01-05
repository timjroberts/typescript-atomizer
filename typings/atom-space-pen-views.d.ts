/// <reference path="./atom.d.ts" />
/// <reference path="./space-pen/space-pen.d.ts" />

declare module "atom-space-pen-views"
{
    export class SelectListView<T> extends View
    {
        filterEditorView: TextEditorView;
        list: HTMLElement;

        width(width: number);
        cancel(): void;

        setItems(items: Array<T>);

        viewForItem(item: T): JQuery;
        confirmed(item: T): void;

        selectPreviousItemView(): void;
        selectNextItemView(): void;

        selectItemView(item: any): void;
        getSelectedItem(): T;

        storeFocusedElement(): void;
        focusFilterEditor(): void;
    }
}
