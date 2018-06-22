/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


class Player {
    
    constructor(socket,game) {
        Player.lastID++;
        this.game=game;
        this.ID=Player.lastID;
        
        var spawn= game.getSpawnPoint();
        this.x=spawn.x;
        this.y=spawn.y;
        
        this.socket=socket;
        socket.player=this;
        
        this.lastMove=Date.now();
        this.moveWait=100;
        
        this.lastHit=Date.now();
        this.hitWait=500;
        
        this.life=100;
        
    }
    
    getPos(){
        return new Point(this.x,this.y); //require?
    }
    
    getID(){
        return this.ID;
    }
    
    canMove(){
        return (Date.now()-this.lastMove)>this.moveWait;
    }
    
    canHit(){
        return (Date.now()-this.lastHit)>this.hitWait;
    }
    
}

Player.lastID=1;

module.exports = Player;