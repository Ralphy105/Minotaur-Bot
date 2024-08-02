const { MongoClient } = require('mongodb');
const { connectURI } = require('./config.json');

module.exports = async venmo => {
    const mongo = new MongoClient(connectURI);
    try {
        await mongo.connect();
        const whitelistCol = mongo.db('Minotaur').collection('Whitelist');

        const user = await whitelistCol.findOne({vName: venmo, ostracized: false});

        return user;
    } catch (e) {
        console.log(`Failed to connect to whitelist in mongo: ${e}`);
    } finally {
        await mongo.close();
    }
};