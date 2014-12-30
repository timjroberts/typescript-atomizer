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

interface ScanMatch {
    match: any;
    matchText: string;
    range: Range;
    stop: () => void;
    replace: (replaceText: string) => void;
}

/**
 * A mutable text container with undo/redo support and the ability to annotate logical regions in the text.
 */
interface TextBuffer {
    /**
     * Gets the entire text of the buffer.
     */
    getText(): string;

    /**
     * Deletes the text in a given range.
     *
     * @param {Range} range - A range in which to delete. The range is clipped before deleting.
     * @returns {Range} An empty range starting at the start of the deleted range.
     */
    delete(range: Range): Range;

    scanInRange(regex: RegExp, range: Range, callback: (match: ScanMatch) => void);
    scanInRange(regex: RegExp, range: number[][], callback: (match: ScanMatch) => void);
}

/**
 * Represents a point in a buffer in row/column coordinates.
 */
interface Point {
    /**
     * Creates a new {Point} object.
     *
     * @param {number} row - The row number.
     * @param {number} columm - The column number.
     */
    //constructor(row: number, column: number);

    row: number;
    column: number;

    isLessThan(point: Point): boolean;
    isGreaterThan(point: Point): boolean;

    //static fromObject(obj: any): Point;
}

/**
 * Represents a region in a buffer in row/column coordinates.
 */
interface Range {
    start: Point;
    end: Point;

    copy(): Range;

    /**
     * Determines if a given point is within the range.
     *
     * @param {Point} point - A {Point} or point-compatible array.
     * @param {boolean} exclusive - A boolean value indicating that the containment should be exclusive of
     * endpoints. Defaults to false.
     */
    containsPoint(point: Point, exclusive?: boolean): boolean;

    intersectsWith(range: Range): boolean;
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

interface Decoration {
    destroy(): void;
}

interface Cursor {
    getScreenPosition(): Point;
    getBufferPosition(): Point;

    setBufferPosition(point: Point): void;
    setBufferPosition(point: number[]): void;

    getMarker(): Marker;

    onDidChangePosition(callback: (event: any) => void): Disposable;
}

interface ScopeDescriptor {

}

interface Checkpoint {

}

interface TextEditorView {
    getModel(): TextEditor;
}

interface InsertTextEvent {
    cancel: Function;
    text: string;
}

interface Selection {
    getBufferRange(): Range;

    deleteSelectedText(): void;

    clear(): void;
}

/**
 * Represents all essential editing state for a single TextBuffer, including cursor and selection
 * position, folds, and soft wraps.
 *
 * A single TextBuffer can be belong to multiple editors.
 */
interface TextEditor {
    mini: boolean;

    isDestroyed(): boolean;

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

    getCursors(): Array<Cursor>;
    getLastCursor(): Cursor;

    /**
     * Returns the underlying text buffer.
     */
    getBuffer(): TextBuffer;

    /**
     * Returns a string representing the contents of the line at a given buffer row.
     *
     * @param {number} bufferRow - A number representing the zero-indexed buffer row.
     * @returns {string} A string representing the contents of the line at the given buffer row.
     */
    lineTextForBufferRow(bufferRow: number): string;

    getCursorBufferPosition(): Point;

    scopeDescriptorForBufferPosition(p1: any): ScopeDescriptor;

    screenPositionForBufferPosition(bufferPosition: Point): Point;
    screenPositionForBufferPosition(bufferPosition: Array<number>): Point;

    markBufferRange(points: Point[], options: any): Marker;
    markScreenRange(points: Point[], options: any): Marker;

    decorateMarker(marker: Marker, options: any): Decoration;

    createCheckpoint(): Checkpoint;
    revertToCheckpoint(checkpoint: Checkpoint): void;

    insertText(text: string, options?: any);

    getSelectedText(): string;

    getLastSelection(): Selection;
    getSelections(): Array<Selection>;

    setSelectedBufferRanges(ranges: Array<Range>, options?: any): void;
    setSelectedBufferRanges(ranges: any[][], options?: any): void;

    /**
     * Batch multiple operations as a single undo/redo step.
     *
     * @param {number} groupingInterval - The number of milliseconds for which this transaction should be
     * considered 'groupable' after it begins.
     * @param {Function} fn - A function to call inside the transaction.
     */
    transact(groupingInterval: number, fn: Function);
    /**
     * Batch multiple operations as a single undo/redo step.
     *
     * @param {Function} fn - A function to call inside the transaction.
     */
    transact(fn: Function);

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

    onWillInsertText(callback: (insertEvent: InsertTextEvent) => void): Disposable;
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

    mainModule: any;
}

interface Continuation<T> {
    then(callback: (value: T) => void): void;
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

    isPackageActive(name: string): boolean;

    getActivePackage(name: string): Package;

    activatePackage(name: string): Continuation<Package>;
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

interface CommandRegistry {
    add(target: string, commandName: string, callback: (event: Event) => void): Disposable;

    dispatch(target: EventTarget, commandName: string): boolean;
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

    /**
     * Gets the global command registry.
     */
    commands: CommandRegistry;
}

declare var atom: AtomGlobal;
