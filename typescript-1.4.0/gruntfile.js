module.exports = function(grunt)
    {
        grunt.loadNpmTasks("grunt-typescript");
        grunt.loadNpmTasks("grunt-string-replace");

        grunt.initConfig(
            {
                typescriptFiles:
                    [
                        "**/*.ts",
                        "!node_modules/**/*",
                        "!typings/**/*",
                        "!*.d.ts"
                    ],

                typescript:
                    {
                        build:
                            {
                                src: "<%=typescriptFiles %>",
                                options:
                                    {
                                        module: "commonjs",
                                        target: "ES5",
                                        sourceMap: true
                                    }
                            }
                    },

                "string-replace":
                    {
                        rewriteTsImports:
                            {
                                files: {
                                    "./": ["./*.js", "!./gruntfile.js", "!./typescriptServices.js"]
                                },
                                options: {
                                    replacements: [
                                        {
                                            pattern: 'require("ts")',
                                            replacement: 'require("./typescriptServices").ts'
                                        },
                                        {
                                            pattern: 'require("TypeScript")',
                                            replacement: 'require("./typescriptServices").TypeScript'
                                        }
                                    ]
                                }
                            }
                    }
            }
        );

        grunt.registerTask("build", [ "typescript:build", "string-replace" ]);
    };
