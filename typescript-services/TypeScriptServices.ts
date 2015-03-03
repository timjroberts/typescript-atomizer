/// <reference path="../typings/architect/architect.d.ts" />
/// <reference path="../typings/node/path.d.ts" />

import path = require("path");
import architect = require("architect");
import TypeScriptLanguageService = require("typescript-core/TypeScriptLanguageService");
import TypeScriptServicesFactory = require("./TypeScriptServicesFactory");

/**
 * The 'Architect' entry point that registers the TypeScript Services Factory as an
 * available service.
 *
 * @param options A hash of the configuration options.
 * @param imports A hash of the required 'services' required by the TypeScript Services plugin.
 * @param register The callback to invoke in order to register the TypeScript Services Factory.
 */
function initializeTypeScriptServices(options: any, imports: any, register: architect.RegisterCallbackFunction) {
    var config = architect.loadConfig(path.join(__dirname, "TypeScriptServicesConfig"));

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
