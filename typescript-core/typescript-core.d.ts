/// <reference path="./DocumentRegistry.ts" />
/// <reference path="./CompilerOptions.ts" />
/// <reference path="./PathUtils.ts" />
/// <reference path="./LanguageService.ts" />
/// <reference path="./TextInfoProviderFuncs.d.ts" />

declare module "typescript-core/CompilerOptions" {
    import CompilerOptions = require("CompilerOptions");
    export = CompilerOptions;
}

declare module "typescript-core/DocumentRegistry" {
    import DocumentRegistry = require("DocumentRegistry");
    export = DocumentRegistry;
}

declare module "typescript-core/Diagnostic" {
    import Diagnostic = require("Diagnostic");
    export = Diagnostic;
}

declare module "typescript-core/DiagnosticType" {
    import DiagnosticType = require("DiagnosticType");
    export = DiagnosticType;
}

declare module "typescript-core/DiagnosticCategory" {
    import DiagnosticCategory = require("DiagnosticCategory");
    export = DiagnosticCategory;
}

declare module "typescript-core/LanguageService" {
    import LanguageService = require("LanguageService");
    export = LanguageService;
}

declare module "typescript-core/TypeScriptLanguageService" {
    import DocumentRegistry = require("DocumentRegistry");
    import LanguageService = require("LanguageService");

    interface TypeScriptLanguageService {
        tsLanguageServiceVersion: string;

        createDocumentRegistry(): DocumentRegistry;
        createLanguageService(path: string, documentRegistry: DocumentRegistry): LanguageService;

    }

    export = TypeScriptLanguageService;
}

declare module "typescript-core/PathUtils" {
    import PathUtils = require("PathUtils");
    export = PathUtils;
}
