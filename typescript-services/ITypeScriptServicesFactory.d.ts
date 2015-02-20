/// <reference path="../typescript-core/typescript-core.d.ts" />

interface ITypeScriptService {
    createDocumentRegistry(): IDocumentRegistry;

    createLanguageService(path: string, documentRegistry: IDocumentRegistry): ILanguageService;
}

interface ITypeScriptServicesFactory {
    getTypeScriptServiceForVersion(version: string): ITypeScriptService;

    getVersions(): string[];
}
