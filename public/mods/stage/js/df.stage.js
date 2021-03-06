(function(window, $, unndefined) {
	"use strict";

	var _ = window._,
		Backbone = window.Backbone,
		Marionette = Backbone.Marionette,
		DF = window.DF;


	DF.Stage = (function() {
		var Stage = {};



		var Stage_layout = Marionette.LayoutView.extend({
			"template": "df.stage",

			"regions": {
				"broadcaster_region": ".broadcaster"
			},

			"events": {
				"click button.start": "start",
				"click button.stop": "stop"
			},

			"initialize": function(options) {
				DF.log("[DF.Stage:Stage_layout.init] Initializing stage layout", DF.log.DEBUG);

				console.log(options);

				this.parent = options.parent;
			},

			"start": function(e) {
				e.preventDefault();

				this.parent.broadcaster.start();

				$(e.target).hide()
					.siblings().show();
			},

			"stop": function(e) {
				e.preventDefault();

				this.parent.broadcaster.stop();

				$(e.target).hide()
					.siblings().show();
			}
		});





		var bind_events = _.bind(function() {
			DF.vent.on("node:dispatch", function(offer) {
				DF.log("[DF.Stage:on(dispatch)] Received offer: ", DF.log.DEBUG);
				console.log(offer);
			})
		}, Stage);




		Stage.init = function() {
			DF.log("[DF.Stage.init] Initializing Stage module", DF.log.DEBUG);

			var self = this;

			bind_events();

			this.layout = new Stage_layout({
				"parent": this
			});

			DF.content_region.show(this.layout);

			this.broadcaster = DF.Libs.Broadcaster({
				region: this.layout.broadcaster_region
			});

			DF.vent.connect();
		};

		return Stage;
	})();


	DF.addInitializer(function() {
		DF.Stage.init();
	});

})(window, jQuery);