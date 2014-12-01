/// <reference path="../node_modules/typescript-atomizer-typings/atom.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/rx/rx.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/rx/rx.async.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/TypeScriptServices.d.ts" />

import TypeScriptServices = require("./TypeScriptServices");
import Rx = require("rx");
import TypeScriptDocumentRegistry = require("./TypeScriptDocumentRegistry");
import TypeScriptWorkspace = require("./TypeScriptWorkspace");
import TypeScriptTextEditor = require("./TypeScriptTextEditor");

/**
 * Provides the entry point for the TypeScript Atomizer plugin.
 */
module TypeScriptAtomizerPlugin {
    var documentRegistry: TypeScriptDocumentRegistry;
    var typescriptWorkspace: TypeScriptWorkspace;

    var onTypeScriptTextEditorOpened: Rx.Subject<TypeScriptTextEditor>;
    var openedTypeScriptTextEditorsSubscription: Rx.IDisposable;

    /**
     * Called by Atom to activate the plugin.
     */
    export function activate(): void {
        TypeScriptServices.initialize();

        onTypeScriptTextEditorOpened = new Rx.Subject<TypeScriptTextEditor>();

        documentRegistry = new TypeScriptDocumentRegistry(getPackageRootPath());
        typescriptWorkspace = new TypeScriptWorkspace(onTypeScriptTextEditorOpened);

        openedTypeScriptTextEditorsSubscription =
            createTextEditorViewOpenedObservable(atom.workspaceView)
                .filter((ev: TextEditorView, idx: number, obs: Rx.Observable<TextEditorView>): boolean => {
                        return ev.getModel().getGrammar().name === "TypeScript";
                    })
                .select((ev: TextEditorView, idx: number, obs: Rx.Observable<TextEditorView>): TypeScriptTextEditor => {
                        return new TypeScriptTextEditor(ev.getModel(), documentRegistry);
                    })
                .subscribe((tsTextEditor: TypeScriptTextEditor) => {
                        onTypeScriptTextEditorOpened.onNext(tsTextEditor);
                    });
    }

    /**
     * Called by Atom to deactivate the plugin.
     */
    export function deactivate(): void {
        onTypeScriptTextEditorOpened.onCompleted();
        openedTypeScriptTextEditorsSubscription.dispose();

        documentRegistry = null;
        typescriptWorkspace = null;
    }

    /**
     * Returns the root path of package.
     *
     * @returns {string} The root path of the where the package has been installed.
     */
    function getPackageRootPath(): string {
        var packageConfig = require("../package.json");

        return atom.packages.getLoadedPackage(packageConfig.name).path
    }

    /**
     * Returns an observable stream of opened text editors by subscribing to the global Atom WorkspaceView.
     *
     * @param {WorkspaceView} workspaceView - The Atom workspace view.
     * @returns {Rx.Observable<TextEditorView>} An observable stream of opened text editor views.
     */
    function createTextEditorViewOpenedObservable(workspaceView: WorkspaceView): Rx.Observable<TextEditorView> {
        var addHandler =
            (h) => {
                return workspaceView.eachEditorView(h);
            };

        var removeHandler =
            (...args) => {
                var subscription = <Subscription>args[1];

                subscription.off();
            };

        return Rx.Observable.fromEventPattern<TextEditorView>(addHandler, removeHandler);
    }
}

var plugin: AtomPluginModule = TypeScriptAtomizerPlugin;

export = plugin;
