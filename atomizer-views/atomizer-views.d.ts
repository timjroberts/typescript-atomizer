/// <reference path="./AutoCompleteView.ts" />
/// <reference path="./SelectionFixes.ts" />
/// <reference path="./HtmlElementAdapter.ts" />
/// <reference path="./TooltipView.ts" />

declare module "atomizer-views/AutoCompleteView"
{
    import AutoCompleteView = require("AutoCompleteView");
    export = AutoCompleteView;
}

declare module "atomizer-views/SelectionFixes"
{
    import SelectionFixes = require("SelectionFixes");
    export = SelectionFixes;
}

declare module "atomizer-views/HtmlElementAdapter"
{
    import HtmlElementAdapter = require("HtmlElementAdapter");
    export = HtmlElementAdapter;
}

declare module "atomizer-views/TooltipView"
{
    import TooltipView = require("TooltipView");
    export = TooltipView;
}
