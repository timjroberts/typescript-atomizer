/// <reference path="../typescript-core/typescript-core.d.ts" />

import LanguageService = require("typescript-core/LanguageService");
import DocumentRegistry = require("typescript-core/DocumentRegistry");
import TypeScriptLanguageService = require("typescript-core/TypeScriptLanguageService");
import TypeScriptService = require("./TypeScriptService");

class TypeScriptServicesFactory {
    private _languageServices = { };

    public registerLanguageService(service: TypeScriptLanguageService): void {
        this._languageServices[service.tsLanguageServiceVersion] = service;
    }

    public getTypeScriptServiceForVersion(version: string): TypeScriptService {
        var languageService = this._languageServices[version];

        if (!languageService)
            throw new Error("TypeScript version " + version + " is not available.");

        return new TypeScriptService(languageService);
    }

    public getVersions(): string[] {
        return Object.keys(this._languageServices);
    }
}

export = TypeScriptServicesFactory;
