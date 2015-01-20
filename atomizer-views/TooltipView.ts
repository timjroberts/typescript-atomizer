/// <reference path="../typings/atom.d.ts" />
/// <reference path="../typings/space-pen/space-pen.d.ts" />

import SpacePen = require("space-pen");

class TooltipView extends SpacePen.View
{
    private _textEditor: TextEditor;
    private _bufferPosition: Point;
    private _text: string;
    private _marker: Marker;

    constructor(textEditor: TextEditor, bufferPosition: Point, text: string)
    {
        super();

        this._textEditor = textEditor;
        this._bufferPosition = bufferPosition;
        this._text = text;
    }

    public attach(): void
    {
        (<any>this).element.appendChild(this.onRenderTooltip()[0]);

        var screenPosition: Point = this._textEditor.screenPositionForBufferPosition(this._bufferPosition);

        this._marker = this._textEditor.markScreenRange([screenPosition, screenPosition], { invalidate: "never" });

        this._textEditor.decorateMarker(this._marker, { type: "overlay", position: "tail", item: this });
    }

    public detach(): void
    {
        this._marker.destroy();
    }

    public static content(): void
    {
        TooltipView.div({ class: "typescript-tooltip" });
    }

    protected onRenderTooltip(): JQuery
    {
        return TooltipView.render(() => TooltipView.span(this._text));
    }
}

export = TooltipView;
