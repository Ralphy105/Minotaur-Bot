const fs = require('node:fs');
const { MongoClient } = require('mongodb');
const { connectURI } = require('./config.json');

module.exports = async (client) => {
    const mongo = new MongoClient(connectURI);
    try {
        await mongo.connect();
        const bot = mongo.db('Minotaur').collection('Bot');
        if (client.voteState == 'Schedule') {
            const schedule = fs.readFileSync('scheduledTargets.txt','utf-8').toLowerCase().split('\r\n');
            schedule.splice(0, 1);
            fs.writeFile('scheduledTargets.txt', schedule.join('\r\n'), err => {
                if (err) console.log(`IMPORTANT: Failed to update target schedule: ${err.message}`);
            });
        }

        const next = client.nextVoteState;

        if (client.voteState != next) {
            const msg = `Vote State switching to: ${next}`;
            console.log(msg);
            client.emit('log', msg, true);
            client.voteState = next;
            await bot.updateOne({}, {$set: {voteState: next}});
        } else {
            const msg = `Vote State remaining as: ${next}`;
            console.log(msg);
            client.emit('log', msg, true);
        }
    } catch (e) {
        console.error(e);
        client.emit('log', `Error: ${e}`, true, 'Update Vote State');
    }
}