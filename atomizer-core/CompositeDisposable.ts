/// <reference path="../typings/atom.d.ts" />

import DisposableArray = require("./DisposableArray");

class CompositeDisposable extends DisposableArray<Disposable> implements Disposable
{
    constructor()
    {
        super((item: Disposable) => item.dispose());
    }
}

export = CompositeDisposable;
