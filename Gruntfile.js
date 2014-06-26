module.exports = function(grunt) {

	// Project configuration
	grunt.initConfig({

		// Retrieve package.json file for project info
		"pkg": grunt.file.readJSON("package.json"),



		/**
		 * ====================================================================
		 *
		 *               Validate javascript syntax with jshint
		 *
		 * ====================================================================
		 */
		"jshint": {
			"all": [
				"Gruntfile.js",

				// Core
				'public/core/js/*.js',

				// Libs
				'public/libs/streams/js/*.js'
			]
		},









		/**
		 * ====================================================================
		 *
		 *                 Dustjs template compilation
		 *
		 * ====================================================================
		 */
		"dust": {
			// Task compilation
			"df": {
				// Source files
				// ------------
				// Finds all the dust files in the static folder and compiles
				// them into one file in the static/build/dust folder
				"files": [{
					"expand": true,
					"cwd": "static",
					"src": ["**/*.dust"],
					"dest": "static/build/dust",
					"ext": ".dust.js",
					"flatten": true
				}],

				// Dust compilation options
				"options": {
					"wrapper": false,
					"runtime": false,
					"useBaseName": true,
					"relative": true
				}
			}
		},









		/**
		 * ====================================================================
		 *
		 *           Watch added/removed files and re-execute tasks
		 *
		 * ====================================================================
		 */
		"watch": {
			// Source files to observe
			"files": [
				"<%= jshint.all %>",
				"static/**/*.dust"
			],

			// Tasks to be run when files change
			"tasks": [
				"dust",
				"jshint"
			]

		}
	});

	// Load plugins
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-dust");

	// grunt.loadNpmTasks("grunt-devtools");

	// Declare default task
	grunt.registerTask("default", ["dust", "jshint"]);
};