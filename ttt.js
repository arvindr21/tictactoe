var crypto = require('crypto');
// Game Object Initializer
exports.Game = function (game_id, socket, name) {

    this.game_id = game_id;

    this.game = [[0,0,0],[0,0,0],[0,0,0]];

    this.player1 = socket;
    this.player2 = undefined;

    this.p1_turn = true;
    this.p1Name = name;
    this.p2Name = undefined;

    return this;
}


// Check all possible winning combinations
exports.isWon = function (b) {

    // Across
    if ((b[0][0] == b[0][1] && b[0][1] == b[0][2]) && b[0][0])
        return b[0][0];

    if ((b[1][0] == b[1][1] && b[1][1] == b[1][2]) && b[1][0])
        return b[1][0];

    if ((b[2][0] == b[2][1] && b[2][1] == b[2][2]) && b[2][0])
        return b[2][0];

    // Down
    if ((b[0][0] == b[1][0] && b[1][0] == b[2][0]) && b[0][0])
        return b[0][0];

    if ((b[0][1] == b[1][1] && b[1][1] == b[2][1]) && b[0][1])
        return b[0][1];

    if ((b[0][2] == b[1][2] && b[1][2] == b[2][2]) && b[0][2])
        return b[0][2];

    // Diagonal
    if ((b[0][0] == b[1][1] && b[1][1] == b[2][2]) && b[0][0])
        return b[0][0];

    if ((b[2][0] == b[1][1] && b[1][1] == b[0][2]) && b[2][0])
        return b[2][0];

    return 0;

}

// Check if the board is full
exports.isFull = function (b) {

    for (var i = 0; i < 3; i++)
    {
    	for (var j = 0; j < 3; j++)
	    {
	    	if (b[i][j] == 0)
            return false;	
	    }	
    }
    return true;
}

// Create a new game object and add it to the games object
exports.createGame = function (games, socket, data, hash) {

    var new_game_id = hash;

    if (new_game_id == null) {
        var u = 'uoasodf8a7yf8a89h89awrh' + (new Date()).getTime();
        new_game_id = crypto.createHash('md5').update(u).digest("hex");
    }

    games[new_game_id] = new exports.Game(new_game_id, socket, data.user);

    socket.emit('gameCreated', {
        gameId: new_game_id
    });
}

// Assign to a game and start it if a game is available
exports.requestGame = function (games, socket,data) {

    for (var i in games)
        if (games[i].player2 === undefined) {
            games[i].player2 = socket;
			games[i].p2Name = data.user;
            games[i].player1.emit('gameStart', {
                gameId: games[i].game_id,
                turn: games[i].p1_turn,
                p1Name : games[i].p1Name,
                p2Name : games[i].p2Name
            });

            games[i].player2.emit('gameStart', {
                gameId: games[i].game_id,
                turn: !games[i].p1_turn,
                p1Name : games[i].p1Name,
                p2Name : games[i].p2Name
            });

            return;
        }

    socket.emit('noFreeGames');
}

// Send a move to the relevant game
exports.dispatchMove = function (games, socket, data, handler) {

    var game = games[data.gameId];

    if (game === undefined) {
        socket.emit('error', {
            description: 'Invalid game ID'
        });
        return;
    }

    if (handler == null)
        handler = exports.move;

    if (handler(game, socket, data))
        delete games[data.game_id];
}


// Validate and execute a move
exports.move = function (game, socket, data) {

    var cell = [data.row, data.col];

    if (game.player1 === socket && !game.p1_turn) {
        socket.emit('error', {
            description: 'Not your turn'
        });
        return false;
    }

    if (game.player2 === socket && game.p1_turn) {
        socket.emit('error', {
            description: 'Not your turn'
        });
        return false;
    }

    if (game.game[cell[0]][cell[1]] != 0 ) {
        socket.emit('error', {
            description: 'Invalid square selection'
        });
        return false;
    }

    if (game.player1 !== socket && game.player2 !== socket) {
		socket.emit('error', { description: 'Hacking is unethical!!'});
		return false;
	}

    if (game.p1_turn)
        game.game[cell[0]][cell[1]]  = 1;
    else
        game.game[cell[0]][cell[1]]  = 2;

    data.sign = game.game[cell[0]][cell[1]] ;

    data.arr = game.game;
  
   game.p1_turn = !game.p1_turn;
   
    game.player1.emit('move', {
    			gameId : data.gameId,
    			row: data.row,
    			col:data.col,
                sign: data.sign,
                arr: data.arr,
                turn:game.p1_turn
            });
    game.player2.emit('move', {
    			gameId : data.gameId,
    			row: data.row,
    			col:data.col,
                sign: data.sign,
                arr: data.arr,
                turn:!game.p1_turn
            });

    var winner = exports.isWon(game.game);

    if (winner || exports.isFull(game.game)) {
        game.player1.emit('gameOver', {
            winner: winner
        });
        game.player2.emit('gameOver', {
            winner: winner
        });
        return true;
    }

    return false;
}