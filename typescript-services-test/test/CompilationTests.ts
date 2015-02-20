/// <reference path="../../typescript-services/typescript-services.d.ts" />
/// <reference path="../../typings/mocha/mocha.d.ts" />
/// <reference path="../../typings/node/assert.d.ts" />

import assert = require("assert");
import typescriptServices = require("typescript-services");

describe("TypeScript Compilation", () => {
    var servicesFactory: ITypeScriptServicesFactory;

    before((done: Function) => {
        typescriptServices({ }, { }, (_, obj: any) => {
            servicesFactory = obj.typescriptServicesFactory;

            done();
        });
    });

    describe("for a simple diagnostic free file", () => {
        it("produces no diagnostic errors", () => {
            servicesFactory.getVersions().forEach((version: string) => {
                var typescriptService = servicesFactory.getTypeScriptServiceForVersion(version);

                var documentRegistry = typescriptService.createDocumentRegistry();

                var languageService = typescriptService.createLanguageService("file.ts", documentRegistry);
            });
        });
    });
});
