
const express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const Game = require("./Game");
const Player = require("./Player");

var games = [];

//static express http handler
app.use(express.static("public"));

http.listen(8080);
//socket.io listener
io.on('connection', function (socket) {
    console.log('a user connected' + socket.id);

    socket.on("join", function (msg) {
        console.log('join game ' + msg);
        join(socket, msg);
    });

    socket.on("disconnect", function (msg) {
        console.log('disconnect/leave' + socket.id);
        leave(socket);
    });

//    socket.on("leave", function (msg) {
//        console.log('leave' + socket.id);
//        leave(socket);
//    });

    socket.on("move", function (msg) {
        move(socket, msg);
    });

    socket.on("attack", function (msg) {
        attack(socket, msg);
    });

});


function move(socket, input) {
    if ((socket.player === null || socket.player === undefined)) {
        return;
    }

    socket.player.game.move(socket.player, input);
}

function attack(socket, input) {
    if ((socket.player === null || socket.player === undefined)) {
        return;
    }

    socket.player.game.attack(socket.player, input);

}

function leave(socket) {
    if ((socket.player === null || socket.player === undefined)) {
        return;
    }

    var game = socket.player.game;
    socket.player.game.leave(socket);
    if (game.getAmountPlayer() === 0) {
        console.log("game empty, remove game");
        var position = games.indexOf(game);

        if (~position)
            games.splice(position, 1);
        socket.player = null;
    }
}

function join(socket, id) {
    if (!(socket.player === null || socket.player === undefined)) {
        return;
    }

    var joinGame=null;
    console.log(id);
    if (id === "") {
        if (joinGame === null) {
            joinGame = getRandomGame();
        }

        if (joinGame === null) {
            joinGame = createNewGame();
        }
        
    } else {
        var joinGame = getGame(id);

        if (joinGame === null) {
            joinGame = createNewGame(id);
        }
    }

    joinGame.join(socket, id);
}

function getGame(id) {

    if (id === null) {
        return null;
    }

    for (var i = 0; i < games.length; i++) {
        if (games[i].ID === id) {
            return games[i];
        }
    }
    return null;
}

function getRandomGame() {
    if (games.length === 0) {
        return null;
    }
    return games[Math.floor(Math.random() * games.length)];
}

function createNewGame(ID) {
    if (ID === undefined) {
        ID = Math.floor(Math.random() * 100000).toString();
    } else if (getGame(ID) !== null) {
        return;
    }
    console.log(ID);

    var game = new Game(ID);
    games.push(game);
    return game;
}