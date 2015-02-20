/// <reference path="./DocumentRegistry.ts" />
/// <reference path="./PathUtils.ts" />
/// <reference path="./LanguageService.ts" />
/// <reference path="./TextInfoProviderFuncs.d.ts" />

declare module "typescript-core" {

}

declare module "typescript-core/DocumentRegistry" {
    import DocumentRegistry = require("DocumentRegistry");

    export = DocumentRegistry;
}

declare module "typescript-core/LanguageService" {
    import LanguageService = require("LanguageService");

    export = LanguageService;
}

declare module "typescript-core/PathUtils" {
    import PathUtils = require("PathUtils");

    export = PathUtils;
}
