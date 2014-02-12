var express = require("express");
var connected_users={};
var app = express();
var ttt = require('./ttt');

var games = new Object();
app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
	res.render("home");
});

var port = Number(process.env.PORT || 9999);
var io = require('socket.io').listen(app.listen(port)); 


io.sockets.on('connection', function (socket) {

	socket.on('requestGame', function (data) {
		ttt.requestGame(games, socket, data);
	});


	socket.on('createGame', function (data) {
		ttt.createGame(games, socket, data);

	});

	socket.on('move', function (data) {
		ttt.dispatchMove(games, socket, data);
	}); 


});