const fs = require('node:fs');
const search = require('./search');

module.exports = {
    plain(filename) {
        return fs.readFileSync(filename,'utf8').toLowerCase().replaceAll('\r','').split('\n');
    },
    async alive(filename) {
        return (await this.searched(filename)).filter(e => e.alive).map(e => e.name);
    },
    async ostracized(filename) {
        return (await this.searched(filename)).filter(e => !e.alive).map(e => e.name);
    },
    async searched(filename) {
        return await search(this.plain(filename));
    }
}