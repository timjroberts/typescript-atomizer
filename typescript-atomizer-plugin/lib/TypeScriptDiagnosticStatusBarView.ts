/// <reference path="./HTMLExtensions.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/rx/rx.d.ts" />

import TypeScriptDiagnosticStatusBar = require("./TypeScriptDiagnosticStatusBar");

var elementPrototype: ModelBasedHTMLElement<TypeScriptDiagnosticStatusBar> = Object.create(HTMLElement.prototype);

elementPrototype.createdCallback =
    function() {
        this.statusBarElementDiv = document.createElement("div");

        this.errorStatusDiv = document.createElement("span");
        this.errorStatusDiv.innerHTML = "&nbsp;&nbsp;"
        this.errorStatusDiv.classList.add("text-smaller", "highlight-success");

        this.statusBarElementDiv.appendChild(this.errorStatusDiv);

        this.highlightedErrorDiv = document.createElement("span");
        this.highlightedErrorDiv.classList.add("text-highlight");

        this.statusBarElementDiv.appendChild(this.highlightedErrorDiv);

        this.appendChild(this.statusBarElementDiv);
    }

elementPrototype.attachedCallback =
    function() {
        console.log("typescript-diag-status-bar: attached");
    }

elementPrototype.setModel =
    function(statusBar: TypeScriptDiagnosticStatusBar) {
        statusBar.onVisibilityChanged.subscribe((visible: boolean) => {
                this.statusBarElementDiv.hidden = !visible;
            });

        statusBar.onErrorStateChanged.subscribe((errorState: boolean) => {
                if (errorState) {
                    this.errorStatusDiv.classList.remove("highlight-success");
                    this.errorStatusDiv.classList.add("highlight-error");
                } else {
                    this.errorStatusDiv.classList.remove("highlight-error");
                    this.errorStatusDiv.classList.add("highlight-success");
                }
            });

        statusBar.onMessageChanged.subscribe((message: string) => {
                this.highlightedErrorDiv.textContent = " " + message;
            });
    }

var element = (<DocumentExtentions>document).registerElement("typescript-diag-status-bar", { prototype: elementPrototype, extends: "div" });

export = element;
