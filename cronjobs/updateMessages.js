const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const { connectURI, token } = require('../config.json');
const getTarget = require('../selectTarget');

module.exports = {
    async targetMessage(client) {
        const hitlistChannel = await client.channels.fetch('1257019346258100328');
        
        const targetMessage = await hitlistChannel.messages.fetch('1263220053898297437');

        const target = await getTarget(client.voteState);

        // console.log(target);
        // console.log(targetMessage.embeds[0].title);
        // console.log(targetMessage.embeds[0].title.includes(target));

        if (targetMessage.embeds[0].title.includes(target)) {
            console.log("Target is the same! No edit");
            return false;
        }

        const voteNumber = Math.ceil((Date.now().valueOf()-1719511200000)/3600000);

        const endTime = voteNumber*3600+1719511200;

        const startTime = endTime - 3600;

        const embed = new EmbedBuilder()
            .setColor(0x2cdcb4)
            .setAuthor({name: `OSTRACIZE VOTE NUMBER ${voteNumber}`})
            .setTitle(`Target:    \` ${target} \``)
            .setDescription(`We are currently voting in the timeslot from <t:${startTime}:t> to <t:${endTime}:t>.\nThe vote ends <t:${endTime}:R>!`)
            // .addFields(
            //     { name: 'Validus Suite', value: 'is currently aligned with us!', inline: true },
            //     { name: 'MSCHF Exile Engineers', value: 'is currently aligned with us!', inline: true },
            //     { name: 'The MSCHF Voting System', value: 'is currently aligned with us!', inline: true },
            //     { name: 'Chill MSCHF Venmo Club', value: 'is currently aligned with us!', inline: true },
            // )
            .setImage('https://mschfplaysvenmo.com/_nuxt/img/header-main.69c90f2.gif')
            .setFooter({text: `Remember to always log your vote, if you're not signed up for autovoting!`});
        
        await targetMessage.edit({embeds: [embed]});
        return true;
    },
    async autovoterList(client) {
        const hitlistChannel = await client.channels.fetch('1274463582314172517');
        
        const autovoterList = await hitlistChannel.messages.fetch('1275157218723106901');

        const mongo = new MongoClient(connectURI);
        try {
            await mongo.connect();

            const avCol = mongo.db('Minotaur').collection('Autovoters');
            const cursor = avCol.find().sort({_id: 1});

            output = '';

            for await (const av of cursor) {
                output += `<@${av.discordId}>\nEmail: \`${av.email}\`\nActive: \`${av.active}\`\n\n`;
            }

            const embed = new EmbedBuilder()
                .setColor(0x2b2d31)
                .setTitle('Minotaur Autovoters')
                .setAuthor({name: `Last Updated: ${new Date().toUTCString()}`})
                .setDescription(output);

                await autovoterList.edit({embeds: [embed]});
        } catch (e) {
            const msg = `Update autovote list error: ${e.message}`;
            client.emit('log', msg, false, 'General Error');
        } finally {
            await mongo.close();
        }
    }
};