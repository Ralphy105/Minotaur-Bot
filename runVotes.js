const sendVote = require('./voter');
const { MongoClient } = require('mongodb');
const { connectURI } = require('./config.json');
const fs = require('node:fs');
const getTarget = require('./selectTarget');
const { EmbedBuilder } = require('discord.js');

const mongo = new MongoClient(connectURI);

module.exports = async (client, type, target, captchas) => {
    const start = new Date();
    console.log(`Starting runVotes at ${start}`);
    const voteNumber = Math.ceil((start.valueOf()-1719511200000)/3600000);

    const votePromises = [];

    const results = {
        successes: 0,
        invalids: 0,
        alreadyVoted: 0,
        captchaFails: 0,
        ostracized: 0
    }

    function votesOutput(count) {
        const msg = `Attempted ${count} votes to **${type}** \`${target}\`:\nSuccesses: ${results.successes}\nInvalid Creds: ${results.invalids}\nAlready Voted: ${results.alreadyVoted}\nCaptcha Fail: ${results.captchaFails}\nNewly Ostracized: ${results.ostracized}`;
        console.log(msg);
        client.emit('log', msg, true, 'Voting Record');
        return msg;
    }

    async function voteAndRespond(autovoter, target, avCollection, num, startedVotes) {
        const id = autovoter.discordId;
        let { token } = autovoter;
        const { hasVoted, dmVoter, validInfo } = autovoter;

        if (!token) {
            if (!validInfo) {
                results.invalids++;
                return;
            }
            try {
                token = await require('./getToken')(id, av.email, av.password);
                await avCollection.updateOne({discordId: id}, {$set: {validInfo: true, token: token}});
            } catch (e) {
                console.log(`VOTE: Couldn't get token for user ${id}\nError: ${e.stack}`);
    
                if (e.message.includes('LOGIN FAIL')) {
                    await avCollection.updateOne({discordId: id}, {$set: {validInfo: false}});
                    results.invalids++;
                } else if (e.message.includes('CAPTCHA FAIL')) {
                    results.captchaFails++;
                    try {
                        const voter = await client.users.fetch(id);
                        await voter.send(`VOTE #${voteNumber}: Sorry, the captcha service seems to be down right now. Unfortunately, this is out of my hands. Feel free to vote manually this hour, to **${type}** \`${target}\`, if there's enough time remaining.`);
                    } catch (e) {
                        console.log(`Failed to dm user ${id}: `, e);
                    }
                }
                return;
            }
        }
    
        if (type == 'ostracize' && hasVoted === true) {
            results.alreadyVoted++;
            return;
        }
        
        let voted = await sendVote(autovoter, target, type, (captchas ? captchas[num-1] : null));
        console.log(`Total time elapsed over ${num} vote attempts: ${(new Date()-startedVotes)/1000} seconds`);
    
        if (typeof voted == 'string' && voted.includes('CAPTCHA FAIL')) {
            results.captchaFails++;
            const voter = await client.users.fetch(id);
            await voter.send(`VOTE #${voteNumber}: Sorry, the captcha service seems to be down right now. Unfortunately, this is out of my hands. Feel free to vote manually this hour, to **${type}** \`${target}\`, if there's enough time remaining.`);
            return;
        }
    
        let tries = 0;
        // Retry if "Internal Server Error"
        while ((tries < 10) && typeof voted == 'string' && voted == "Internal server error") {
            console.log(`Attempt #${++tries} after Internal Server Error`);
            voted = await sendVote(autovoter, target, type, (captchas ? captchas[count-1] : null));
        }
    
        let output = `Vote Report #${voteNumber} for User <@${id}>:\nAttempting to **${type}** \`${target}\`\n\n`;
        const confused = 'If you are confused about the meaning of this, feel free to message <@333592723166724106>.';
    
        // UPDATE DB and BUILD DM RESPONSE
        if (voted === true) {
            if (type == 'ostracize') {
                await avCollection.updateOne({discordId: id}, {$set: {hasVoted: true}});
            }
    
            output += `Your vote was cast successfully!`;
            results.successes++;
        }
    
        else if (voted.startsWith('vote/')) {
            output += `Your token is valid, however your vote failed.`;
    
            if (voted == 'vote/userAlreadyVoted') {
                results.alreadyVoted++;
                if (type == 'ostracize') {
                    await avCollection.updateOne({discordId: id}, {$set: {hasVoted: true}});
                    client.emit('log', `User Already Voted: <@${id}>`, false, 'Vote Fail');
                }
                output += `\nReason: You already voted!`;
            } else if (voted == 'vote/userOstracized') {
                results.ostracized++;
                await avCollection.deleteOne({discordId: id});
                fs.appendFileSync('ostracizedVoters.txt', '\r\n'+id);
                return;
            }
    
            output += `\nError Message: \`${voted}\`\n\n${confused}`;
        }
        
        if (dmVoter) {
            try {
                const voter = await client.users.fetch(id);
                await voter.send({embeds: [new EmbedBuilder().setColor(0x2b2d31).setDescription(output)]});
            } catch (e) {
                console.log(`Failed to dm user ${id}: `, e);
            }
        }
    }
    
    if (type != 'ostracize' && type != 'elect') {
        console.log("Attempted to run votes without a valid vote type.");
        return;
    }

    try {
        await mongo.connect();
        const avCollection = mongo.db('Minotaur').collection('Autovoters');
        const avs = avCollection.find({ $and: [{active: true}, {validInfo: true}] }).sort({priortiy: -1, _id: 1});

        const autovoters = [];
        for await (const av of avs) {
            autovoters.push(av);
        }

        let count = 0;
        if (client.voteState == 'Ties' && !target) {
            const leaderboard = await fetch(`https://irk0p9p6ig.execute-api.us-east-1.amazonaws.com/prod/players?type=ostracize&quantity=11917&startIndex=0&reversed=true`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
            }).then(leaderboard => leaderboard.json()).then(leaderboard => leaderboard.players);

            const targets = fs.readFileSync('./targets.txt', 'utf-8').toLowerCase().split('\r\n');
            const globalTargets = fs.readFileSync('./globaltargets.txt', 'utf-8').toLowerCase().split('\r\n');

            let tieVotes = leaderboard[0].score;
            if (!globalTargets.includes(leaderboard[0].username) || !tieVotes) tieVotes++;

            const toVote = [];
            let votesLeft = autovoters.length;

            for (const { username, score } of leaderboard) {
                const votesNeeded = tieVotes - score;
                if (votesLeft < votesNeeded) break;

                if (!targets.includes(username)) continue;

                votesLeft -= votesNeeded;
                toVote.push({ venmo: username, voteCount: votesNeeded });

                if (toVote.length == targets.length) break;
            }

            const startedVotes = new Date();
            for (const { venmo, voteCount } of toVote) {
                for (let i = 0; i < voteCount; i++) {
                    const num = count++;
                    // console.log(`${autovoters[num].discordId} voting for ${venmo}`);
                    votePromises.push(voteAndRespond(autovoters[num], venmo, avCollection, num, startedVotes));
                }
            }
            const msg = `Sent votes at ${new Date() - start} ms:\n${toVote.map(({venmo, voteCount}) => `${voteCount}: \`${venmo}\``).join('\n')}`;
            console.log(msg);
            client.emit('log', msg, true);
        } else if (client.voteState != 'Off') {
            // target = 'clearlykay';
            if (!target) {
                target = await getTarget(client.voteState);
            }

            console.log(`Attempting to vote out ${target}`);

            const startedVotes = new Date();

            for (const av of autovoters) {
                const num = count++;
                votePromises.push(voteAndRespond(av, target, avCollection, num, startedVotes));
            }
        }

        await Promise.allSettled(votePromises);
        console.log(`Script took ${new Date() - start} ms`);

        return votesOutput(count);
    } catch (e) {
        const msg = `Some error while attempting to cast votes: ${e.message}`;
        client.emit('log', msg, true, 'Vote Error');
        console.log(msg, e);
    } finally {
        await mongo.close();
    }
};