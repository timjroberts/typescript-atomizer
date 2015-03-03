/**
 * Indicates the type of module definition to compile into.
 */
export enum ModuleKind {
    /**
     * No module definition.
     */
    None,

    /**
     * The CommonJS Module Definition.
     */
    CommonJS,

    /**
     * The Asynchronous Module Definition.
     */
    AMD,
}

/**
 * Indicates a TypeScript target.
 */
export enum ScriptTarget {
    ES3,
    ES5,
    ES6
}

/**
 * Represents the canonical set of TypeScript compilation options.
 */
export interface Options {
    noLib: boolean;
    noResolve: boolean;
    module?: ModuleKind;
    noImplicitAny?: boolean;
    target?: ScriptTarget;

    [option: string]: any;
}
