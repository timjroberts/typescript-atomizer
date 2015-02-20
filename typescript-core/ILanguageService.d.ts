declare enum DiagnosticCategory
{
    Warning,
    Error,
    Message,
}

interface Diagnostic {
    //file: SourceFile;
    start: number;
    length: number;
    messageText: string;
    category: DiagnosticCategory;
    code: number;
}

interface ILanguageService {
    getSyntacticDiagnostics(): Diagnostic[];
}
