const fs = require('node:fs');
const userExists = require("./search");
const { MongoClient } = require('mongodb');
const { connectURI } = require('./config.json');
const checkWhitelist = require('./checkWhitelist');

module.exports = async (voteState) => {

    const mongo = new MongoClient(connectURI);
    try {
        await mongo.connect();
        const schedule = fs.readFileSync('scheduledTargets.txt','utf-8').toLowerCase().split('\r\n');

        const valid = schedule[0] != '' && !(await checkWhitelist(schedule[0]));
        
        if (voteState == 'Selection Algorithm' || !valid) {
            const ostracizeLeaderboard = await fetch(`https://irk0p9p6ig.execute-api.us-east-1.amazonaws.com/prod/players?type=ostracize&quantity=30&startIndex=0&reversed=true`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
            });

            const ostracizeLeaderboardJson = await ostracizeLeaderboard.json();
            const topTargets = ostracizeLeaderboardJson.players;
            const topFiveTargets = topTargets.slice(0,5); // Returns a NEW OBJECT of first 5 items of the arary -- doesn't alter calling object

            const targets = fs.readFileSync('targets.txt','utf-8').toLowerCase().split('\r\n');
        
            const protected = mongo.db('Minotaur').collection('Whitelist').find();
            const members = [];
            
            for await (const member of protected) {
                members.push(member.vName);
            }

            for (const target of topFiveTargets) {
                const name = target.username;

                const listed = targets.includes(name);
                const protected = members.includes(name);

                if (listed && !protected) {
                    console.log(`Selecting ${name} from the list of targets.`);
                    return name;
                }
            }
            // If none of the top 5 ostracize leaderboard players are in the target list, just select the top player that isn't protected, out of next 25.
            for (const target of topTargets) {
                const name = target.username;

                const protected = members.includes(name);

                if (!protected) {
                    console.log(`Selecting ${name} disregarding the list of targets.`);
                    return name;
                }
            }
        } else if (voteState == 'Schedule') {
            return schedule[0];
        } else if (voteState == 'Ties') {
            return 'Currently automating ostracize ties. Please do not vote.'
        } else if (voteState == 'Off') {
            return 'No target currently';
        } else {
            console.log(`No votes sent, invalid voteState: ${voteState}`);
        }
    } catch (e) {
        console.log('ERROR while getting targets: ', e)
    } finally {
        await mongo.close();
    }
}