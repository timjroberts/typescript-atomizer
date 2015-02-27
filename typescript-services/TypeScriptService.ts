/// <reference path="../typescript-core/typescript-core.d.ts" />

import LanguageService = require("typescript-core/LanguageService");
import DocumentRegistry = require("typescript-core/DocumentRegistry");
import TypeScriptLanguageService = require("typescript-core/TypeScriptLanguageService");

class TypeScriptService {
    private _languageService: TypeScriptLanguageService;

    constructor(languageService: TypeScriptLanguageService) {
        this._languageService = languageService;
    }

    public createDocumentRegistry(): DocumentRegistry {
        return this._languageService.createDocumentRegistry();
    }

    public createLanguageService(path: string, documentRegistry: DocumentRegistry): LanguageService {
        return this._languageService.createLanguageService(path, documentRegistry);
    }
}

export = TypeScriptService;
