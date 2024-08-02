const voter = require('./voter');
const { MongoClient } = require('mongodb');
const { connectURI } = require('./config.json');
const fs = require('node:fs');
const getTarget = require('./selectTarget');
const { EmbedBuilder } = require('discord.js');

module.exports = async (client, type, target, captchas) => {
    if (type != 'ostracize' && type != 'elect') {
        console.log("Attempted to run votes without a valid vote type.");
        return;
    }

    // target = 'clearlykay';
    if (!target) {
        target = await getTarget(client.voteState);
    }

    console.log(`Attempting to vote out ${target}`);

    const voteNumber = Math.ceil((Date.now().valueOf()-1719511200000)/3600000);

    const mongo = new MongoClient(connectURI);
    try {
        await mongo.connect();
        const avCollection = mongo.db('Minotaur').collection('Autovoters');
        const autovoters = avCollection.find({$or: [{deactivated: false}, {deactivated: {$exists: false}}]});
        let count = 0;
        let successes = 0;
        let invalids = 0;
        let alreadyVoted = 0;
        let captchaFails = 0;
        let ostracized = 0;
        const start = new Date();

        const votePromises = [];
        for await (const av of autovoters) {

            const promise = (async () => {
                const num = count++;
                const id = av.discordId;
                let token = av.token;
                const validInfo = av.validInfo;
                const hasVoted = av.hasVoted;
                const dmVoter = av.dmVoter;

                if (!token) {
                    if (!validInfo) {
                        invalids++;
                        return;
                    }
                    try {
                        token = await require('./getToken')(id, av.email, av.password);
                        await avCollection.updateOne({discordId: id}, {$set: {validInfo: true, token: token}});
                    } catch (e) {
                        console.log(`VOTE: Couldn't get token for user ${id}\nError: ${e.stack}`);

                        if (e.message.includes('LOGIN FAIL')) {
                            await avCollection.updateOne({discordId: id}, {$set: {validInfo: false}});
                            invalids++;
                        } else if (e.message.includes('CAPTCHA FAIL')) {
                            captchaFails++;
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
                    alreadyVoted++;
                    return;
                }

                let voted = await voter(id, token, target, type, (captchas ? captchas[count-1] : null));
                console.log(`Total time elapsed over ${num} vote attempts: ${(new Date()-start)/1000} seconds`);

                if (typeof voted == 'string' && voted.includes('CAPTCHA FAIL')) {
                    captchaFails++;
                    const voter = await client.users.fetch(id);
                    await voter.send(`VOTE #${voteNumber}: Sorry, the captcha service seems to be down right now. Unfortunately, this is out of my hands. Feel free to vote manually this hour, to **${type}** \`${target}\`, if there's enough time remaining.`);
                    return;
                }

                let tries = 0;
                // Retry if "Internal Server Error"
                while ((tries < 10) && typeof voted == 'string' && voted == "Internal server error") {
                    console.log(`Attempt #${++tries} after Internal Server Error`);
                    voted = await voter(id, token, target, type);
                }

                let output = `Vote Report #${voteNumber} for User <@${id}>:\nAttempting to **${type}** \`${target}\`\n\n`;
                const confused = 'If you are confused about the meaning of this, feel free to message <@333592723166724106>.';

                // UPDATE DB and BUILD DM RESPONSE
                if (voted === true) {
                    if (type == 'ostracize') {
                        await avCollection.updateOne({discordId: id}, {$set: {hasVoted: true}});
                    }

                    output += `Your vote was cast successfully!`;
                    successes++;
                }

                else if (voted.startsWith('vote/')) {
                    output += `Your token is valid, however your vote failed.`;

                    if (voted == 'vote/userAlreadyVoted') {
                        alreadyVoted++;
                        if (type == 'ostracize') {
                            await avCollection.updateOne({discordId: id}, {$set: {hasVoted: true}});
                        }
                        output += `\nReason: You already voted!`;
                    } else if (voted == 'vote/userOstracized') {
                        ostracized++;
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
            })();

            votePromises.push(promise);
        }

        await Promise.allSettled(votePromises);
        console.log(`Attempted ${count} votes, with ${invalids} accounts that have no token with invalid creds, and ${successes} successes!`);
    } catch (error) {
        console.log(`Failed to cast votes right now, because: ${error}`);
    } finally {
        await mongo.close();
    }

};