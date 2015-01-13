/// <reference path="../typings/atom.d.ts" />
/// <reference path="../typings/rx/rx.d.ts" />
/// <reference path="../typings/rx/rx.async.d.ts" />

import Rx = require("rx");

/**
 * Provides methods for creating Observables.
 */
class ObservableFactory
{
    /**
     * Creates an observable from an Atom event source that will be automatically disposed of when
     * the subscribers dispose of the observable.
     *
     * @param subscribe - A function that returns the disposable.
     * @returns An observable stream of result objects.
     */
    public static createDisposableObservable<TResult>(subscribe: (handler: any) => Disposable): Rx.Observable<TResult>
    {
        var addHandler =
            (h) => { return subscribe(h); };

        var removeHandler =
            (...args) =>
            {
                var disposable = <Disposable>args[1];

                disposable.dispose();
            };

        return Rx.Observable.fromEventPattern<TResult>(addHandler, removeHandler);
    }
}

export = ObservableFactory;
