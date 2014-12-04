/// <reference path="../node_modules/typescript-atomizer-typings/rx/rx.d.ts" />

import Rx = require("rx");

class TypeScriptDiagnosticStatusBar {
    private _onErrorStateChanged: Rx.Subject<boolean>;
    private _onMessageChanged: Rx.Subject<string>;
    private _error: boolean;
    private _message: string;

    constructor() {
        this._onErrorStateChanged = new Rx.Subject<boolean>();
        this._onMessageChanged = new Rx.Subject<string>();
    }

    public get error(): boolean { return this._error; }

    public set error(value: boolean) {
        this._error = value;
        this._onErrorStateChanged.onNext(value);
    }

    public get message(): string { return this._message; }

    public set message(value: string) {
        this._message = value;
        this._onMessageChanged.onNext(value);
    }

    public get onErrorStateChanged(): Rx.Observable<boolean> { return this._onErrorStateChanged; }

    public get onMessageChanged(): Rx.Observable<string> { return this._onMessageChanged; }
}

export = TypeScriptDiagnosticStatusBar;
