var Mode = require('./Mode');

function FFA() {
    Mode.apply(this, Array.prototype.slice.call(arguments));

    this.ID = 0;
    this.name = "Free For All";
    this.specByLeaderboard = true;
}

module.exports = FFA;
FFA.prototype = new Mode();

// Gamemode Specific Functions

FFA.prototype.leaderboardAddSort = function(player,leaderboard) {
    // Adds the player and sorts the leaderboard
    var len = leaderboard.length - 1;
    var loop = true;
    while ((len >= 0) && (loop)) {
        // Start from the bottom of the leaderboard
        if (player.getScore(false) <= leaderboard[len].getScore(false)) {
            leaderboard.splice(len + 1, 0, player);
            loop = false; // End the loop if a spot is found
        }
        len--;
    }
    if (loop) {
        // Add to top of the list because no spots were found
        leaderboard.splice(0, 0,player);
    }
};

// Override

FFA.prototype.onPlayerSpawn = function(gameServer,player) {
    // Random color
    player.color = gameServer.getRandomColor();
    
    // Set up variables
    var pos, startMass;
    
    // Check if there are ejected mass in the world.
    if (gameServer.nodesEjected.length > 0) {
        var index = Math.floor(Math.random() * 100) + 1;
        if (index <= gameServer.config.ejectSpawnPlayer) {
            // Get ejected cell
            var index = Math.floor(Math.random() * gameServer.nodesEjected.length);
            var e = gameServer.nodesEjected[index];

            // Remove ejected mass
            gameServer.removeNode(e);

            // Inherit
            pos = {x: e.position.x, y: e.position.y};
            startMass = e.mass;

            var color = e.getColor();
            player.setColor({
                'r': color.r,
                'g': color.g,
                'b': color.b
            });
        }
    }
    
    // Spawn player
    gameServer.spawnPlayer(player,pos,startMass);
}

FFA.prototype.updateLB = function(gameServer) {
    var lb = gameServer.leaderboard;
    // Loop through all clients
    for (var i = 0; i < gameServer.clients.length; i++) {
        if (typeof gameServer.clients[i] == "undefined") {
            continue;
        }

        var player = gameServer.clients[i].playerTracker;
        var playerScore = player.getScore(true);
        if (player.cells.length <= 0) {
            continue;
        }

        if (lb.length == 0) {
            // Initial player
            lb.push(player);
            continue;
        } else if (lb.length < gameServer.config.gameLBlength) {
            this.leaderboardAddSort(player,lb);
        } else {
            // 10 in leaderboard already
            if (playerScore > lb[gameServer.config.gameLBlength - 1].getScore(false)) {
                lb.pop();
                this.leaderboardAddSort(player,lb);
            }
        }
    }

    this.rankOne = lb[0];

    // Check win condition if enabled (only when leaderboard is full)
    if (gameServer.config.ffaWinMultiplier > 0 && lb.length >= gameServer.config.gameLBlength) {
        var firstPlayer = lb[0];
        var firstScore = firstPlayer.getScore(true);

        // Check if first player meets minimum score requirement
        if (gameServer.config.ffaMinWinScore > 0 && firstScore < gameServer.config.ffaMinWinScore) {
            return; // First player hasn't reached minimum score yet
        }

        // Calculate total score of all other players (not just leaderboard)
        var othersTotal = 0;
        for (var i = 0; i < gameServer.clients.length; i++) {
            if (typeof gameServer.clients[i] == "undefined") {
                continue;
            }
            var player = gameServer.clients[i].playerTracker;
            if (player !== firstPlayer && player.cells.length > 0) {
                othersTotal += player.getScore(true);
            }
        }

        // Check if first player wins
        if (othersTotal > 0 && firstScore > othersTotal * gameServer.config.ffaWinMultiplier) {
            var winnerName = firstPlayer.getName() || "An unnamed cell";
            var winMessage = "🏆 玩家 " + winnerName + " 获得胜利！分数：" + Math.floor(firstScore);

            // Create a fake sender object for server/admin message
            var serverSender = {
                getName: function() { return "SERVER"; },
                cells: [{
                    getColor: function() { return {r: 255, g: 215, b: 0}; } // Gold color
                }]
            };

            // Broadcast win message to all clients
            var Packet = require('../packet');
            var chatPacket = new Packet.Chat(serverSender, winMessage);
            for (var i = 0; i < gameServer.clients.length; i++) {
                if (gameServer.clients[i] && gameServer.clients[i].sendPacket) {
                    gameServer.clients[i].sendPacket(chatPacket);
                }
            }

            // Disconnect the winner after a brief delay
            setTimeout(function() {
                if (firstPlayer.socket && firstPlayer.socket.close) {
                    firstPlayer.socket.close(1000, 'Victory!');
                }
            }, 2000);
        }
    }
};
