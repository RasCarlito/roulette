(function(window, $, undefined) {
	"use strict";

	/**
	 * Import globals
	 */
	var _ = window.underscore,
		Backbone = window.Backbone,
		Marionette = Backbone.Marionette,
		moment = window.moment;


	/**
	 * Initialize backbone marionette app as the main namespace
	 *
	 * @type {Marionette.Application}
	 */
	var DF = window.DF = new Marionette.Application();


	/**
	 * Override marionette renderer to use dust.js
	 *
	 * @param  {String} template Dust template name
	 * @param  {Object} data     Object containing the template's dynamic data
	 */
	Backbone.Marionette.Renderer.render = function(template, data) {
		var html = "";

		dust.render(template, data, function(err, out) {
			if (err) {
				console.error(err);
			} else {
				html = out;
			}
		});
		return html;
	};



	/**
	 * Log information to the console
	 *
	 * @param  {string} msg  The message to be logged
	 * @param  {mixed}  type The type of log
	 */
	DF.log = window.log = function(msg, type) {
		type = type || this.log.level;

		var level = typeof type === 'number' ? type : this.log[type.toUpperCase()];

		if (level <= this.log.level) {

			// Retrieve current date
			var type_name = this.log.levels[level - 1] || "log",
				date = new Date();

			// @todo Transcribe into moment.js code
			var date = moment();
			msg = "[" + date.format("YYYY-MM-DD HH:mm") + "] [" + type_name.toUpperCase() + "] " + msg;

			// Log message to available console
			if (window.console) {
				if (window.console[type_name]) {
					window.console[type_name].call(window.console, msg);
				} else if (window.console.log) {
					window.console.log.call(window.console, msg);
				}
			} else if (window.opera && window.opera.postError) {
				window.opera.postError(msg);
			}
		}
	};

	// Log string types
	DF.log.levels = ['error', 'warn', 'info', 'debug'];

	// Log const types
	DF.log.ERROR = 1;
	DF.log.DETAILERROR = 1;
	DF.log.WARN = 2;
	DF.log.INFO = 3;
	DF.log.LOG = 3;
	DF.log.DEBUG = 4;

	// Current log level
	DF.log.level = DF.log.DEBUG;


	/**
	 * Namespace for all the libraries
	 * @type {Object}
	 */
	DF.Libs = {};


	/**
	 * Namespace for the translations
	 * @type {Object}
	 */
	DF.Lang = {};


	/**
	 * Declare main regions
	 */
	DF.addRegions({
		"header_region": ".main.header",
		"content_region": ".main.content"
	});


	/**
	 * Wait for document ready event
	 */
	$(function() {
		DF.log("[Core] Initializing app", DF.log.DEBUG);

		DF.start();
	});
})(window, jQuery);