/// <reference path="../typings/architect/architect.d.ts" />
/// <reference path="../typings/node/path.d.ts" />

import path = require("path");
import architect = require("architect");
import TypeScriptLanguageService = require("typescript-core/TypeScriptLanguageService");
import TypeScriptServicesFactory = require("./TypeScriptServicesFactory");

function initializeTypeScriptServices(options: any, imports: any, register: architect.RegisterFunction) {
    var config = architect.loadConfig(path.join(__dirname, "TypeScriptServicesConfig.js"));

    var servicesFactory = new TypeScriptServicesFactory();

    var app = architect.createApp(config);

    app.on("service", (name: string, languageService: TypeScriptLanguageService) => {
            servicesFactory.registerLanguageService(languageService);
        });

    app.on("ready", () => {
            register(null, {
                    typescriptServicesFactory: servicesFactory
                });
        });
}

export = initializeTypeScriptServices;
