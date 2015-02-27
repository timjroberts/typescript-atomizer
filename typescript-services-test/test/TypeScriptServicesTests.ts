/// <reference path="../../typescript-services/typescript-services.d.ts" />
/// <reference path="../../typings/mocha/mocha.d.ts" />
/// <reference path="../../typings/node/assert.d.ts" />

import assert = require("assert");
import typescriptServices = require("typescript-services");
import TypeScriptServicesFactory = require("typescript-services/TypeScriptServicesFactory");

describe("TypeScriptServices", () => {
    describe("can load configured language service versions", () => {
        it("should load version 1.3", (done: Function) => {
            typescriptServices({ }, { }, (_, obj: any) => {
                assert.ok(obj);
                assert.ok(obj.typescriptServicesFactory);

                var factory: TypeScriptServicesFactory = obj.typescriptServicesFactory;

                var tsV130 = factory.getTypeScriptServiceForVersion("1.3.0");

                assert.ok(tsV130);

                done();
            });
        });

        it("should load version 1.4", (done: Function) => {
            typescriptServices({ }, { }, (_, obj: any) => {
                assert.ok(obj);
                assert.ok(obj.typescriptServicesFactory);

                var factory: TypeScriptServicesFactory = obj.typescriptServicesFactory;

                var tsV130 = factory.getTypeScriptServiceForVersion("1.4.0");

                assert.ok(tsV130);

                done();
            });
        });
    });
});
