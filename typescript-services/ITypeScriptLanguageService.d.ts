/// <reference path="../typescript-core/typescript-core.d.ts" />

/**
 * Represents a version of the TypeScript language services that has been exported
 * via an 'architect' plugin.
 */
interface ITypeScriptLanguageService {
    /**
     * Gets the TypeScript version string.
     */
    tsLanguageServiceVersion: string;

    /**
     * Gets the exported 'ts' module.
     */
    ts: any;

    /**
     * Gets the exported 'TypeScript' module that provides utility methods.
     */
    TypeScript: any;

    createDocumentRegistry: () => IDocumentRegistry;

    createLanguageService: (path: string, documentRegistry: IDocumentRegistry) => ILanguageService;
}
