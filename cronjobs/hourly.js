const updateVoteState = require('../updateVoteState');
const resetVoted = require('../resetVoted');
const updateWhitelist = require('../parseWhitelist');

module.exports = async (client) => {
    console.log(`Hourly jobs starting at ${Date()}`);
    updateVoteState(client);
    await resetVoted();
    await updateWhitelist(true);
};