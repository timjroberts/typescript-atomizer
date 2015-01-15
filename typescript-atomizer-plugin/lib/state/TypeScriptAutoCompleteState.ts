/// <reference path="../../../atomizer-core/atomizer-core.d.ts" />

import TypeScriptAutoCompleteView = require("../TypeScriptAutoCompleteView");
import TypeScriptTextEditor = require("../TypeScriptTextEditor");
import SelectionFixes = require("atomizer-views/SelectionFixes");

class TypeScriptAutoCompleteState
{
    private _autoCompleteView: TypeScriptAutoCompleteView;

    constructor(typescriptTextEditor: TypeScriptTextEditor)
    {
        this._autoCompleteView = new TypeScriptAutoCompleteView(typescriptTextEditor);
    }

    /**
     * Gets a flag indicating whether the auto-complete view is active.
     */
    public get inProgress(): boolean { return this._autoCompleteView.isVisible(); }

    public toggleView(): void
    {
        this._autoCompleteView.toggle();
    }

    public updateAutoCompleteFromSelectionFixes(fixes: SelectionFixes): void
    {
        if (this._autoCompleteView.isVisible)
            this._autoCompleteView.updateSelectionFixes(fixes);
    }

    public selectNextAutoCompleteItem(): void
    {
        if (this._autoCompleteView.isVisible)
            this._autoCompleteView.moveToNextItem();
    }

    public selectPreviousAutoCompleteItem(): void
    {
        if (this._autoCompleteView.isVisible)
            this._autoCompleteView.moveToPreviousItem();
    }

    public confirmAutoComplete(): void
    {
        if (this._autoCompleteView.isVisible)
            this._autoCompleteView.selectItem();
    }
}

export = TypeScriptAutoCompleteState;
