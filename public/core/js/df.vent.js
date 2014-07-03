(function(window, $, undefined) {
	/**
	 * EventManager library
	 * --------------------
	 * This library is wrapper to manage node.js event distribution between clients with Socket.io
	 * You can also create internal events to distribute events between your different local scripts thanks to Backbone.js
	 *
	 * @author  Carl OGREN
	 */
	DF.vent = _.extend(DF.vent, (function() {
		//Create empty object
		var Vent = {};


		/**
		 * Socket.IO wrapper to connect to Node.js server
		 * @param {Object} options The configuration options. Example:
		 *                         { "host": "http://localhost",
		 *                           "port": 1337,
		 *                           "connect": true,
		 *                           "chan": "event-channel" }
		 */
		var Node = function(options) {
			return new Node.fn.init(options);
		};


		/**
		 * Node prototype
		 * @type {Object}
		 */
		Node.fn = Node.prototype = {
			/**
			 * Default options
			 * @type {Object}
			 */
			"defaultOptions": {
				"node": {
					"host": window.location.hostname, // Hostname of the Node.js server
					"port": 1337 // Port of the Node.js server
				},

				"php": {
					"host": window.location.hostname,
					"port": window.location.port
				},

				"user": null,

				"connect": true, // Automatically connect when initialized
				"chan": "event-channel", // Transmission channel

				"authentify": true,

				"message_queue_length": 10
			},


			//Module state variables
			"state": {
				/**
				 * User connected to socket server flag
				 * ------------------------------------
				 * If set to true, flags the current client as connected to the socket server
				 */
				"connected": false
			},


			/**
			 * Socket instance holder
			 */
			"socket": null,


			/**
			 * Message queue so that the client doesn't interpret the same message twice if resent
			 * it keeps a maximum number of messages as defined in the options
			 */
			"message_queue": [],


			/**
			 * Constructor
			 * @param  {Object} options The configuration options
			 */
			"init": function(options) {
				DF.log("[DF.vent:Node.init] Initializing NodeJS connection library", DF.log.DEBUG);

				this.set_options(options);

				if (this.options.connect) {
					this.connect();
				}
			},


			/**
			 * Set options
			 */
			"set_options": function(options) {
				this.options = _.extend({}, this.options || this.defaultOptions, options);
			},


			/**
			 * Connect to the Node.js server
			 */
			"connect": function() {
				DF.log("[DF.vent:Node.connect] Connecting to Node.js server @ " + this.options.node.host + ":" + this.options.node.port, DF.log.DEBUG);

				var self = this;

				// Do not connect twice
				if (this.state.connected) {
					return;
				}

				if (typeof io === 'undefined') {
					DF.log('[DF.vent:Node.connect] Missing Socket.io library', DF.log.DEBUG);
					DF.vent.trigger('node:error');
					return;
				}

				// Connect to Socks server
				this.socket = io();


				/**
				 * Socket.io Internal events
				 * -------------------------
				 * Handles the socket.io connection/reconnection/disconnection schema
				 */

				// Socket.io error
				this.socket.on('error', function(reason) {
					DF.log("[DF.vent:Node.socket.on(error)] An error occured with the socks server: ", DF.log.WARN);
					DF.log.obj(reason);

					self.state.connected = false;

					DF.vent.trigger('node:error', reason);
				});



				// Register callback for a successful connection
				this.socket.on('connect', function() {
					DF.log("[DF.vent:Node.socket.on(connect)] Successful connection to the socks server", DF.log.DEBUG);

					// set state to connected
					self.state.connected = true;

					DF.vent.trigger('node:connect');
				});

				// Disconnection from server callback
				this.socket.on('disconnect', function() {
					DF.log("[DF.vent:Node.socket.on(disconnect)] Successful disconnection from the socks server", DF.log.DEBUG);

					DF.vent.trigger('node:disconnect');
				});


				this.socket.on("dispatch", function(offer) {
					DF.log("[DF.vent:Node.socket.on(dispatch)] Received 'dispatch' event from socket.io server", DF.log.DEBUG);
					DF.vent.trigger("node:dispatch", offer);
				});

				return this;
			},


			/**
			 * Disconnect from the Node.js server
			 */
			"disconnect": function() {
				DF.log("[DF.vent:Node.disconnect] Disconnecting from Node.js server", DF.log.DEBUG);

				// Flag client as disconnected
				this.state.connected = false;

				//Disconnect from the socket server
				if (this.socket) {
					this.socket.disconnect();
				}

				return this;
			},


			/**
			 * Direct alias to the socket.emit() method to send custom messages to the Socks server
			 */
			"emit": function() {
				this.socket.emit.apply(this.socket, arguments);
			},


			/**
			 * events.dispatch
			 * -----------------
			 * dispatch lazy poll result to right callback
			 *
			 * @param data <array>	Event list to dispatch
			 */
			"dispatch": function(evt) {
				if (evt.action !== undefined) {
					DF.log("[DF.vent:Node.dispatch] Dispatching event " + evt.action + " to registered callbacks", DF.log.DEBUG);

					DF.vent.trigger('node:' + evt.action, evt);
				} else {
					DF.log("[DF.vent:Node.dispatch] Could not dispatch received event missing event.action parameter", DF.log.DEBUG);
				}
			},


		};
		//Extend init method's prototype with the Node.prototype
		Node.fn.init.prototype = Node.fn;


		// Private Node instance holder
		var node = null;




		/**
		 * Public API of the Vent app
		 * @type {Object}
		 */


		/**
		 * Initialize Vent
		 */
		Vent.init = function() {
			DF.log("[DF.vent.init] Initializing events system", DF.log.DEBUG);
		};



		/**
		 * Connect to the Node.js server
		 * @param  {Object} options
		 */
		Vent.connect = function(options) {
			if (node === null) {
				node = Node(options);
			} else {
				node.set_options(options);
				node.connect();
			}
		};


		/**
		 * Disconnect from the Node.js server
		 */
		Vent.disconnect = function() {
			if (node === null) {
				DF.log("[DF.vent.disconnect] Cannot disconnect from the NodeJS server because it's not instantiated", DF.log.DEBUG);
			} else {
				node.disconnect();
			}
		};


		/**
		 * Post a message to the Node.js server
		 * See the Node.post method for more details
		 */
		Vent.post = function() {
			if (node === null) {
				DF.log("[DF.vent.post] Cannot post to the NodeJS server because it's not instantiated", DF.log.DEBUG);
			} else {
				node.post.apply(node, arguments);
			}
		};


		/**
		 * Directly call the socket.io emit method
		 */
		Vent.emit = function() {
			if (node === null) {
				DF.log("[DF.vent.emit] Cannot emit to the NodeJS server because it's not instantiated", DF.log.DEBUG);
			} else {
				node.emit.apply(node, arguments);
			}
		};

		Vent.ready = function() {
			if (node !== null) {
				node.ready();
			}
		};


		return Vent;
	})());



	DF.addInitializer(function() {
		DF.vent.init();
	});


})(window, jQuery);