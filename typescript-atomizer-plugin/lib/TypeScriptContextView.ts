/// <reference path="../../typings/space-pen/space-pen.d.ts" />

import SpacePen = require("space-pen");
import TypeScriptTextEditor = require("./TypeScriptTextEditor");

class TypeScriptContextView extends SpacePen.View
{
    private _typescriptTextEditor: TypeScriptTextEditor;
    private _overlayDecoration: Decoration;

    constructor(typescriptTextEditor: TypeScriptTextEditor)
    {
        super();

        this._typescriptTextEditor = typescriptTextEditor;
    }

    public static content(): void
    {
        TypeScriptContextView.div({ class: "overlay from-top" }, "Hello World");
    }

    public toggle(): boolean
    {
        if (this.isVisible())
            this.detach();
        else
            this.attach();

        return this.isVisible();
    }

    protected attach(): void
    {
        this._overlayDecoration =
            this._typescriptTextEditor.textEditor.decorateMarker(this._typescriptTextEditor.textEditor.getLastCursor().getMarker(), { type: "overlay", position: "tail", item: this });
    }

    protected detach(): void
    {
        this._overlayDecoration.destroy();
    }
}

export = TypeScriptContextView;
