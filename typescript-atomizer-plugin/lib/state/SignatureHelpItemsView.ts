/// <reference path="../../../typings/atom.d.ts" />
/// <reference path="../../../typings/TypeScriptServices.d.ts" />
/// <reference path="../../../typings/space-pen/space-pen.d.ts" />

import SpacePen = require("space-pen");

class SignatureHelpItemsTooltipView extends SpacePen.View
{
    private _textEditor: TextEditor;
    private _signatureHelpItems: ts.SignatureHelpItems;
    private _overlayDecoration: Decoration;

    constructor(textEditor: TextEditor)
    {
        super();

        this._textEditor = textEditor;
        this._signatureHelpItems = null;
    }

    public toggle(): boolean
    {
        if (this.isVisible())
            this.detach();
        else
            this.attach();

        return this.isVisible();
    }

    public attach(): void
    {
        (<any>this).element.appendChild(this.onRenderTooltip()[0]);

        var screenPosition: Point = this._textEditor.screenPositionForBufferPosition(this._textEditor.getCursorBufferPosition());

        this._overlayDecoration = this._textEditor.decorateMarker(this._textEditor.getLastCursor().getMarker(), { type: "overlay", position: "tail", item: this });
    }

    public detach(): void
    {
        if (this._overlayDecoration)
            this._overlayDecoration.destroy();
    }

    public setHelpItems(signatureHelpItems: ts.SignatureHelpItems)
    {
        this._signatureHelpItems = signatureHelpItems;

        if (this.isVisible())
        {
            while ((<any>this).element.firstChild)
                (<any>this).element.removeChild((<any>this).element.firstChild);

            (<any>this).element.appendChild(this.onRenderTooltip()[0]);
        }
    }

    public static content(): void
    {
        SignatureHelpItemsTooltipView.div({ class: "typescript-tooltip" });
    }

    protected onRenderTooltip(): JQuery
    {
        return SignatureHelpItemsTooltipView.render(() =>
            {
                SignatureHelpItemsTooltipView.div(() =>
                    {
                        if (!this._signatureHelpItems)
                            return;

                        var item: ts.SignatureHelpItem = this._signatureHelpItems.items[0];

                        SignatureHelpItemsTooltipView.div({ class: "display-parts" }, () =>
                            {
                                item.prefixDisplayParts.forEach((p: ts.SymbolDisplayPart) => SignatureHelpItemsTooltipView.span({ class: p.kind }, p.text));
                                for (var idx = 0; idx < item.parameters.length; idx++)
                                {
                                    if (idx > 0)
                                    {
                                        item.separatorDisplayParts.forEach((p: ts.SymbolDisplayPart) => SignatureHelpItemsTooltipView.span({ class: p.kind }, p.text));
                                    }

                                    if (item.parameters[idx])
                                    {
                                        SignatureHelpItemsTooltipView.span({ class: "parameter" + ((idx === this._signatureHelpItems.argumentIndex) ? " highlight-info" : "") }, () =>
                                            {
                                                item.parameters[idx].displayParts.forEach((p: ts.SymbolDisplayPart) => SignatureHelpItemsTooltipView.span({ class: p.kind }, p.text));
                                            });
                                    }
                                }
                                item.suffixDisplayParts.forEach((p: ts.SymbolDisplayPart) => SignatureHelpItemsTooltipView.span({ class: p.kind }, p.text));
                            });

                        if (!item.parameters[this._signatureHelpItems.argumentIndex])
                            return;

                        SignatureHelpItemsTooltipView.div({ class: "documentation" }, () =>
                            {
                                item.parameters[this._signatureHelpItems.argumentIndex].documentation.forEach((p: ts.SymbolDisplayPart) => SignatureHelpItemsTooltipView.span({ class: p.kind }, p.text));
                            });
                    });
            });
    }
}

export = SignatureHelpItemsTooltipView;
