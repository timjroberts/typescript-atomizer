/// <reference path="../typescript-core/typescript-core.d.ts" />

import LanguageService = require("typescript-core/LanguageService");
import DocumentRegistry = require("typescript-core/DocumentRegistry");
import TypeScriptLanguageService = require("typescript-core/TypeScriptLanguageService");
import TypeScriptService = require("./TypeScriptService");

/**
 * A factory for retrieving TypeScript services for a given version.
 */
class TypeScriptServicesFactory {
    private _languageServices = { };

    /**
     * Registers an underlying TypeScript language service that has been exported from
     * a TypeScript language service plugin.
     *
     * @param service The TypeScript language service to register.
     */
    public registerLanguageService(service: TypeScriptLanguageService): void {
        this._languageServices[service.tsLanguageServiceVersion] = service;
    }

    /**
     * Retrieves a TypeScript service for a given version.
     *
     * @param version The string representation of a TypeScript version (i.e., '1.3.0').
     * @returns A TypeScript service that encapsulates the services for a particular version of TypeScript.
     */
    public getTypeScriptServiceForVersion(version: string): TypeScriptService {
        var languageService = this._languageServices[version];

        if (!languageService)
            throw new Error("TypeScript version " + version + " is not available.");

        return new TypeScriptService(languageService);
    }

    /**
     * Retrives an array representing all the versions of TypeScript services that are available.
     *
     * @returns An array of string version numbers representing the TypeScript services that are available.
     */
    public getVersions(): string[] {
        return Object.keys(this._languageServices);
    }
}

export = TypeScriptServicesFactory;
