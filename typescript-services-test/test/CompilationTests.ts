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

    describe("for a non-existent file", () => {
        it("should throw a file not found error", () => {
            servicesFactory.getVersions().forEach((version: string) => {
                var typescriptService = servicesFactory.getTypeScriptServiceForVersion(version);

                assert.throws(() => {
                        typescriptService.createLanguageService("doesnotexist.ts", typescriptService.createDocumentRegistry());
                    }, /no such file or directory.*doesnotexist\.ts/);
            });
        });
    });

    describe("for diagnostic free files", () => {
        describe("containing no external references", () => {
            it("should generate no diagnostic errors", () => {
                servicesFactory.getVersions().forEach((version: string) => {
                    var typescriptService = servicesFactory.getTypeScriptServiceForVersion(version);

                    var languageService = typescriptService.createLanguageService(__dirname + "/test-files/simple-noerrors.ts", typescriptService.createDocumentRegistry());
                    var diagnostics = languageService.getDiagnostics();

                    assert.ok(diagnostics);
                    assert.ok(Array.isArray(diagnostics));
                    assert.ok(diagnostics.length === 0);
                });
            });
        });

        describe("containing a reference declaration", () => {
            it("should generate no diagnostic errors", () => {
                servicesFactory.getVersions().forEach((version: string) => {
                    var typescriptService = servicesFactory.getTypeScriptServiceForVersion(version);

                    var languageService = typescriptService.createLanguageService(__dirname + "/test-files/simple-withref-noerrors.ts", typescriptService.createDocumentRegistry());
                    var diagnostics = languageService.getDiagnostics();

                    assert.ok(diagnostics);
                    assert.ok(Array.isArray(diagnostics));
                    assert.ok(diagnostics.length === 0);
                });
            });
        });
    });
});
