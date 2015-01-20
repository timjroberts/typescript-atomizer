/// <reference path="../typings/rx/rx.d.ts" />
/// <reference path="../typings/rx/rx.async-lite.d.ts" />
/// <reference path="../atomizer-core/atomizer-core.d.ts" />

import Rx = require("rx");
import CompositeDisposable = require("atomizer-core/CompositeDisposable");

/**
 * Adapts a HTML element and exposes observable semantics for its associated events.
 */
class HtmlElementAdapter implements Disposable
{
    private _htmlElement: HTMLElement;
    private _onMouseHover: Rx.Subject<Event>;
    private _onMouseMove: Rx.Observable<Event>;
    private _onMouseOut: Rx.Observable<Event>;
    private _subscriptions: CompositeDisposable;

    /**
     * Initializes a new HTMLElementAdapter object.
     *
     * @param htmlElement The HTML element to adapt.
     */
    constructor(htmlElement: HTMLElement)
    {
        this._htmlElement = htmlElement;
        this._subscriptions = new CompositeDisposable();
    }

    /**
     * Gets an observable that generates a stream of events object whenever the mouse moves
     * over the adapted HTML element.
     */
    public get onMouseMove(): Rx.Observable<Event>
    {
        if (!this._onMouseMove)
            this._onMouseMove = Rx.Observable.fromEvent<Event>(this._htmlElement, "mousemove");

        return this._onMouseMove;
    }

    /**
     * Gets an observable that generates a stream of events object whenever the mouse moves
     * out of the adapted HTML element.
     */
    public get onMouseOut(): Rx.Observable<Event>
    {
        if (!this._onMouseOut)
            this._onMouseOut = Rx.Observable.fromEvent<Event>(this._htmlElement, "mouseout");

        return this._onMouseOut;
    }

    /**
     * Gets an observable that generates a stream of events object whenever the mouse hovers
     * over the adapted HTML element.
     */
    public get onMouseHover(): Rx.Observable<Event>
    {
        if (!this._onMouseHover)
            this._onMouseHover = this.initializeOnHoverSubject();

        return this._onMouseHover;
    }

    /**
     * Disposes of the current HTML element adapter.
     */
    public dispose(): void
    {
        this._subscriptions.dispose();
    }

    /**
     * Creates and returns an observable that is triggered when the mouse pointer pauses over
     * the adapted HTML element.
     */
    private initializeOnHoverSubject(): Rx.Subject<Event>
    {
        var onHoverSubject = new Rx.Subject<Event>();
        var hoverTimeout;

        this._subscriptions.push(this.onMouseMove.subscribe((e: Event) =>
            {
                clearTimeout(hoverTimeout);

                hoverTimeout = setTimeout(() =>
                    {
                        clearTimeout(hoverTimeout);

                        onHoverSubject.onNext(e);
                    }, 400);
            }));

        return onHoverSubject;
    }
}

export = HtmlElementAdapter;
