/// <reference path="../../../typings/atom.d.ts" />
/// <reference path="../../../typings/TypeScriptServices.d.ts" />
/// <reference path="../../../atomizer-views/atomizer-views.d.ts" />

import TooltipView = require("atomizer-views/TooltipView");
import TypeScriptQuickInfo = require("../TypeScriptQuickInfo");

class QuickInfoTooltipView extends TooltipView
{
    private _info: TypeScriptQuickInfo;

    constructor(textEditor: TextEditor, info: TypeScriptQuickInfo)
    {
        super(textEditor, info.bufferPosition, "");

        this._info = info;
    }

    public static content(): void
    {
        QuickInfoTooltipView.div({ class: "typescript-tooltip" });
    }

    protected onRenderTooltip(): JQuery
    {
        return QuickInfoTooltipView.render(() =>
            {
                QuickInfoTooltipView.div(() =>
                    {
                        QuickInfoTooltipView.div({ class: "display-parts" }, () =>
                            {
                                this._info.info.displayParts.forEach((p: ts.SymbolDisplayPart) => QuickInfoTooltipView.span({ class: p.kind }, p.text))
                            });
                            
                        if (this._info.info.documentation)
                        {
                            QuickInfoTooltipView.div({ class: "documentation" }, () =>
                                {
                                    this._info.info.documentation.forEach((p: ts.SymbolDisplayPart) => QuickInfoTooltipView.span({ class: p.kind }, p.text))
                                });
                        }
                    });
            });
    }
}

export = QuickInfoTooltipView;
