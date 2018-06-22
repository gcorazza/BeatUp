function create2DArray(X, Y) {
    var arr = [];

    for (var i = 0; i < X; i++) {
        arr[i] = [];
    }

    for (var x = 0; x < X; x++) {
        for (var y = 0; y < Y; y++) {
            arr[x][y] = 0;
        }
    }

    return arr;
}


const Point = require("../common/Point");
const Player = require("./Player");

class Game {

    constructor(ID) {
        this.ID=ID;
        this.mapX = 30;
        this.mapY = 30;
        this.map = create2DArray(this.mapX, this.mapY);

        this.players = [];

        this.genRandomMap();
    }

    genRandomMap() {
        for (var x = 0; x < this.mapX; x++) {
            for (var y = 0; y < this.mapY; y++) {
                this.map[x][y] = Math.floor(Math.random() * 1.3);
            }
        }
    }

    join(socket) {
        var player = new Player(socket, this);
        socket.emit("map", this.map);
        socket.emit("you", player.getID());
        for (var i = 0; i < this.players.length; i++) {
            var a = this.players[i];
            this.sendPlayerAToPlayerB(player, a);
        }

        this.players.push(player);

        //send all players to new player
        for (var i = 0; i < this.players.length; i++) {
            var a = this.players[i];
            this.sendPlayerAToPlayerB(a, player);
        }
    }

    leave(socket) {
        if (socket.player === null || socket.player === undefined) {
            return;
        }
        removeFromArr(this.players, socket.player);

        //send all players that one left
        for (var i = 0; i < this.players.length; i++) {
            var a = this.players[i];
            a.socket.emit("leave", socket.player.getID());
        }
        socket.player = null;
    }
    
    attack(player, input){
        switch (input) {
            case "W":
            {
                this.hit(player,0,-1);
                break;
            }
            case "A":
            {
                this.hit(player,-1,0);
                break;
            }
            case "S":
            {
                this.hit(player,0,1);
                break;
            }
            case "D":
            {
                this.hit(player,1,0);
                break;
            }
        }
    }
    
    hit(player,cx,cy){
        
        if(!player.canHit()){
            return;
        }
        player.lastHit=Date.now();
        
        for (var i = 0; i < this.players.length; i++) {
            var p = this.players[i];
            p.socket.emit("attack", player.ID + "." + (player.x+cx) + "." + (player.y+cy));
            if(p.x===player.x+cx && p.y===player.y+cy){
                this.loseLife(p, 10);
            }
        }
    }
    
    loseLife(player, life){
        player.life-=life;
        this.updateLife(player);
        
        if(player.life<=0){
            var point=this.getSpawnPoint();
            player.x=point.x;
            player.y=point.y;
            player.life=100;
            this.updatePlayer(player);
        }
    }
    

    move(player, input) {
        switch (input) {
            case "W":
            {
                this.go(player,0,-1);
                break;
            }
            case "A":
            {
                this.go(player,-1,0);
                break;
            }
            case "S":
            {
                this.go(player,0,1);
                break;
            }
            case "D":
            {
                this.go(player,1,0);
                break;
            }
        }
    }

    go(player, cx, cy) {
        if (!player.canMove()) {
            return;
        }
        if (!this.collide(player.x + cx, player.y + cy)) {
            player.x+=cx;
            player.y+=cy;
            player.lastMove=Date.now();
            this.updatePos(player);
        }
    }
    
    updatePlayer(player){
        for (var i = 0; i < this.players.length; i++) {
            var p = this.players[i];
            this.sendPlayerAToPlayerB(player,p);
        }
    }
    
    updateLife(player){
        for (var i = 0; i < this.players.length; i++) {
            var p = this.players[i];
            p.socket.emit("life", player.ID + "." + player.life);
        }
    }
    
    updatePos(player) {
        for (var i = 0; i < this.players.length; i++) {
            var p = this.players[i];
            p.socket.emit("move", player.ID + "." + player.x + "." + player.y);
        }
    }

    collide(x, y) {
        if (x < 0 || x >= this.mapX) {
            return true;
        }
        if (y < 0 || y >= this.mapY) {
            return true;
        }
        return this.map[x][y] > 0;
    }

    sendPlayerAToPlayerB(a, b) {
        var sendsocket = b.socket;
        var s = a.socket;
        var g = a.game;
        a.socket = null;
        a.game = null;
        sendsocket.emit("player", a);
        a.socket = s;
        a.game = g;
    }

    getSpawnPoint() {
        do {
            var x = Math.floor(Math.random() * this.mapX);
            var y = Math.floor(Math.random() * this.mapY);
        } while (this.map[x][y] === 1);
        return new Point(x, y);
    }

    getAmountPlayer() {
        return this.players.length;
    }
}

function removeFromArr(arr, elem) {
    var position = arr.indexOf(elem);

    if (~position)
        arr.splice(position, 1);
}

module.exports = Game;