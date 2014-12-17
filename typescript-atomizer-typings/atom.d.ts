/**
 * Represents an Atom Plugin module.
 */
interface AtomPluginModule {
    /**
     * Called when Atom activates the plugin.
     */
    activate(): void;

    /**
     * Called when Atom deactivates the plugin.
     */
    deactivate(): void;
}

/**
 * Represents a grammar.
 */
interface Grammar {
    /**
     * Gets or sets the name of the grammar.
     */
    name: string;
}

/**
 * A mutable text container with undo/redo support and the ability to annotate logical regions in the text.
 */
interface TextBuffer {
    /**
     * Gets the entire text of the buffer.
     */
    getText(): string;
}

/**
 * Represents a point in a buffer in row/column coordinates.
 */
declare class Point {
    /**
     * Creates a new {Point} object.
     *
     * @param {number} row - The row number.
     * @param {number} columm - The column number.
     */
    constructor(row: number, column: number);

    row: number;
    column: number;
}

/**
 * Represents a region in a buffer in row/column coordinates.
 */
interface Range {
    /**
     * Determines if a given point is within the range.
     *
     * @param {Point} point - A {Point} or point-compatible array.
     * @param {boolean} exclusive - A boolean value indicating that the containment should be exclusive of
     * endpoints. Defaults to false.
     */
    containsPoint(point: Point, exclusive?: boolean): boolean;
}

/**
 * Represents a buffer annotation that remains logically stationary even as the buffer changes. This is used
 * to represent cursors, folds, snippet targets, misspelled words, any anything else that needs to track a
 * logical location in the buffer over time.
 */
interface Marker {
    /**
     * Destroys the marker, causing it to emit the 'destroyed' event. Once destroyed, a marker cannot be
     * restored by undo/redo operations.
     */
    destroy(): void;

    /**
     * Gets the screen range of the display marker.
     */
    getScreenRange(): Range;
}

interface Cursor {
    getScreenPosition(): Point;

    onDidChangePosition(callback: (event: any) => void): Disposable;
}

interface ScopeDescriptor {

}

/**
 * Represents all essential editing state for a single TextBuffer, including cursor and selection
 * position, folds, and soft wraps.
 *
 * A single TextBuffer can be belong to multiple editors.
 */
interface TextEditor {
    /**
     * Returns the grammar that the editor is using.
     */
    getGrammar(): Grammar;

    /**
     * Returns the string path of the underlying text buffer.
     */
    getPath(): string;

    /**
     * Returns the text contained in the underlying text buffer.
     */
    getText(): string;

    getLastCursor(): Cursor;

    /**
     * Returns the underlying text buffer.
     */
    getBuffer(): TextBuffer;

    getCursorBufferPosition(): Point;

    scopeDescriptorForBufferPosition(p1: any): ScopeDescriptor;

    screenPositionForBufferPosition(bufferPosition: Point): Point;
    screenPositionForBufferPosition(bufferPosition: Array<number>): Point;

    markBufferRange(points: Point[], options: any): Marker;
    markScreenRange(points: Point[], options: any): Marker;

    decorateMarker(marker: Marker, options: any);

    /**
     * Invoke the given callback when the editor is destroyed.
     *
     * @returns {Disposable} A disposable on which 'dispose' can be called to unsubscribe.
     */
    onDidDestroy(callback: () => void): Disposable;

    /**
     * Invoke the given callback when the underlying buffer's contents change.
     *
     * @returns {Disposable} A disposable on which 'dispose' can be called to unsubscribe.
     */
    onDidStopChanging(callback: () => void): Disposable;
}

/**
 * Represents the entire visual pane in Atom.
 *
 * The {TextEditorView} manages the {TextEditor}, which manages the file buffers.
 */
interface TextEditorView {
    /**
     * Returns the underlying Editor that the view is based on.
     */
    getModel(): TextEditor;
}

/**
 * Represents a subscription to an event.
 */
interface Subscription {
    /**
     * Unregisters the current subscription.
     */
    off(): void;
}

/**
 * A handle to a resource that can be disposed.
 */
interface Disposable {
    /**
     * Perform the disposal action, indicating that the resource associated with this disposable
     * is no longer needed.
     */
    dispose(): void;
}

interface StatusBar {
    prependLeft(view: HTMLElement);
    appendLeft(view: HTMLElement);
}

/**
 * Represents the state of the user interface for the entire Atom window.
 */
interface Workspace {
    /**
     * Invoke the given callback with all current and future text editors in the workspace.
     *
     * @param {callback: (editor: TextEditor) => void} callback - The callback to invoke for each {TextEditor}.
     * @returns {Disposable} A disposable on which 'dispose' can be called to unsubscribe.
     */
    observeTextEditors(callback: (editor: TextEditor) => void): Disposable;

    onDidChangeActivePaneItem(callback: (item: any) => void): Disposable;

    getActiveTextEditor(): TextEditor;
}

/**
 * The top-level view for the entire Atom window.
 *
 * Access to {WorkspaceView} can be made via {AtomGlobal#workspaceView}.
 */
interface WorkspaceView {
    /*
     * Registers a function to be called for every current and future {EditorView} in the workspace.
     *
     * @param {(ev: TextEditorView) => void} callback - The callback to invoke for each {EditorView}.
     * @returns {Subscription} A subscription object with an 'off' method that you can call to unregister the callback.
     */
    eachEditorView(callback: (ev: TextEditorView) => void): Subscription;

    statusBar: StatusBar;
}

/**
 * Represents an Atom package.
 */
interface Package {
    /**
     * The path to the location where the package has been installed.
     */
    path: string;
}

/**
 * Package manager for coordinating the lifecycle of Atom packages.
 */
interface PackageManager {
    /**
     * Gets the loaded {Package} with the given name.
     *
     * @param {string} name - The package name.
     */
    getLoadedPackage(name: string): Package;
}

/**
 * ViewRegistry handles the association between model and view types in Atom.
 */
interface ViewRegistry {
    addViewProvider(providerSpec: { modelConstructor: Function; viewConstructor?: Function; createView?: Function }): Disposable;

    getView(object: any): HTMLElement;
}

/**
 * Used to access all of Atom's configuration details.
 */
interface Config {
    get(scopeDescriptor?: ScopeDescriptor, keyPath?: string): any;

    set(scopeDescriptor?: ScopeDescriptor, keyPath?: string, value?: any);
}

/**
 * Atom global for dealing with packages, themes, menus, and the window.
 *
 * An instance of {AtomGlobal} is always available via the 'atom' global property.
 */
interface AtomGlobal {
    /**
     * Gets the {Workspace} that represents the state of the user interface for the entire Atom window.
     */
    workspace: Workspace;

    /**
     * Gets the {WorkspaceView} that represents the current Atom window.
     */
    workspaceView: WorkspaceView;

    /**
     * Gets the global {PackageManager}.
     */
    packages: PackageManager;

    /**
     * Get the {ViewRegistry}.
     */
    views: ViewRegistry;

    config: Config;
}

declare var atom: AtomGlobal;
