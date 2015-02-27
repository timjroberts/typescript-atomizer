
import DiagnosticType = require("./DiagnosticType");
import DiagnosticCategory = require("./DiagnosticCategory");

class Diagnostic {
    path: string;
    start: number;
    length: number;
    messageText: string;
    category: DiagnosticCategory;
    diagnosticType: DiagnosticType;
    code: number;
}

export = Diagnostic;
