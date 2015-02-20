/// <reference path="./TypeScriptServices.ts" />
/// <reference path="./ITypeScriptServicesFactory.d.ts" />

declare module "typescript-services" {
    import initializeTypeScriptServices = require("TypeScriptServices");

    export = initializeTypeScriptServices;
}
