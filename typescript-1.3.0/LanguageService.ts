/// <reference path="./typescript-1-3-0.d.ts" />
/// <reference path="../typescript-core/typescript-core.d.ts" />

import BaseLanguageService = require("typescript-core/LanguageService");

class LanguageService extends BaseLanguageService {
    private _underlyingLanguageService: ts.LanguageService;

    constructor(path: string, underlyingLanguageService: ts.LanguageService) {
        super(path);

        this._underlyingLanguageService = underlyingLanguageService;
    }

    protected getSyntacticDiagnosticsForFile(path: string): Diagnostic[] {
        //return this._underlyingLanguageService.getSyntacticDiagnostics(path).map((d: ts.Diagnostic) => <Diagnostic>d);

        return [ ];
    }
}

export = LanguageService;
