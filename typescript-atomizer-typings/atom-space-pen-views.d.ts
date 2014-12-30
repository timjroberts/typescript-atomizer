/// <reference path="./atom.d.ts" />

declare module "atom-space-pen-views" {
    class View {
        addClass(cssClass: string): void;
        isVisible(): boolean;
        attach(): void;
    }

    export class SelectListView<T> extends View {
        filterEditorView: TextEditorView;
        list: HTMLElement;

        width(width: number);
        cancel(): void;

        setItems(items: Array<T>);

        viewForItem(item: T): HTMLElement;
        confirmed(item: T): void;

        selectPreviousItemView(): void;
        selectNextItemView(): void;

        selectItemView(item: any): void;
        getSelectedItem(): T;

        storeFocusedElement(): void;
        focusFilterEditor(): void;
    }
}
