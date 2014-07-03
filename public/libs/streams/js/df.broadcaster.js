/** @namespace */
(function(window, $, undefined) {
	"use strict";

	// Import globals
	var _ = window._,
		DF = window.DF,
		Backbone = window.Backbone,
		Marionette = Backbone.Marionette,
		URL = window.URL;


	// Cross browser getUserMedia
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

	var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
	var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;


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
		var Broadcaster_layout = Marionette.LayoutView.extend({
			// Dust template definition
			"template": "df.streams.broadcaster",

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
		 * @constructor
		 */
		var Broadcaster = function(options) {
			return new Broadcaster.fn.init(options);
		};



		// Prototype methods
		Broadcaster.fn = Broadcaster.prototype = {

			// Default broadcaster options
			"default_options": {
				// Backbone.Marionette region where the broadcaster will be injected
				"region": null
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

				// Initialize broadcaster layouts
				this.init_layouts();
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

				this.video = this.layout.$el.find("video")[0];
			},



			/**
			 * Start camera capture.
			 * This can initialize flash app configuration and directly connect to video server after setup
			 *
			 * @param {Object} options Parameters to be sent to the flash app + callbacks for the stream point creation
			 * @return {Broadcaster} Returns itself for chained calls or false if params are missing
			 */
			"start": function(options) {
				DF.log("[DF.Libs.Broadcaster.start] Starting capture", DF.log.DEBUG);

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

				navigator.getUserMedia({
					audio: true,
					video: true
				}, function(stream) {
					DF.log("[DF.Libs.Broadcaster.start] Received stream object", DF.log.DEBUG);

					self.stream = stream;
					self.video.src = URL.createObjectURL(stream);

					var pc = new PeerConnection({
						'iceServers': [{
							'url': 'stun:stun.l.google.com:19302'
						}]
					}),
						error = function() {
							console.log("PC error");
							pc.close();
						};

					pc.onicecandidate = function(candidate) {
						console.log("ice candidate: ", candidate);
					};

					pc.addStream(stream);

					pc.createOffer(function(offer) {
						pc.setLocalDescription(new SessionDescription(offer), function() {
							console.log("Ready to emit connection offer: ", offer);

							DF.vent.emit("dispatch", offer);
						}, error);
					}, error);

					/*video.onloadedmetadata = function() {
						DF.log("[DF.Libs.Broadcaster.start] Loaded meta data for local stream feed", DF.log.DEBUG);
					};*/
				}, options.error);

				return this;
			},


			/**
			 * Stop the camera capture.
			 * This will stop the camera/microphone capture and disconnect from server if already connected
			 *
			 * @return {Broadcaster} Returns itself for chained calls
			 */
			"stop": function() {

				$("video").attr("src", "");
				this.stream.stop();

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
			}
		};

		// bind Broadcaster prototype to init function
		Broadcaster.fn.init.prototype = Broadcaster.fn;



		// Return the public interface of the library
		return Broadcaster;


	})();




})(window, jQuery);