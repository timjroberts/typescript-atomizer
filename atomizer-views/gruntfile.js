module.exports = function(grunt)
    {
        grunt.loadNpmTasks("grunt-typescript");

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
                    }
            }
        );

        grunt.registerTask("build",   [ "typescript:build" ]);
    };
