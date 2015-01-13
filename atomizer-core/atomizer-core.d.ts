/// <reference path="./ArrayUtils.ts" />
/// <reference path="./DisposableArray.ts" />
/// <reference path="./CompositeDisposable.ts" />
/// <reference path="./ObservableFactory.ts" />

declare module "atomizer-core/ArrayUtils"
{
    import ArrayUtils = require("ArrayUtils");
    export = ArrayUtils;
}

declare module "atomizer-core/DisposableArray"
{
    import DisposableArray = require("DisposableArray");
    export = DisposableArray;
}

declare module "atomizer-core/CompositeDisposable"
{
    import CompositeDisposable = require("CompositeDisposable");
    export = CompositeDisposable;
}

declare module "atomizer-core/ObservableFactory"
{
    import ObservableFactory = require("ObservableFactory");
    export = ObservableFactory;
}
