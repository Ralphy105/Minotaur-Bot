const { MongoClient } = require('mongodb');
const { connectURI } = require('./config.json');

async function resetVoted() {
    const mongo = new MongoClient(connectURI);
    try {
        await mongo.connect();
        const result = await mongo.db('Minotaur').collection('Autovoters').updateMany({ hasVoted: true }, { $set: { hasVoted: false } });
        console.log(`${result.modifiedCount} users' hasVoted reset to false.`);
    } catch (e) {
        console.log('Error accessing mongo: ', e);
    } finally {
        await mongo.close();
    }
}

module.exports = async () => resetVoted();

if (process.argv[2] == 'true') {
    resetVoted();
}