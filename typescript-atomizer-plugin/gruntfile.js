var package = require("./package.json");

function getAtomRootPackagesPath() {
    if (process.platform === "win32") {
        return process.env["userprofile"] + "/.atom/packages/" + package.name + "/";
    }

    throw new Error("Unsupported platform...");
}

module.exports = function(grunt)
    {
        grunt.loadNpmTasks("grunt-typescript");
        grunt.loadNpmTasks("grunt-contrib-copy");
        grunt.loadNpmTasks("grunt-jasmine-node");

        grunt.initConfig(
            {
                typescriptFiles:
                    [
                        "**/*.ts",
                        "!node_modules/**/*",
                        "!typings/**/*",
                        "!*.d.ts"
                    ],

                pluginPackageFiles:
                    [
                        "grammars/*",
                        "stylesheets/*",
                        "lib/**/*.js",
                        "lib/TypeScript/**",
                        "lib/Bootstrap/**",
                        "spec/**/*.js",
                        "package.json"
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

                jasmine_node:
                    {
                        specs: [ "spec/" ]
                    },

                copy:
                    {
                        pluginOutput:
                            {
                                src: "<%=pluginPackageFiles %>",
                                dest: getAtomRootPackagesPath()
                            }
                    }
            }
        );

        grunt.registerTask("build",  [ "typescript:build" ]);
        grunt.registerTask("test",   [ "jasmine_node" ]);
        grunt.registerTask("deploy", [ "copy" ]);

    };
