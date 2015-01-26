/// <reference path="./core/HTMLExtensions.d.ts" />
/// <reference path="../../typings/rx/rx.d.ts" />

import TypeScriptDiagnosticStatusBar = require("./TypeScriptDiagnosticStatusBar");

var elementPrototype: ModelBasedHTMLElement<TypeScriptDiagnosticStatusBar> = Object.create(HTMLElement.prototype);

elementPrototype.createdCallback =
    function()
    {
        this.statusBarElementDiv = document.createElement("div");

        this.errorStatusDiv = document.createElement("span");
        this.errorStatusDiv.innerHTML = "&nbsp;&nbsp;"
        this.errorStatusDiv.classList.add("text-smaller", "highlight-success");

        this.statusBarElementDiv.appendChild(this.errorStatusDiv);

        this.appendChild(this.statusBarElementDiv);
    }

//elementPrototype.attachedCallback =
//    function()
//    {
//
//    }

elementPrototype.setModel =
    function(statusBar: TypeScriptDiagnosticStatusBar)
    {
        statusBar.onVisibilityChanged
            .subscribe((visible: boolean) =>
            {
                this.statusBarElementDiv.hidden = !visible;
            });

        statusBar.onErrorStateChanged
            .subscribe((errorState: boolean) =>
            {
                if (errorState)
                {
                    this.errorStatusDiv.classList.remove("highlight-success");
                    this.errorStatusDiv.classList.add("highlight-error");
                }
                else
                {
                    this.errorStatusDiv.classList.remove("highlight-error");
                    this.errorStatusDiv.classList.add("highlight-success");
                }
            });
    }

var element = (<DocumentExtentions>document).registerElement("typescript-diag-status-bar", { prototype: elementPrototype, extends: "div" });

export = element;
