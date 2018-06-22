
var socket = io();
var map = null;
var mapX = 30, mapY = 30;
var players = [];

var state = "menue";
var playing = "human";

var youID = -1;

var canvas = document.getElementById("gameCanvas");
var gameID = document.getElementById("gameID");

var ctx = canvas.getContext("2d");
var mousePos = {x: 0, y: 0};

var path = undefined;

var bot = new Bot();


socket.on("player", (msg) => {
    setPlayer(msg);
    console.log(msg);
    redraw();
});

socket.on("map", (msg) => {
    map = msg;
    state = "ingame";
    redraw();
});

socket.on("move", (msg) => {
    move(msg);
    redraw();
});

socket.on("leave", (msg) => {
    leave(msg);
    redraw();
});

socket.on("you", (msg) => {
    youID = parseInt(msg);
});

socket.on("attack", (msg) => {
    var split = msg.split(".");
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(parseInt(split[1]) * 15, parseInt(split[2]) * 15, 14, 14);
});

socket.on("life", (msg) => {
    var split = msg.split(".");
    player = getPlayerByID(parseInt(split[0]));
    if (player !== null) {
        player.life = parseInt(split[1]);
    }
    redraw();
});


ctx.scale(1.5, 1.5);
setInterval(redraw, 100);

document.addEventListener('mousemove', function (evt) {
    mousePos = getMousePos(canvas, evt);
    if (state === "menue")
        drawMenue();
}, false);

document.addEventListener('mousedown', function (evt) {
    if (playing === "human")
        mouseDown(evt);
}, false);

document.addEventListener('keydown', function (event) {

    if (event.keyCode === 66) { //B
        if (playing === "human") {
            playing = "bot";
            bot.start();
        } else if (playing === "bot") {
            playing = "human";
            bot.stop();
        }
    }
    if (playing === "human")
        if (event.keyCode === 87) { //W
            socket.emit("move", "W");
        } else if (event.keyCode === 65) { //A 
            socket.emit("move", "A");
        } else if (event.keyCode === 83) { //S
            socket.emit("move", "S");
        } else if (event.keyCode === 68) { //D
            socket.emit("move", "D");
        }
});


Math.toDegree = function (radians) {
    return radians * 180 / Math.PI;
};


function mouseDown(evt) {

    mousePos = getMousePos(canvas, evt);
    if (state === "menue" && isMouseIn(5, 150*1.5, 400*1.5, 300)) {
        socket.emit("join", gameID.value);
    } else if (state === "ingame" && playing === "human") {
        var you = getPlayerByID(youID);
        if (you !== null) {
            var x = mousePos.x - you.x * 15 * 1.5;
            var y = mousePos.y - you.y * 15 * 1.5;
            var h = hypo(x, y);
            var direction = "";
            var angle = Math.toDegree(Math.acos(x / h));
            if (angle < 45) {
                direction = "D";
            } else if (angle > 90 + 45) {
                direction = "A";
            } else if (y < 0) {
                direction = "W";
            } else {
                direction = "S";
            }
            console.log(direction);
            socket.emit("attack", direction);
        }
    }

}

function hypo(x, y) {
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function clearCanvas(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 500, 500);
}

function redraw() {

    switch (state) {
        case "menue":
        {
            clearCanvas("#24af01");
            drawMenue();
            break;
        }
        case "ingame":
        {
            clearCanvas("#FFFFFF");
            drawMap();
            drawPlayer();
            drawPath();
            drawHUD();
            break;
        }
    }
}

function drawPath() {
    if (path === null || path === undefined) {
        return;
    }
    var next = path;
    do {

        ctx.fillStyle = "#0000FF";
        ctx.fillRect(next.x * 15, next.y * 15, 14, 14);
        next = next.last;
        console.log(next);
    } while (next !== undefined);
}

