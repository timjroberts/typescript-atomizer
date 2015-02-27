export enum ModuleKind {
    None,
    CommonJS,
    AMD,
}

export enum ScriptTarget {
    ES3,
    ES5,
}

export interface Options {
    noLib: boolean;
    noResolve: boolean;
    module?: ModuleKind;
    noImplicitAny?: boolean;
    target?: ScriptTarget;

    [option: string]: any;
}
