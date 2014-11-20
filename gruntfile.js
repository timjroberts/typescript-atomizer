module.exports = function(grunt)
    {
        grunt.loadNpmTasks("grunt-run-grunt");

        grunt.initConfig(
            {
                gruntFiles:
                    [
                        "./**/gruntfile.js",
                        "!./gruntfile.js",
                        "!./**/node_modules/**/gruntfile.js"
                    ],

                deployableGruntFiles:
                    [ "./typescript-atomizer-plugin/gruntfile.js" ],

                run_grunt:
                    {
                        options:
                            {
                                process: function(res)
                                    {
                                        if (res.fail) {
                                            grunt.log.writeln("Error in " + res.src);
                                            grunt.log.writeln(res.res.stdout);
                                            grunt.log.writeln(res.res.stderr);
                                        }
                                    }
                            },

                        build:
                            {
                                src: "<%=gruntFiles %>",
                                options: { task: "build" }
                            },

                        test:
                            {
                                src: "<%=gruntFiles %>",
                                options: { task: "test" }
                            },

                        deploy:
                            {
                                src: "<%=deployableGruntFiles %>",
                                options: { task: "deploy" }
                            }
                    }
            }
        );

        grunt.registerTask("build",  [ "run_grunt:build" ]);
        grunt.registerTask("test",   [ "run_grunt:test" ]);
        grunt.registerTask("deploy", [ "run_grunt:deploy" ]);
    };
