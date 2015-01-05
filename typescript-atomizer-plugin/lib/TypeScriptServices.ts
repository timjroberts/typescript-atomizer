/// <reference path="../node_modules/typescript-atomizer-typings/TypeScriptServices.d.ts" />

/**
 * Provides utilities for accessing TypeScript services.
 */
class TypeScriptServices
{
    private static _initialized: boolean = false;

    /**
     * Loads and initializes the TypeScript services.
     */
    public static initialize(): void
    {
        if (TypeScriptServices._initialized)
            return;

        var coreTs: any = require("./TypeScript/typescriptServices");

        global.ts = coreTs.ts;
        global.TypeScript = coreTs.TypeScript;

        TypeScriptServices._initialized = true;
    }
}

export = TypeScriptServices;
