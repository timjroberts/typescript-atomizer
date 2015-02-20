/// <reference path="./ILanguageService.d.ts" />

class LanguageService implements ILanguageService {
    private _path: string;

    constructor(path: string) {
        this._path = path;
    }

    public getSyntacticDiagnostics(): Diagnostic[] {
        return this.getSyntacticDiagnosticsForFile(this._path);
    }

    protected getSyntacticDiagnosticsForFile(path: string): Diagnostic[] {
        return [ ];
    }
}

export = LanguageService;
