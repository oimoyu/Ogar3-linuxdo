function KillFeed(type, name1, name2) {
    this.type = type; // 1 = kill, 2 = join
    this.name1 = name1;
    this.name2 = name2;
}

module.exports = KillFeed;

KillFeed.prototype.build = function() {
    var buf, name1 = this.name1 || '', name2 = this.name2 || '';
    if (this.type === 1) {
        buf = new Buffer(1 + 1 + 2 + name1.length * 2 + 2 + name2.length * 2);
        buf.writeUInt8(100, 0, true);
        buf.writeUInt8(1, 1, true);
        buf.writeUInt16LE(name1.length, 2, true);
        for (var i = 0; i < name1.length; i++) {
            buf.writeUInt16LE(name1.charCodeAt(i), 4 + i * 2, true);
        }
        var offset = 4 + name1.length * 2;
        buf.writeUInt16LE(name2.length, offset, true);
        offset += 2;
        for (var i = 0; i < name2.length; i++) {
            buf.writeUInt16LE(name2.charCodeAt(i), offset + i * 2, true);
        }
    } else if (this.type === 2) {
        buf = new Buffer(1 + 1 + 2 + name1.length * 2);
        buf.writeUInt8(100, 0, true);
        buf.writeUInt8(2, 1, true);
        buf.writeUInt16LE(name1.length, 2, true);
        for (var i = 0; i < name1.length; i++) {
            buf.writeUInt16LE(name1.charCodeAt(i), 4 + i * 2, true);
        }
    }
    return buf;
};
