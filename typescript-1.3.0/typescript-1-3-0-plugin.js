var DocumentRegistry = require('./DocumentRegistry');
var LanguageServiceHost = require('./LanguageServiceHost');
var LanguageService = require('./LanguageService');
var typescriptServices = require('./typescriptServices');

module.exports = function setup(options, imports, register) {
    register(null, {
        typescript_1_3_0: {
            tsLanguageServiceVersion: "1.3.0",
            createDocumentRegistry: function() {
                return new DocumentRegistry();
            },
            createLanguageService: function(path, documentRegistry) {
                return new LanguageService(path, typescriptServices.ts.createLanguageService(new LanguageServiceHost(path, documentRegistry), documentRegistry));
            }
          }
      });
};
