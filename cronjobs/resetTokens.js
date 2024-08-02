const getToken = require('../getToken');
const { MongoClient } = require('mongodb');
const { connectURI } = require('../config.json');

module.exports = async () => {
    const mongo = new MongoClient(connectURI);
    try {
        await mongo.connect();

        const avCollection = mongo.db('Minotaur').collection('Autovoters');

        const avs = avCollection.find({$or: [{validInfo: true}, {validInfo: 'Untested'}]});

        for await (const av of avs) {
            const id = av.discordId;
            try {
                const token = await getToken(id, av.email, av.password);
                await avCollection.updateOne({discordId: id}, {$set: {validInfo: true, token: token}});
            } catch (e) {
                console.log(`resetTokens: Couldn't get token for user ${id}\nError: ${e.stack}`);
        
                if (e.message.includes('LOGIN FAIL')) {
                    await avCollection.updateOne({discordId: id}, {$set: {validInfo: false}});
                }
            }
        }
    } catch (e) {
        console.log(`IMPORTANT: resetTokens fail. Mongo Error: ${e}`);
    } finally {
        await mongo.close();
    }
};