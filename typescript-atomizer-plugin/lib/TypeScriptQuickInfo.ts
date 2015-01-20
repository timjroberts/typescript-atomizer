/// <reference path="../../typings/atom.d.ts" />
/// <reference path="../../typings/TypeScriptServices.d.ts" />

/**
 * A class that associates a TypeScript quick-info object and a buffer position.
 */
class TypeScriptQuickInfo
{
    private _info: ts.QuickInfo;
    private _bufferPosition: Point;

    /**
     * Initializes a new TypeScriptQuickInfo object.
     *
     * @param info The TypeScript quick-info object.
     * @param bufferPosition The buffer position that the associated quick-info object is
     * associated with.
     */
    constructor(info: ts.QuickInfo, bufferPosition: Point)
    {
        this._info = info;
        this._bufferPosition = bufferPosition;
    }

    /**
     * Gets the TypeScript quick-info object.
     */
    public get info(): ts.QuickInfo { return this._info; }

    /**
     * Gets the buffer position.
     */
    public get bufferPosition(): Point { return this._bufferPosition; }
}

export = TypeScriptQuickInfo;
