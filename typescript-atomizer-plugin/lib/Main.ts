/// <reference path="../node_modules/typescript-atomizer-typings/atom.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/rx/rx.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/rx/rx.async.d.ts" />
/// <reference path="../node_modules/typescript-atomizer-typings/TypeScriptServices.d.ts" />

import TypeScriptServices = require("./TypeScriptServices");
import Rx = require("rx");
import TypeScriptDocumentRegistry = require("./TypeScriptDocumentRegistry");
import TypeScriptWorkspace = require("./TypeScriptWorkspace");
import TypeScriptTextEditor = require("./TypeScriptTextEditor");
import TypeScriptDiagnosticStatusBar = require("./TypeScriptDiagnosticStatusBar");
import TypeScriptDiagnosticStatusBarView = require("./TypeScriptDiagnosticStatusBarView");

/**
 * Provides the entry point for the TypeScript Atomizer plugin.
 */
module TypeScriptAtomizerPlugin {
    var disposableViewProviders: Array<Disposable>;
    var documentRegistry: TypeScriptDocumentRegistry;
    var statusBar: TypeScriptDiagnosticStatusBar;
    var typescriptWorkspace: TypeScriptWorkspace;

    var onTypeScriptTextEditorOpened: Rx.Subject<TypeScriptTextEditor>;
    var openedTypeScriptTextEditorsSubscription: Rx.IDisposable;

    /**
     * Called by Atom to activate the plugin.
     */
    export function activate(): void {
        TypeScriptServices.initialize();

        disposableViewProviders = registerViewProviders();

        onTypeScriptTextEditorOpened = new Rx.Subject<TypeScriptTextEditor>();

        documentRegistry = new TypeScriptDocumentRegistry(getPackageRootPath());
        typescriptWorkspace = new TypeScriptWorkspace(atom.workspaceView, atom.views, onTypeScriptTextEditorOpened);

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

        disposableViewProviders.forEach((disposable: Disposable) => { disposable.dispose(); });

        documentRegistry = null;
        statusBar = null;
        typescriptWorkspace = null;
        disposableViewProviders = null;
    }

    /**
     * Registers the view providers for the global level views and their associated models with the Atom
     * view registry.
     *
     * @returns {Array<Disposable>} An array of disposable objects that can be used to remove the view
     * providers from the Atom view registry.
     */
    function registerViewProviders(): Array<Disposable> {
        var statusBarViewProvider =
            atom.views.addViewProvider({
                    modelConstructor: TypeScriptDiagnosticStatusBar,
                    createView: () => { return new TypeScriptDiagnosticStatusBarView() }
                });

        return [ statusBarViewProvider ];
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
