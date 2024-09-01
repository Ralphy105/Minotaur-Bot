const updateVoteState = require('../updateVoteState');
const resetVoted = require('../resetVoted');
const updateWhitelist = require('../parseWhitelist');
const prune = require('../prunePrivate');

module.exports = async (client) => {
    console.log(`Hourly jobs starting at ${Date()}`);
    resetVoted(); // async
    updateWhitelist(true); // async
    prune('targets.txt', true); // async
    prune('globalTargets.txt', true);
    updateVoteState(client);
    
    const { playersRemaining } = await fetch('https://irk0p9p6ig.execute-api.us-east-1.amazonaws.com/prod/stats');
    const msg = `Players Remaining: ${playersRemaining}`;
    console.log(msg);
    client.emit('log', msg, true, 'Players Remaining')
};