/// <reference path="../typescript-core/typescript-core.d.ts" />

import LanguageService = require("typescript-core/LanguageService");
import DocumentRegistry = require("typescript-core/DocumentRegistry");
import TypeScriptLanguageService = require("typescript-core/TypeScriptLanguageService");

/**
 * Encapsulates a TypeScript service.
 */
class TypeScriptService {
    private _languageService: TypeScriptLanguageService;

    /**
     * Initializes a new TypeScriptService instance.
     *
     * @param languageService The underlying TypeScript Language Service that will be adapted.
     */
    constructor(languageService: TypeScriptLanguageService) {
        this._languageService = languageService;
    }

    /**
     * Creates a Document Registry.
     *
     * Document registries returned from this function may be shared between many TypeScript Language
     * Services.
     *
     * @returns A DocumentRegistry object.
     */
    public createDocumentRegistry(): DocumentRegistry {
        return this._languageService.createDocumentRegistry();
    }

    /**
     * Creates a Language Service for a given TypeScript document path.
     *
     * @param path The path to the TypeScript document file.
     * @param documentRegistry The DocumentRegistry that can be queried for documents.
     */
    public createLanguageService(path: string, documentRegistry: DocumentRegistry): LanguageService {
        return this._languageService.createLanguageService(path, documentRegistry);
    }
}

export = TypeScriptService;
