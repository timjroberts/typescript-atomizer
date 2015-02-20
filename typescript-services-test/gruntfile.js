module.exports = function(grunt)
    {
        grunt.loadNpmTasks("grunt-typescript");
        grunt.loadNpmTasks("grunt-mocha-cli");

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

                mochacli:
                    {
                        options: { files: "test/**/*.js" },
                        spec: {
                            options: { reporter: "spec" }
                        }
                    }
            }
        );

        grunt.registerTask("build",   [ "typescript:build" ]);
        grunt.registerTask("test",    [ "mochacli:spec" ]);
    };
