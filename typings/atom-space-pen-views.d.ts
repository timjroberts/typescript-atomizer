/// <reference path="./atom.d.ts" />
/// <reference path="./space-pen/space-pen.d.ts" />

declare module "atom-space-pen-views"
{
    export class SelectListView<T> extends View
    {
        protected filterEditorView: TextEditorView;
        protected list: HTMLElement;

        setItems(items: Array<T>);

        protected width(width: number);
        protected cancel(): void;
        protected confirmSelection(): void;
        protected selectNextItemView(): void;
        protected selectPreviousItemView(): void;
        protected viewForItem(item: T): JQuery;
        protected confirmed(item: T): void;
        protected selectItemView(item: any): void;
        protected getSelectedItem(): T;
        protected storeFocusedElement(): void;
        protected focusFilterEditor(): void;
    }
}
