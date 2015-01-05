/// <reference path="../../typings/rx/rx.d.ts" />

import Rx = require("rx");

/**
 * Provides the state for the global TypeScript diagnostic status bar.
 */
class TypeScriptDiagnosticStatusBar
{
    private _onErrorStateChanged: Rx.Subject<boolean>;
    private _onMessageChanged: Rx.Subject<string>;
    private _onVisibilityChanged: Rx.Subject<boolean>;
    private _inError: boolean;
    private _message: string;

    /**
     * Initializes a new TypeScript diagnostic status bar.
     */
    constructor()
    {
        this._onErrorStateChanged = new Rx.Subject<boolean>();
        this._onMessageChanged = new Rx.Subject<string>();
        this._onVisibilityChanged = new Rx.Subject<boolean>();
    }

    /**
     * Gets an indicator representing whether the status bar is indicating a document that is in error.
     */
    public get inError(): boolean { return this._inError; }
    /**
     * Sets an indicator represening whether the status bar is indicating a document that is in error.
     */
    public set inError(value: boolean)
    {
        this._inError = value;
        this._onErrorStateChanged.onNext(value);
    }

    /**
     * Gets the message currently being displayed by the status bar.
     */
    public get message(): string { return this._message; }
    /**
     * Sets the message to be displayed by the status bar.
     */
    public set message(value: string)
    {
        this._message = value;
        this._onMessageChanged.onNext(value);
    }

    /**
     * Gets an observable that when subscribed to will indicate when the status bar's error state has changed.
     */
    public get onErrorStateChanged(): Rx.Observable<boolean> { return this._onErrorStateChanged; }

    /**
     * Gets an observable that when subscribed to will indicate when the status bar's current message has changed.
     */
    public get onMessageChanged(): Rx.Observable<string> { return this._onMessageChanged; }

    /**
     * Gets an observable that when subscribed to will indicate when the status bar's visibility has changed.
     */
    public get onVisibilityChanged(): Rx.Observable<boolean> { return this._onVisibilityChanged;  }

    /**
     * Hides the status bar.
     */
    public hide(): void
    {
        this._onVisibilityChanged.onNext(false);
    }

    /**
     * Shows the status bar.
     */
    public show(): void
    {
        this._onVisibilityChanged.onNext(true);
    }
}

export = TypeScriptDiagnosticStatusBar;
