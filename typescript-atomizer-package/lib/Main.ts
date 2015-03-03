/// <reference path="../../typings/architect/architect.d.ts" />
/// <reference path="../../typings/atom/atom.d.ts" />
/// <reference path="../../typings/node/path.d.ts" />

import path = require("path");
import architect = require("architect");

export var config: any = {
        defaultTypeScriptLanguageVersion: {
            title: "Default TypeScript Language Version",
            description: "The default TypeScript language version to apply if no 'tsconfig.json' file can be resolved.",
            type: "string",
            default: "1.4.0"
        }
    }

export function activate(): void {
    var config = architect.loadConfig(path.join(__dirname, "PackageCompositionConfig"));

    var app = architect.createApp(config);

    app.on("ready", () => {

        });
}

export function deactivate(): void {

}
