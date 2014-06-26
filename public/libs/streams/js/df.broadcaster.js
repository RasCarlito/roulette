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
			"regions": {
				"info_region": ".info",
				"profile_region": ".profile"
			}
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

				/**
				 * Triggered when the flash app is ready to receive more commands
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("completed", function(evt) {
					// Mark the broadcaster as loaded
					self.state.loaded = true;

					// Control swf version
					if (!evt.version || self.swf_version !== evt.version) {
						DF.log("[DF.Libs.Broadcaster.on:completed] The broadcaster flash app version is not " +
							"compatible with this library. Needs to be v" + self.swf_version, DF.log.ERROR);
						return;
					}

					// Store the actual version of the flash app
					self.version = evt.version;

					DF.log("[DF.Libs.Broadcaster.on:completed] Broadcaster loaded successfully", DF.log.DEBUG);

					// Create init data array
					var init_data = [],
						// Retrieve video quality infos
						webcam_quality = self.state.video.qualities[self.state.video.quality || 'high'],
						// Retrieve audio quality infos
						audio_quality = self.state.audio.qualities[self.state.audio.quality || 'high'];

					// Add video quality init
					init_data.push({
						"quality": {
							"type": "video",
							"value": webcam_quality.quality
						}
					});

					// Add audio quality init
					init_data.push({
						"quality": {
							"type": "audio",
							"value": audio_quality
						}
					});

					// Add fps init
					init_data.push({
						"fps": {
							"value": webcam_quality.fps
						}
					});

					// Add ratio init
					init_data.push({
						"ratio": {
							"value": self.state.video.ratio
						}
					});

					// Add capture size init
					init_data.push({
						"capture_size": {
							"value": self.state.video.capture_size
						}
					});

					// Add gain init
					init_data.push({
						"gain": {
							"value": self.state.audio.gain
						}
					});

					// Add video status init
					init_data.push({
						"video_active": {
							"value": self.state.video.active
						}
					});

					// Add image display
					init_data.push({
						"image": {
							"value": self.options.img,
							"display": true
						}
					});

					// Send command to flash app
					_.defer(function() {
						self.send("init", init_data);
					});
				});


				/**
				 * Triggered when broadcaster finished executing the init process
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("init", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:init] Broadcaster initialized successfully.", DF.log.DEBUG);

						// Notify other modules
						DF.vent.trigger('broadcaster:completed', {
							"id": self.options.id,
							"version": self.version
						});

						// Automatically try to connect if broadcaster options say so
						if (self.options.connect) {
							self.start({
								"connect": true
							});
						}
					} else {
						DF.log("[DF.Libs.Broadcaster.on:init] Initialization of the broadcaster failed. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);
					}
				});


				/**
				 * Triggered when the broadcaster start command finished its execution
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("start", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:start] Started broadcaster successfully. Camera/Microphone access is currently " +
							(evt.authorized ? "authorized" : "refused"), DF.log.DEBUG);

						// Enable loopback
						if (self.state.audio.loopback) {
							self.set_loopback(true);
						}

						// Store video state received from flash
						self.state.video.active = evt.video_active;

						// Display image if video is deactivated else hide
						if (self.state.video.active) {
							self.hide_image(self.options.img);
						} else {
							self.set_image(self.options.img, true);
						}

						// Notify other moduless
						DF.vent.trigger("broadcaster:started", {
							"id": self.options.id,
							"authorized": evt.authorized,
							"video_active": self.state.video.active
						});
					} else {
						DF.log("[DF.Libs.Broadcaster.on:start] Could not start broadcaster. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);

						DF.vent.trigger("broadcaster:failed", {
							"id": self.options.id,
							"error": evt.error,
							"message": self.get_error(evt.error)
						});
					}
				});


				/**
				 * Triggered when the broadcaster was successfully stoped
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("stop", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:stop] Stopped broadcaster successfully.", DF.log.DEBUG);

						// Mark the broadcaster as disconnected
						self.state.connected = false;

						// Display image
						self.set_image(self.options.img, true);

						// Notify other modules
						DF.vent.trigger("broadcaster:disconnected", {
							"id": self.options.id
						});
					} else {
						DF.log("[DF.Libs.Broadcaster.on:stop] Could not stop broadcaster. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);
					}
				});


				/**
				 * Triggered when the camera/microphone was authorized or refused
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("authorize", function(evt) {
					DF.log("[DF.Libs.Broadcater.on:authorize] Broadcaster camera/microphone access has been " + (evt.ok ? "authorized" : "refused"));

					// Store the authorization status
					self.state.authorized = evt.ok;

					// Notify other modules
					DF.vent.trigger("broadcaster:authorize", {
						"id": self.options.id,
						"ok": evt.ok
					});
				});


				/**
				 * Triggered when broadcaster connected to the video server successfully
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("connect", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:connect] Connected broadcaster to video server successfully.", DF.log.DEBUG);

						// Mark the broadcaster as connected
						self.state.connected = true;

						// Notify other modules
						DF.vent.trigger("broadcaster:connected", {
							"id": self.options.id
						});
					} else {
						DF.log("[DF.Libs.Broadcaster.on:connect] Could not connect to video server. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);
					}
				});


				/**
				 * Triggered when the camera capture fps has been modified
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("set_fps", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:set_fps] Modified the video capture framerate successfully.", DF.log.DEBUG);

						// Notify other modules
						DF.vent.trigger("broadcaster:fps", {
							"id": self.options.id
						});
					} else {
						DF.log("[DF.Libs.Broadcaster.on:set_fps] Could not modify camera capture fps. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);
					}
				});


				/**
				 * Triggered when camera capture ratio has been modified
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("set_ratio", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:set_ratio] Modified the video capture ratio successfully.", DF.log.DEBUG);

						// Apply ratio to container
						self.set_container_ratio(evt.value);

						// Notify other modules
						DF.vent.trigger("broadcaster:ratio", {
							"id": self.options.id
						});
					} else {
						DF.log("[DF.Libs.Broadcaster.on:set_ratio] Could not modify camera capture ratio. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);
					}
				});


				/**
				 * Triggered when the key frame interval has been modified
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("set_key_frame_interval", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:set_key_frame_interval] Modified the video key frame interval successfully.", DF.log.DEBUG);

						// Notify other modules
						DF.vent.trigger("broadcaster:key_frame_interval", {
							"id": self.options.id
						});
					} else {
						DF.log("[DF.Libs.Broadcaster.on:set_key_frame_interval] Could not modify camera key frame interval. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);
					}
				});


				/**
				 * Triggered when the video/audio quality has been modified
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("set_quality", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:set_quality] Modified the " + evt.type + " capture quality successfully.", DF.log.DEBUG);

						// Notify other modules
						DF.vent.trigger("broadcaster:quality", {
							"id": self.options.id,
							"type": evt.type
						});
					} else {
						DF.log("[DF.Libs.Broadcaster.on:set_quality] Could not modify " +
							(evt.type == "video" ? "video" : "audio") + " capture quality. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);
					}
				});


				/**
				 * Triggered when the camera capture size has been modified
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("set_capture_size", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:set_capture_size] Modified the video capture size successfully.", DF.log.DEBUG);

						// Notify other modules
						DF.vent.trigger("broadcaster:capture_size", {
							"id": self.options.id
						});
					} else {
						DF.log("[DF.Libs.Broadcaster.on:set_capture_size] Could not modify camera capture size. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);
					}
				});


				/**
				 * Triggered when the camera status has been modified
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("set_video_active", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:set_video_active] Modified the video status", DF.log.DEBUG);

						// Store applied value
						self.state.video.active = evt.value;

						// Display image if video is deactivated else hide
						if (self.state.video.active) {
							self.set_image(self.options.img, true);
						} else {
							self.hide_image(self.options.img);
						}

						// Notify other modules
						DF.vent.trigger("broadcaster:video_active", {
							"id": self.options.id
						});
					} else {
						DF.log("[DF.Libs.Broadcaster.on:set_video_active] Could not modify camera status. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);
					}
				});


				/**
				 * Triggered when the audio gain has been modified
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("set_gain", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:set_gain] Modified the audio gain to " + evt.value + " successfully.", DF.log.DEBUG);

						// Notify other modules
						DF.vent.trigger("broadcaster:gain", {
							"id": self.options.id,
							"value": evt.value
						});
					} else {
						DF.log("[DF.Libs.Broadcaster.on:set_gain] Could not modify audio gain. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);
					}
				});


				/**
				 * Triggered when the microphone has been muted
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("mute", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:mute] Muted the microphone successfully.", DF.log.DEBUG);

						// Notify other modules
						DF.vent.trigger("broadcaster:mute", {
							"id": self.options.id
						});
					} else {
						DF.log("[DF.Libs.Broadcaster.on:mute] Could not mute the microphone. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);
					}
				});


				/**
				 * Triggered when the microphone has been unmuted
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("unmute", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:unmute] Unmuted the microphone successfully.", DF.log.DEBUG);

						// Notify other modules
						DF.vent.trigger("broadcaster:unmute", {
							"id": self.options.id
						});
					} else {
						DF.log("[DF.Libs.Broadcaster.on:unmute] Could not unmute the microphone. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);
					}
				});


				this.on("set_loopback", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:set_loopback] Modified the loopback.", DF.log.DEBUG);

						// Notify other modules
						DF.vent.trigger("broadcaster:loopback", {
							"id": self.options.id,
							"value": evt.value
						});
					} else {
						DF.log("[DF.Libs.Broadcaster.on:set_loopback] Could not modify the loopback. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);
					}
				});


				this.on("mic_activity", function(evt) {
					DF.vent.trigger("broadcaster:mic_activity", {
						"id": self.options.id,
						"level": evt.level
					});
				});


				/**
				 * Triggered when an image has been loaded and displayed
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("set_image", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:set_image] Loaded and displayed image successfully", DF.log.DEBUG);

						DF.vent.trigger("broadcaster:image", {
							"id": self.options.id
						});
					} else {
						DF.log("[DF.Libs.Broadcaster.on:set_image] Could not load and display image. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);
					}
				});


				/**
				 * Triggered when an image has been hidden
				 *
				 * @param  {Object} evt Event status object
				 */
				this.on("hide_image", function(evt) {
					if (evt.ok) {
						DF.log("[DF.Libs.Broadcaster.on:hide_image] Loaded and displayed image successfully", DF.log.DEBUG);

						DF.vent.trigger("broadcaster:image", {
							"id": self.options.id
						});
					} else {
						DF.log("[DF.Libs.Broadcaster.on:hide_image] Could not load and display image. Code: " +
							evt.error + ", message: " + evt.error_message, DF.log.WARN);
					}
				});
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
						"store": true,
						"success": function() {},
						"error": function() {}
					};

				// Extend default options with given ones
				options = _.extend(default_options, options);

				if (options.connect) {
					// Display loading message
					this.loading(true);

					// Generate a callback for the connect event which unregisters itself automatically
					var connect_success = function(data) {
						// Control that the event is from this broadcaster
						if (data.id === self.options.id) {
							DF.log("[DF.Libs.Broadcaster.start] Callback from connection success !", DF.log.DEBUG);

							self.show_controls(true);

							self.loading(false);

							// Execute success callback
							options.success.call(self, {
								"stream": self.stream.get("rtmp"),
								"video_active": self.state.video.active
							});
						}
					},
						connect_fail = function(data) {
							// Control that the event is from this broadcaster
							if (data.id === self.options.id) {
								DF.log("[DF.Libs.Broadcaster.start] Callback from connection failure :(", DF.log.WARN);

								// Execute failure callback
								options.error.call(self);
							}
						};

					// Bind the generated callback to the "broadcaster:connected" and "broadcaster:connection-fail" event
					DF.vent.once('broadcaster:connected', connect_success);
					DF.vent.once('broadcaster:connection-fail', connect_fail);

					if (this.streams === null && options.host === null) {
						DF.log("[DF.Libs.Broadcaster.start] Missing an instance of the DF.Libs.Streams library", DF.log.ERROR);
						return false;
					}

					if (options.host !== null) {
						// Store the given push url
						self.host = options.host;

						// Mark the global state as started
						self.state.started = true;

						// Send command to flash app
						self.send("start", {
							"init": options.init,
							"url": self.host
						});
					} else {
						// Create new stream point on the server
						// Receives a stream model instance as param for the callback
						this.streams.create({
							"store": options.store
						}, function(stream) {
							if (stream && stream.ok === false) {
								// Execute error callback
								options.error.call(self, stream.err);
							} else {
								self.stream = stream;

								// Store the rtmp address in the host option
								self.host = stream.get("rtmp");

								// Mark the global state as started
								self.state.started = true;

								// Send command to flash app
								self.send("start", {
									"init": options.init,
									"url": self.host
								});
							}
						});
					}
				} else {
					// Mark the video state as started
					self.state.started = true;

					self.show_controls(true);

					// Send command to flash app
					this.send("start", {
						"init": options.init
					});
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

				// Hide the webcam options
				this.show_controls(false);

				// Hide profile display in case it is visible
				if (this.info_view && this.info_view.$el) {
					this.info_view.$el.find(".less-info").trigger("click", false);
				}

				if (this.layout.profile_region && this.layout.profile_region.$el) {
					this.layout.profile_region.$el.hide();
				}

				if (this.state.audio.loopback) {
					this.set_loopback(false);
				}

				// Send command to flash app
				this.send("stop");

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
			 * Set the video/audio quality of the broadcast
			 *
			 * @param {string} quality low, medium or high
			 * @return {mixed} Returns itself for chained calls or false if parameter types are wrong
			 */
			"set_quality": function(type, quality) {
				if (!/video|audio/.test(type) || !_.isString(type)) {
					DF.log("[DF.Libs.Broadcaster.set_quality] Wrong 'type' parameter given, expected audio/video", DF.log.WARN);
					return false;
				} else if (!/low|medium|high/.test(quality) || !_.isString(quality)) {
					DF.log("[DF.Libs.Broadcaster.set_quality] Wrong 'quality' parameter given, expected low/medium/high", DF.log.WARN);
					return false;
				}

				// Retrieve predefined qualities
				var q = this.state[type].qualities[quality];

				if (type == "audio") {
					// Send audio quality command
					this.send("set_quality", {
						"type": "audio",
						"value": q
					});
				} else {
					// Send capture quality command
					this.send("set_quality", {
						"type": "video",
						"value": q.quality
					});

					// Send fps modification command
					this.send("set_fps", {
						"value": q.fps
					});
				}

				return this;
			},


			/**
			 * Set the camera capture ratio
			 *
			 * @param {String} ratio 4:3 or 16:9s
			 * @return {mixed} Returns itself for chained calls or false if given paramters are wrong
			 */
			"set_ratio": function(ratio) {
				if (!/16:9|4:3/.test(ratio) || !_.isString(ratio)) {
					DF.log("[DF.Libs.Broadcaster.set_ratio] Wrong 'ratio' parameter given, expected 16:9/4:3", DF.log.WARN);
					return false;
				}

				ratio = ratio || this.state.video.ratio;

				this.send("set_ratio", {
					"value": ratio
				});
				return this;
			},


			/**
			 * Change the ratio of the broadcaster layout, this swaps css classes between r16-9 and r4-3
			 *
			 * @type {Broadcaster}
			 * @param  {String} ratio "16:9" or "4:3"
			 */
			"set_container_ratio": function(ratio) {
				if (ratio === "4:3") {
					this.layout.$el.addClass("r4-3").removeClass("r16-9");
				} else {
					this.layout.$el.addClass("r16-9").removeClass("r4-3");
				}

				return this;
			},


			/**
			 * Change the size class of the main container
			 *
			 * @this {Broadcaster}
			 * @param  {string} size The size to set, has to correspond to the classes defined in the CSS
			 * @return {Broadcaster} Returns itself for chained calls
			 */
			"set_size": function(size) {
				// List the possible size classes
				var classes = "huge big medium small tiny";

				// Remove the listed classes from the broadcaster/subscriber's layout
				this.layout.$el.removeClass(classes);

				// Apply the new size class to the layout container
				this.layout.$el.addClass(size);

				return this;
			},


			/**
			 * Set the capture size of the webcam
			 * Only height needs to be provided, the width is calculated according to the capture ratio
			 *
			 * @param {Number} height Height of the new capture size to apply
			 * @return {mixed} Returns itself for chained calls or false if parameter type is wrong
			 */
			"set_capture_size": function(height) {
				if (!_.isNumber(height)) {
					DF.log("[DF.Libs.Broadcaster.set_capture_size] Wrong parameter type given, expected Number", DF.log.WARN);
					return false;
				}

				// Send command to flash app
				this.send("set_capture_size", {
					"value": height
				});

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

				// Send command to flash app
				this.send('set_gain', {
					"value": gain
				});

				return this;
			},


			/**
			 * Mute the microphone
			 */
			"mute": function() {
				this.state.audio.active = false;
				this.send('mute');
				return this;
			},


			/**
			 * Unmute the microphone
			 */
			"unmute": function() {
				this.state.audio.active = true;
				this.send('unmute');
				return this;
			},


			/**
			 * Toggle the Broadcaster volume
			 *
			 * @param  {object} btn An instance of the DOM element used to toggle the volume
			 */
			"toggle_volume": function() {
				// Send request to flash app
				this[this.state.audio.active ? 'mute' : 'unmute']();

				return this;
			}
		};

		// bind Broadcaster prototype to init function
		Broadcaster.fn.init.prototype = Broadcaster.fn;



		// Return the public interface of the library
		return Broadcaster;


	})();




})(window, jQuery);