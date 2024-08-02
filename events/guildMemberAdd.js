const { Events } = require('discord.js');
const { MongoClient } = require('mongodb');
const { connectURI } = require('../config.json');

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(member) {
        if (member.guild.id != '1255539802582028349' && member.guild.id != '1264811027971706982') return;
        try {
            // console.log(`New Member Joined ${member.guild.name}: ${member.user.username} : ${member.id}`);

            const search = await fetch(`https://irk0p9p6ig.execute-api.us-east-1.amazonaws.com/prod/players?type=ostracize&quantity=11917&startIndex=0&reversed=true`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
            });
        
            const response = await search.json();
        
            const arr = response.players;
            
            const mongo = new MongoClient(connectURI);
            try {
                await mongo.connect();
                
                const whitelist = mongo.db('Minotaur').collection('Whitelist');
                const whitelistCursor = whitelist.find();
                const protected = [];

                for await (const user of whitelistCursor) {
                    protected.push(user.vName);
                }

                const diff = arr.map(guy => guy.username).filter(x => !protected.includes(x));

                const i = Math.floor(Math.random() * arr.length);

                const name = diff[i];

                // console.log(`Setting ${member.user.username}'s nickname to ${name}`);

                await member.setNickname(name, 'Nickname randomization');
            } catch (e) {
                console.log(`Failed to set nickname of ${member.user.username} cuz mongo: ${e}`);
            } finally {
                await mongo.close();
            }
        } catch (e) {
            console.log(`Failed to change their nickname, because ${e}`);
        }
	},
};