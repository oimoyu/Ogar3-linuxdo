// Project imports
var BotPlayer = require('./BotPlayer');
var FakeSocket = require('./FakeSocket');
var PacketHandler = require('../PacketHandler');

function BotLoader(gameServer) {
    this.gameServer = gameServer;
    this.loadNames();
}

module.exports = BotLoader;

BotLoader.prototype.getName = function() {
    var name = "";

    // Priority names list (anime characters)
    var priorityNames = ["高松灯", "长崎素世", "千早爱音", "椎名立希", "丰川祥子", "平泽唯", "秋山澪", "田井中律", "琴吹紬", "中野梓"];

    // First use priority names
    if (priorityNames.length > 0 && this.priorityIndex < priorityNames.length) {
        name = priorityNames[this.priorityIndex];
        this.priorityIndex++;
    }
    // Then use random names from file
    else if (this.randomNames.length > 0) {
        var index = Math.floor(Math.random() * this.randomNames.length);
        name = this.randomNames[index].replace('\r','');
        this.randomNames.splice(index,1);
    }
    // Finally use numbered names
    else {
        name = "bot" + ++this.nameIndex;
    }

    return "[BOT] " + name;
};

BotLoader.prototype.loadNames = function() {
    this.randomNames = [];
    this.priorityIndex = 0; // Initialize priority name index
    // Load names
    try {
        var fs = require("fs"); // Import the util library
        // Read and parse the names - filter out whitespace-only names
        this.randomNames = fs.readFileSync("./botnames.txt", "utf8").split("\n");
    } catch (e) {
        // Nothing, use the default names
    }
    this.nameIndex = 0;
};

BotLoader.prototype.addBot = function() {
    var s = new FakeSocket(this.gameServer);
    s.playerTracker = new BotPlayer(this.gameServer, s);
    s.packetHandler = new PacketHandler(this.gameServer, s);

    // Add to client list
    this.gameServer.clients.push(s);

    // Add to world
    s.packetHandler.setNickname(this.getName());
};
