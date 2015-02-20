/// <reference path="./ITypeScriptLanguageService.d.ts" />
/// <reference path="./ITypeScriptServicesFactory.d.ts" />
/// <reference path="../typescript-core/typescript-core.d.ts" />

import DocumentRegistry = require("typescript-core/DocumentRegistry");

class TypeScriptService implements ITypeScriptService {
    private _languageService: ITypeScriptLanguageService;

    constructor(languageService: ITypeScriptLanguageService) {
        this._languageService = languageService;
    }

    public createDocumentRegistry(): IDocumentRegistry {
        return this._languageService.createDocumentRegistry();
    }

    public createLanguageService(path: string, documentRegistry: IDocumentRegistry): ILanguageService {
        return this._languageService.createLanguageService(path, documentRegistry);
    }
}

class TypeScriptServicesFactory implements ITypeScriptServicesFactory {
    private _languageServices = { };

    public registerLanguageService(service: ITypeScriptLanguageService): void {
        this._languageServices[service.tsLanguageServiceVersion] = service;
    }

    public getTypeScriptServiceForVersion(version: string): ITypeScriptService {
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
