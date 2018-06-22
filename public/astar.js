/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



function astar(arr, arrX, arrY, startx, starty, endx, endy) {

    if (startx === endx && starty === endy) {
        return [];
    }

    var open = [];
    var closed = [];

    addPath(startx, starty);
    
    var next;
    while ((next= getObjWithLowestHeuristik())!==null && !(next.x === endx && next.y === endy)) {
        
        next = getObjWithLowestHeuristik();
        delete open[next.x+" "+next.y];
        
        closed[next.x+" "+next.y]=next;
        
        addPath(next.x + 1, next.y, next);
        addPath(next.x - 1, next.y, next);
        addPath(next.x, next.y + 1, next);
        addPath(next.x, next.y - 1, next);
        
    }
    
    return next;

    function addPath(x, y, last) {

        if (open[x + " " + y] !== undefined || closed[x + " " + y] !== undefined ||
                x < 0 || y < 0 || x >= arrX || y >= arrY || arr[x][y] !== 0) {
            return false;
        }

        open[x + " " + y] = {x: x, y: y, heur: heuristik(x - endx, y - endy), last: last};
        return true;
    }

    function getObjWithLowestHeuristik() {
        var lowest = null;
        for (var key in open) {
            var test = open[key];
            if (lowest === null || test.heur < lowest.heur) {
                lowest = test;
            }
        }
        return lowest;
    }

    function heuristik(x, y) {
        return hypo(x, y);
    }
}
