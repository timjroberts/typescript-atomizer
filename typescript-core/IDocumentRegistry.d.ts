declare enum ModuleKind {
    None,
    CommonJS,
    AMD,
}

declare enum ScriptTarget {
    ES3,
    ES5,
}

interface CompilerOptions {
    noLib: boolean;
    noResolve: boolean;
    module?: ModuleKind;
    noImplicitAny?: boolean;
    target?: ScriptTarget;

    [option: string]: any;
}

interface IDocumentRegistry {

}
