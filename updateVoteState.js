const fs = require('node:fs');
const configFileName = './config.json';
const config = require(configFileName)

module.exports = async (client) => {
    if (client.voteState == 'Schedule') {
        const schedule = fs.readFileSync('scheduledTargets.txt','utf-8').toLowerCase().split('\n');
        schedule.splice(0, 1);
        fs.writeFile('scheduledTargets.txt', schedule.join('\r\n'), err => {
            if (err) console.log(`IMPORTANT: Failed to update target schedule: ${err.message}`);
        });
    }

    const next = client.nextVoteState;

    if (client.voteState != next) {
        console.log(`Vote State switching to: ${next}`);
        client.voteState = next;
        config.startupVoteState = next;

        fs.writeFile(configFileName, JSON.stringify(config, null, 4), (err) => {
            if (err) console.log(`Error while writing to config.json: ${err}`);
        });
    } else {
        console.log(`Vote State remaining as: ${next}`);
    }
}