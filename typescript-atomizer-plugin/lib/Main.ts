/// <reference path="../../typings/atom.d.ts" />
/// <reference path="../../typings/rx/rx.d.ts" />
/// <reference path="../../typings/rx/rx.async.d.ts" />
/// <reference path="../../typings/TypeScriptServices.d.ts" />

import ObservableFactory = require("./core/ObservableFactory");
import TypeScriptServices = require("./TypeScriptServices");
import Rx = require("rx");
import TypeScriptDocumentRegistry = require("./TypeScriptDocumentRegistry");
import TypeScriptWorkspace = require("./TypeScriptWorkspace");
import TypeScriptTextEditor = require("./TypeScriptTextEditor");
import TypeScriptDiagnosticStatusBar = require("./TypeScriptDiagnosticStatusBar");
import TypeScriptDiagnosticStatusBarView = require("./TypeScriptDiagnosticStatusBarView");
import CompositeDisposable = require("./core/CompositeDisposable");

/**
 * Provides the entry point for the TypeScript Atomizer plugin.
 */
module TypeScriptAtomizerPlugin
{
    var onTypeScriptTextEditorOpened: Rx.Subject<TypeScriptTextEditor>;
    var onTextEditorChanged: Rx.Subject<TextEditor>;
    var disposables: CompositeDisposable;

    /**
     * Called by Atom to activate the plugin.
     */
    export function activate(): void
    {
        TypeScriptServices.initialize();

        disposables = new CompositeDisposable();

        onTypeScriptTextEditorOpened = new Rx.Subject<TypeScriptTextEditor>();
        onTextEditorChanged = new Rx.Subject<TextEditor>();

        var documentRegistry = new TypeScriptDocumentRegistry(getPackageRootPath());

        disposables.push(registerViewProviders());
        disposables.push(documentRegistry);
        disposables.push(new TypeScriptWorkspace(atom, onTypeScriptTextEditorOpened, onTextEditorChanged));

        disposables.push(ObservableFactory.createDisposableObservable<TextEditor>((h) => atom.workspace.observeTextEditors(h))
                .filter((editor: TextEditor, idx: number, obs: Rx.Observable<TextEditor>): boolean =>
                {
                    return !editor.mini && editor.getGrammar().name === "TypeScript";
                })
                .select((editor: TextEditor, idx: number, obs: Rx.Observable<TextEditor>): TypeScriptTextEditor =>
                {
                    return new TypeScriptTextEditor(editor, documentRegistry);
                })
                .subscribe((tsTextEditor: TypeScriptTextEditor) =>
                {
                    onTypeScriptTextEditorOpened.onNext(tsTextEditor);
                }));

        disposables.push(ObservableFactory.createDisposableObservable<TextEditor>((h) => atom.workspace.onDidChangeActivePaneItem(h))
                .subscribe((item: Object) =>
                {
                    onTextEditorChanged.onNext(atom.workspace.getActiveTextEditor());
                }));
    }

    /**
     * Called by Atom to deactivate the plugin.
     */
    export function deactivate(): void
    {
        onTypeScriptTextEditorOpened.onCompleted();
        onTextEditorChanged.onCompleted();

        disposables.dispose();
    }

    /**
     * Registers the view providers for the global level views and their associated models with the Atom
     * view registry.
     *
     * @returns {Array<Disposable>} An array of disposable objects that can be used to remove the view
     * providers from the Atom view registry.
     */
    function registerViewProviders(): CompositeDisposable
    {
        var disposable = new CompositeDisposable();

        disposable.push(atom.views.addViewProvider(
            {
                modelConstructor: TypeScriptDiagnosticStatusBar,
                createView: () => { return new TypeScriptDiagnosticStatusBarView() }
            }));

        return disposable;
    }

    /**
     * Returns the root path of package.
     *
     * @returns {string} The root path of the where the package has been installed.
     */
    function getPackageRootPath(): string
    {
        var packageConfig = require("../package.json");

        return atom.packages.getLoadedPackage(packageConfig.name).path
    }
}

var plugin: AtomPluginModule = TypeScriptAtomizerPlugin;

export = plugin;
