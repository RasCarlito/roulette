// libs/streams/dust/df.streams.broadcaster.dust
(function(){dust.register("df.streams.broadcaster",body_0);function body_0(chk,ctx){return chk.write("<video autoplay></video>");}return body_0;})();
 // mods/stage/dust/df.stage.dust
(function(){dust.register("df.stage",body_0);function body_0(chk,ctx){return chk.write("<div class=\"stage\"><div class=\"controls\"><button class=\"start\">Start capture</button><button class=\"stop\">Stop capture</button></div><div class=\"broadcaster\"></div></div>");}return body_0;})();