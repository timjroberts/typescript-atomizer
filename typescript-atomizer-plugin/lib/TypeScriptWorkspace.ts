/// <reference path="../node_modules/typescript-atomizer-typings/TypeScriptServices.d.ts" />

import Rx = require("rx");
import TypeScriptTextEditor = require("./TypeScriptTextEditor");

class TypeScriptWorkspace {
    constructor(onTypeScriptTextEditorOpened: Rx.Observable<TypeScriptTextEditor>) {
        onTypeScriptTextEditorOpened.subscribe((tsTextEditor: TypeScriptTextEditor) => this.onTypeScriptTextEditorOpened.call(this, tsTextEditor));
    }

    /**
     * Called when a TypeScript document has been opened in the Atom workspace.
     *
     * @param {TypeScriptTextEditor} tsTextEditor - The TypeScript text editor that has been opened.
     */
    private onTypeScriptTextEditorOpened(tsTextEditor: TypeScriptTextEditor): void {
        tsTextEditor.onContentsChanged.subscribe((tsTextEditor) => this.onTypeScriptTextEditorContentsChanged.call(this, tsTextEditor));
    }

    private onTypeScriptTextEditorContentsChanged(tsTextEditor: TypeScriptTextEditor): void {
        var diagnostics: Array<ts.Diagnostic> = tsTextEditor.getLanguageDiagnostics();
    }
}

export = TypeScriptWorkspace;
