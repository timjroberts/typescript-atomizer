import ArrayUtils = require("./ArrayUtils");

class DisposableArray<T>
{
    private _items: Array<T>;
    private _disposeOperation: (item: T) => void;
    private _isDisposed: boolean;

    constructor(disposeOperation: (item: T) => void)
    {
        this._disposeOperation = disposeOperation;
        this.reset();
    }

    public push(item: T)
    {
        if (this._isDisposed)
            throw new Error("The DisposableArray has been disposed.");

        this._items.push(item);
    }

    public clear(): void
    {
        if (!this._isDisposed)
            this.dispose();

        this.reset();
    }

    public findIndex(predicate: (element: T, index?: number, array?: Array<T>) => void): number
    {
        return ArrayUtils.findIndex<T>(this._items, predicate);
    }

    public dispose(): void
    {
        this._items.forEach((item: T) =>
        {
            try
            {
                this._disposeOperation(item);
            }
            catch (e)
            { }
        });

        this._isDisposed = true;
    }

    private reset(): void
    {
        this._items = new Array<T>();
        this._isDisposed = false;
    }
}

export = DisposableArray;
