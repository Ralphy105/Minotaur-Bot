const { MongoClient } = require('mongodb');
const { connectURI } = require('./config.json');
const search = require('./search');

module.exports = async (refresh) => {
    const mongo = new MongoClient(connectURI);
    try {
        await mongo.connect();
        const whitelistCol = mongo.db('Minotaur').collection('Whitelist');

        const cursor = whitelistCol.find({ostracized: false});

        const oldWhitelist = [];
        for await (const member of cursor) {
            oldWhitelist.push(member.vName);
        }

        if (!refresh) {
            return oldWhitelist;
        } else {
            console.log('Updating Whitelist');
            const results = await search(oldWhitelist)

            const ostracized = results.filter(e => !e.alive);

            const promises = [];
            for (const venmo of ostracized) {
                promises.push(whitelistCol.updateOne({vName: venmo}, {$set: {ostracized: true}}));
            }

            await Promise.allSettled(promises);

            const whitelist = results.filter(e => e.alive).map(e => e.name);

            return whitelist;
        }
    } catch (e) {
        console.log(`Failed to connect to whitelist in mongo: ${e}`);
    } finally {
        await mongo.close();
    }
};

if (process.argv[2] == 'true') {
    module.exports(true).then(console.log);
}