function drawMenue() {
    if (isMouseIn(75, 150*1.5, 400*1.5, 300)) {
        ctx.fillStyle = "#32e50d";
    } else {
        ctx.fillStyle = "#2ecc0e";
    }

    ctx.strokeStyle = "#1f8c09";
    ctx.lineWidth = 10;
    ctx.ellipse(250, 250, 200, 100, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.font = '80px Arial';
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText("Play!", 250, 280);
}

function isMouseIn(x, y, width, height) {
    return(mousePos.x - x > 0 && mousePos.x - x < width && mousePos.y - y > 0 && mousePos.y - y < height);
}

function drawMap() {
    ctx.fillStyle = "#000000";
    for (var x = 0; x < mapX; x++) {
        for (var y = 0; y < mapY; y++) {
            if (map[x][y] > 0)
                ctx.fillRect(x * 15, y * 15, 14, 14);
        }
    }
}

function drawPlayer() {

    for (var p in players) {
        if (players[p].ID === youID) {
            ctx.fillStyle = "#00FF00";
        } else {
            ctx.fillStyle = "#EE0000";
        }
        ctx.fillRect(players[p].x * 15, players[p].y * 15, 14, 14);

        ctx.fillStyle = "#FF0000";
        ctx.fillRect(players[p].x * 15 - 5, players[p].y * 15 - 5, 20, 3);
        ctx.fillStyle = "#00FF00";
        ctx.fillRect(players[p].x * 15 - 5, players[p].y * 15 - 5, 20 * (players[p].life / 100), 3);
    }
}

function drawHUD() {
    ctx.font = '15px Arial';
    ctx.fillStyle = "#000000";
    ctx.textAlign = "right";
    ctx.fillText("playing: " + playing, 0, 15);
}

function setPlayer(player) {
    var p = getPlayerByID(player.ID);
    if (p !== null) {
        p.life=player.life;
        p.x=player.x;
        p.y=player.y;
        p.
        removeFromArr(players, p);
    } else
        players.push(player);
}

function getPlayerByID(ID) {
    for (var p in players) {
        if (players[p].ID === ID) {
            return players[p];
        }
    }
    return null;
}

function leave(id) {
    var player = getPlayerByID(parseInt(id));
    removeFromArr(players, player);
    if(bot.getTarget()===player){
        bot.setTarget(null);
    }
}

function removeFromArr(arr, elem) {
    var position = arr.indexOf(elem);

    (~position)
    arr.splice(position, 1);
}

function move(mvstring) {
    var movearr = mvstring.split(".");
    var player = getPlayerByID(parseInt(movearr[0]));
    var x = parseInt(movearr[1]);
    var y = parseInt(movearr[2]);
    player.x = x;
    player.y = y;
}

function Bot() {

    var intervall;
    var target = null;

    Bot.prototype.start = function () {
        intervall = setInterval(update, 100);
    };

    Bot.prototype.stop = function () {
        clearInterval(intervall);
    };
    
    Bot.prototype.setTarget = function (t) {
        target=t;
    };
    
    Bot.prototype.getTarget = function (t) {
        return target;
    };
    
    function update() {
        var you = getPlayerByID(youID);
        
        target = searchNearestTargetFrom(you);
        
        path = astar(map, 30, 30, you.x, you.y, target.x, target.y);
        if (canHit(you, target)) {
            var key = getDirection(you, target);
            socket.emit("attack", key);
        } else {
            var firstnode = getPreFirstElementFromPath(path);
            var key = getDirection(you, firstnode);
            socket.emit("move", key);
        }
    }

    function canHit(from, to) {
        if (from.x === to.x) {
            return from.y === to.y + 1 || from.y === to.y - 1;
        }

        if (from.y === to.y) {
            return from.x === to.x + 1 || from.x === to.x - 1;
        }
    }

    function getDirection(from, to) {
        if (from.x > to.x)
            return "A";
        if (from.x < to.x)
            return "D";
        if (from.y < to.y)
            return "S";
        if (from.y > to.y)
            return "W";
    }

    function getPreFirstElementFromPath(path) {
        var next = path;
        while (next.last.last !== undefined) {
            next = next.last;
        }
        return next;
    }

    function searchNearestTargetFrom(from) {
        var length=-1;
        var target=null;
        for (var i = 0; i < players.length; i++) {
            var player = players[i];
            if (player.ID !== youID) {
                var path=astar(map, 30, 30, from.x, from.y, player.x, player.y);
                var plength=getPathLength(path);
                if(target===null || length>plength){
                    length=plength;
                    target=player;
                }
            }
        }
        
        return target;
    }
    
    function getPathLength(path){
        var next = path;
        var length=0;
        while (next.last !== undefined) {
            next = next.last;
            length++;
        }
        return length;
    }
    
    
}