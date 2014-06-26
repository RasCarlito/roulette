(function(window, $, undefined) {
	"use strict";

	// Import globals
	var _ = window._,
		DF = window.DF,
		Backbone = window.Backbone,
		Marionette = Backbone.Marionette;



	/**
	 * Broadcaster class
	 * -----------------
	 * Handles the instance of a Broadcaster by providing methods to control the flash application
	 *
	 * @author  Carl OGREN
	 * @copyright CitizenMedia
	 *
	 * @dependencies jquery, DF.vent
	 */
	DF.Libs.Broadcaster = (function() {


		/**
		 * Declare the broadcaster view
		 *
		 * @type {Layout}
		 */
		var Broadcaster_layout = Backbone.Marionette.Layout.extend({
			// Dust template definition
			"template": "df.broadcaster",

			// Declare the layout regions
			"regions": {}
		});




		/**
		 * Broadcaster constructor wrapper
		 *
		 * @this {Broadcaster}
		 * @param {object} options  Override default options
		 *
		 * @public
		 */
		var Broadcaster = function(options) {
			return new Broadcaster.fn.init(options);
		};



		// Prototype methods
		Broadcaster.fn = Broadcaster.prototype = {
			// Broadcaster states
			"default_state": {
				"loaded": false,
				"connected": false, // is the broadcaster connected?
				"authorized": false,
				"started": false,

				// Video states
				"video": {
					"active": true, // is the video active?
					"quality": 'high', // what quality is the video sampled in
					"ratio": "16:9", // The default ratio for the video
					"capture_size": 180, // The default height for the 16:9 ratio

					"changing_state": false, // @todo find if this is still useful

					// Existing predefined video qualities
					"qualities": {
						"low": {
							"quality": 40, // video quality 1-100
							"fps": 15 // framerate 15/25
						},
						"medium": {
							"quality": 70,
							"fps": 20
						},
						"high": {
							"quality": 90,
							"fps": 25
						}
					}
				},

				// Audio states
				"audio": {
					"active": true, // is the audio active?
					"quality": 'medium', // what quality is the audio sampled in

					"gain": 75, // microphone gain

					"loopback": false,

					// Existing predefined audio qualities
					"qualities": {
						"low": 3,
						"medium": 6,
						"high": 9
					}
				}
			},


			// Default broadcaster options
			"default_options": {
				// Backbone.Marionette region where the broadcaster will be injected
				"region": null,

				// Automatically connect to video server after init
				"connect": false,

				// Path to image to display when the broadcaster is not connected
				"img": '/static/images/stage/connexion.jpg',

				// Override video settings on init
				"video": {},

				// Override audio settings on init
				"audio": {},

				// Size of the broadcaster container
				"size": "small",

				// Automatically display loading message on init
				"loading": false,
			},


			/**
			 * Broadcaster constructor
			 *
			 * @param  {object} options  Override default options
			 */
			"init": function(options) {
				DF.log("[DF.Libs.Broadcaster.init] Initializing broadcaster library", DF.log.DEBUG);

				var self = this;

				// Create an event aggregator for this instance
				_.extend(this, Backbone.Events);

				// Extend options
				this.options = $.extend(true, {}, this.default_options, options);

				// Copy user and region reference
				this.region = this.options.region;

				// Control that the region param is given
				if (!this.region && !_.isObject(this.region)) {
					DF.log("[DF.Libs.Broadcaster.init] Missing 'region' parameter, cannot proceed without", DF.log.ERROR);
					return;
				}

				// Register to events
				this.register();

				// Initialize broadcaster layouts
				this.init_layouts();

				if (this.options.loading) {
					this.loading(true);
				}
			},


			/**
			 * Initialize backbone layouts
			 */
			"init_layouts": function() {
				var self = this;

				// Initialize broadcaster layout
				this.layout = new Broadcaster_layout();

				// Display the view in the given region
				this.region.show(this.layout);
			},


			/**
			 * Show/Hide a loading message in the middle of the webcam container
			 *
			 * @this {Subscriber}
			 * @param  {Boolean} is_loading True to show the message, false to hide it (false by default)
			 */
			"loading": function(is_loading) {
				// Ensure that the is_loading param is set
				is_loading = is_loading || false;

				// Show/Hide the loading message
				this.layout.$el.find(".loading")[is_loading ? "show" : "hide"]();
			},


			/**
			 * Register to events from the flash app internally
			 */
			"register": function() {
				var self = this;


			},


			/**
			 * Start camera capture.
			 * This can initialize flash app configuration and directly connect to video server after setup
			 *
			 * @param {Object} options Parameters to be sent to the flash app + callbacks for the stream point creation
			 * @return {Broadcaster} Returns itself for chained calls or false if params are missing
			 */
			"start": function(options) {
				// Define default options for starting the camera
				// Parameters can define init configuration,
				// a connect flag and success/error callbacks for the server connection
				var self = this,
					default_options = {
						"init": null,
						"connect": false,
						"host": null,
						"success": function() {},
						"error": function() {}
					};

				// Extend default options with given ones
				options = _.extend(default_options, options);

				if (options.connect) {
					// Display loading message
					this.loading(true);


				} else {
					// Mark the video state as started
					self.state.started = true;


				}

				return this;
			},


			/**
			 * Stop the camera capture.
			 * This will stop the camera/microphone capture and disconnect from server if already connected
			 *
			 * @return {Broadcaster} Returns itself for chained calls
			 */
			"stop": function() {
				// Mark the video state as not started
				this.state.started = false;



				return this;
			},


			/**
			 * Destroy the HTML markup of this broadcaster instance
			 *
			 * @this {Broadcaster}
			 * @return {this} Returns itself for chained calls
			 */
			"destroy": function() {
				this.region.close();
				return this;
			},


			/**
			 * Set the microphone gain
			 *
			 * @param {Number} gain A value between 0 and 100
			 * @return {mixed} Returns itself for chained calls or false if parameter type is wrong
			 */
			"set_gain": function(gain) {
				if (!_.isNumber(gain)) {
					DF.log("[DF.Libs.Broadcaster.set_gain] Wrong parameter type given, expected Number", DF.log.WARN);
					return false;
				}


				return this;
			},


			/**
			 * Mute the microphone
			 */
			"mute": function() {
				this.state.audio.active = false;

				return this;
			},


			/**
			 * Unmute the microphone
			 */
			"unmute": function() {
				this.state.audio.active = true;

				return this;
			}
		};

		// bind Broadcaster prototype to init function
		Broadcaster.fn.init.prototype = Broadcaster.fn;



		// Return the public interface of the library
		return Broadcaster;


	})();




})(window, jQuery);