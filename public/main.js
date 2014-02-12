var ttt = Object.create(null);
ttt.gameId = -1,
ttt.user = "",
ttt.isPlaying = false;

ttt.placeMark = function (mark, row, col) {
    return $("[data-row=" + row + "][data-col=" + col + "]").html("<label class=" + mark + ">" + mark + "</label>");
}
ttt.cleanup = function(){
	$(".cell").html("");
	$('#log').html("Game over. new game?");
};

ttt.newGame = function(){
	ttt.socket.emit("requestGame");
}

var t  = "user_"+Math.floor(Math.random()*900) + 100;
var name = prompt("Please enter your name",t);
ttt.user = name ? name : t;


ttt.socket = io.connect('http://localhost:9999').emit('requestGame', {user: ttt.user});
ttt.socket.heartbeatTimeout = 60000;


ttt.socket.on('noFreeGames', function () {
	$("#newGame").hide();
  $('#log').append('No free users/games, creating a new game <br/>');
  ttt.socket.emit('createGame',{user: ttt.user});
});

ttt.socket.on('gameCreated', function (data) {
  $('#log').append('Game created, awaiting opponent <br/>');
  ttt.gameId = data.gameId;
});

ttt.socket.on('gameStart', function (data) {
  ttt.gameId = data.gameId;
  ttt.turn = data.turn;
  ttt.isPlaying = true;
  $("#vs").html(data.p1Name+ " vs "+data.p2Name +" <br/>");
  if (ttt.turn)
  {
    $('#log').append('Game started, your turn. You are O <br/>');
    ttt.mark = "O";
  }
  else
  {
    $('#log').append('Game started, opponents turn. You are X <br/>');
    ttt.mark = "X";
  }
});

ttt.socket.on('move', function (data) {
    ttt.row = data.row;
    ttt.col = data.col;
    ttt.value = (data.sign == 1) ? 'O' : 'X';
    ttt.turn = data.turn;
    ttt.placeMark(ttt.value,ttt.row,ttt.col);

    if (ttt.turn)
    $('#log').append('Your turn <br/>');
  else
    $('#log').append('Opponents turn <br/>');
});

ttt.socket.on('gameOver', function (data) {
  if (data.winner == (ttt.mark == "O" ? 1 : 2))
    alert('You won!');
  else if (data.winner == 0)
    alert('Draw');
  else
    alert('You Lost');
	
	ttt.isPlaying = false;
	$("#newGame").css("display","inline-block");
					
  // clean game
});

ttt.socket.on('error', function (data) {
  alert(data.description);
});


$(function () {
    $(".cell").on("click", function () {
    	if(!ttt.isPlaying) return false;
    	ttt.socket.emit('move', {gameId: ttt.gameId, row: $(this).data("row"), col : $(this).data("col"), mark : ttt.mark }); 
    });
    $("#newGame").on("click", function(){
    	ttt.cleanup();
    	ttt.socket.emit('requestGame', {user: ttt.user});
    });
});