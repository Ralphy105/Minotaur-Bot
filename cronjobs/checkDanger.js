const fs = require('node:fs');
const parseWhitelist = require('../parseWhitelist');

module.exports = async (client) => {
    let names;
    try {
        names = await fetch(`https://irk0p9p6ig.execute-api.us-east-1.amazonaws.com/prod/players?type=ostracize&quantity=6&startIndex=0&reversed=true`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        });
    } catch (e) {
        console.log(`Check danger failed: ${e.message}`);
    }

    const voteNumber = Math.ceil((Date.now().valueOf()-1719511200000)/3600000);

    names = await names.json();
    names = names.players;

    let members = parseWhitelist();
    let i = 0;
    const danger = [];
    const target = [];
    const last = names.splice(5)[0];

    for (const user of names) {
        i++;
        
        const name = user.username;

        if (members.includes(name)) {
            danger.push({pos: i, name: name});
        } else {
            target.push({pos: i, name: name});
        }
    }
    target.push({pos: 6, name: last.username});

    const guild = client.guilds.cache.get('1255539802582028349');
    const channel = guild.channels.cache.get('1256113733198024745');

    if (danger.length) {
        await channel.send(`Vote Number ${voteNumber}: A protected member/ally is in danger! Please vote to ostracize \`${target[0].name}\`\n@everyone`);
        console.log(`Members on the leaderboard: `,danger);
    } else {
        console.log(`No protected users in top 5, at ${Date()}`);
    }
};