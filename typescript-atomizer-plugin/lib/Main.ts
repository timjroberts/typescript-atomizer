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
import TypeScriptTextEditorCodeCompletionsProvider = require("./TypeScriptTextEditorCodeCompletionsProvider");

/**
 * Provides the entry point for the TypeScript Atomizer plugin.
 */
module TypeScriptAtomizerPlugin {
    var disposableViewProviders: Array<Disposable>;
    var documentRegistry: TypeScriptDocumentRegistry;
    var typescriptWorkspace: TypeScriptWorkspace;

    var onTypeScriptTextEditorOpened: Rx.Subject<TypeScriptTextEditor>;
    var onTextEditorChanged: Rx.Subject<TextEditor>;
    var textEditorChangedSubscription: Rx.IDisposable;
    var openedTypeScriptTextEditorsSubscription: Rx.IDisposable;

    /**
     * Called by Atom to activate the plugin.
     */
    export function activate(): void {
        TypeScriptServices.initialize();

        disposableViewProviders = registerViewProviders();

        onTypeScriptTextEditorOpened = new Rx.Subject<TypeScriptTextEditor>();
        onTextEditorChanged = new Rx.Subject<TextEditor>();

        documentRegistry = new TypeScriptDocumentRegistry(getPackageRootPath());
        typescriptWorkspace = new TypeScriptWorkspace(atom, onTypeScriptTextEditorOpened, onTextEditorChanged);

        openedTypeScriptTextEditorsSubscription =
            createTextEditorOpenedObservable(atom.workspace)
                .filter((editor: TextEditor, idx: number, obs: Rx.Observable<TextEditor>): boolean => {
                        return !editor.mini && editor.getGrammar().name === "TypeScript";
                    })
                .select((editor: TextEditor, idx: number, obs: Rx.Observable<TextEditor>): TypeScriptTextEditor => {
                        return new TypeScriptTextEditor(editor, documentRegistry);
                    })
                .subscribe((tsTextEditor: TypeScriptTextEditor) => {
                        onTypeScriptTextEditorOpened.onNext(tsTextEditor);
                    });

        textEditorChangedSubscription =
            createActivePaneItemChangedObservable(atom.workspace)
                .subscribe((item: Object) => {
                        onTextEditorChanged.onNext(atom.workspace.getActiveTextEditor());
                    });
    }

    /**
     * Called by Atom to deactivate the plugin.
     */
    export function deactivate(): void {
        onTypeScriptTextEditorOpened.onCompleted();
        openedTypeScriptTextEditorsSubscription.dispose();
        onTextEditorChanged.onCompleted();
        textEditorChangedSubscription.dispose();

        disposableViewProviders.forEach((disposable: Disposable) => { disposable.dispose(); });

        typescriptWorkspace.dispose();

        documentRegistry = null;
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
     * Returns an observable stream of opened text editors by subscribing to the global Atom Workspace.
     *
     * @param {Workspace} workspace - The Atom workspace.
     * @returns {Rx.Observable<TextEditor>} An observable stream of opened text editors.
     */
    function createTextEditorOpenedObservable(workspace: Workspace): Rx.Observable<TextEditor> {
        var addHandler =
            (h) => {
                return workspace.observeTextEditors(h);
            };

        var removeHandler =
            (...args) => {
                var subscription = <Disposable>args[1];

                subscription.dispose();
            };

        return Rx.Observable.fromEventPattern<TextEditor>(addHandler, removeHandler);
    }

    /**
     * Returns an observable stream of acivate pane items in the global Atom Workspace.
     *
     * @param {Workspace} workspace - The Atom workspace.
     * @returns {Rx.Observable<Object>} An observable stream of active pane items.
     */
    function createActivePaneItemChangedObservable(workspace: Workspace): Rx.Observable<Object> {
        var addHandler =
        (h) => {
            return workspace.onDidChangeActivePaneItem(h);
        };

        var removeHandler =
        (...args) => {
            var subscription = <Disposable>args[1];

            subscription.dispose();
        };

        return Rx.Observable.fromEventPattern<Object>(addHandler, removeHandler);
    }
}

var plugin: AtomPluginModule = TypeScriptAtomizerPlugin;

export = plugin;
