/// <reference path="../../typescript-services/typescript-services.d.ts" />
/// <reference path="../../typings/mocha/mocha.d.ts" />
/// <reference path="../../typings/node/assert.d.ts" />
/// <reference path="../../typings/node/path.d.ts" />

import assert = require("assert");
import typescriptServices = require("typescript-services");
import TypeScriptServicesFactory = require("typescript-services/TypeScriptServicesFactory");

describe("TypeScript Compilation", () => {
    var servicesFactory: TypeScriptServicesFactory;

    before((done: Function) => {
        typescriptServices({ }, { }, (_, obj: any) => {
            servicesFactory = obj.typescriptServicesFactory;

            done();
        });
    });

    describe("for 1.4 feature", () => {
        it("should only compile against 1.4", () => {
            var typescriptService_1_3 = servicesFactory.getTypeScriptServiceForVersion("1.3.0");
            var typescriptService_1_4 = servicesFactory.getTypeScriptServiceForVersion("1.4.0");

            var langService_1_3 = typescriptService_1_3.createLanguageService(__dirname + "/test-files/1-4-0-simple-no-errors.ts", typescriptService_1_3.createDocumentRegistry());
            var langService_1_4 = typescriptService_1_4.createLanguageService(__dirname + "/test-files/1-4-0-simple-no-errors.ts", typescriptService_1_4.createDocumentRegistry());

            var diagnostics = langService_1_3.getDiagnostics()

            assert.ok(diagnostics);
            assert.ok(Array.isArray(diagnostics));
            assert.ok(diagnostics.length > 0);

            diagnostics = langService_1_4.getDiagnostics()

            assert.ok(diagnostics);
            assert.ok(Array.isArray(diagnostics));
            assert.ok(diagnostics.length === 0);
        });
    });
});
