var DocumentRegistry = require('./DocumentRegistry');
var LanguageServiceHost = require('./LanguageServiceHost');
var LanguageService = require('./LanguageService');
var typescriptServices = require('./typescriptServices');

module.exports = function setup(options, imports, register) {
    register(null, {
        typescript_1_4_0: {
            tsLanguageServiceVersion: "1.4.0",
            ts: typescriptServices.ts,
            TypeScript: typescriptServices.TypeScript,
            createDocumentRegistry: function() {
                return new DocumentRegistry();
            },
            createLanguageService: function(path, documentRegistry) {
                return new LanguageService(path, typescriptServices.ts.createLanguageService(new LanguageServiceHost(path, documentRegistry), documentRegistry));
            }
          }
      });
};
