var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
	req.app.set("test", "w00t");
	res.render('index', {
		title: 'Roulette'
	});
});

module.exports = router;