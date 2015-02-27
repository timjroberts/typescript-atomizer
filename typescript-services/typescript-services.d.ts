/// <reference path="./TypeScriptServices.ts" />

declare module "typescript-services" {
    import initializeTypeScriptServices = require("TypeScriptServices");

    export = initializeTypeScriptServices;
}

declare module "typescript-services/TypeScriptServicesFactory" {
    import TypeScriptService = require("TypeScriptService");

    interface TypeScriptServicesFactory {
        getTypeScriptServiceForVersion(version: string): TypeScriptService;
        
        getVersions(): string[];
    }

    export = TypeScriptServicesFactory;
}
