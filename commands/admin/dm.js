const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const { connectURI } = require('../../config.json');
const fs = require('node:fs');

const authorized = [
    '333592723166724106', // Ralphy
    '731940787771932694', // My alt
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Sends DMs to Minotaur members'),
    async execute(interaction) {
        const id = interaction.user.id;

        if (!authorized.includes(id)) {
            await interaction.reply({content: 'You are not authorized to use this command!', ephemeral: true});
            return;
        }

        const minotaur = await interaction.client.guilds.fetch('1255539802582028349');

        const members = await minotaur.members.fetch().catch(console.error);
        const avIds = fs.readFileSync('./ostracizedVoters.txt','utf8').toLowerCase().split('\r\n');
        let sent = 0;
        let memberCount = 0;

        await interaction.deferReply();

        const mongo = new MongoClient(connectURI);
        try {
            await mongo.connect();

            const autovoterCollection = mongo.db('Minotaur').collection('Autovoters');
            const avs = autovoterCollection.find({active: true});

            for await (const av of avs) {
                avIds.push(av.discordId);
            }

            for await (const [id, member] of members) {
                if (member.user.bot) continue;
                memberCount++;
                const name = member.user.displayName;
                const title = `Dear ${name}, valued member of Minotaur :heart:`;
                const output = `The leaders of Minotaur and allied servers take great pride in our undying loyalty to our members. However, our ability to defend you is tied intimately to members' participation in our automated voting system. :raised_hands:\nI noticed that you have not yet signed up to Minotaur's, and I'm inviting you to help boost our ability to defend each other! :crossed_swords:\n\nPlease, consider signing up! **We are currently facing a massive threat of ~350 votes.** Every vote we gain makes a difference!\n*It guarantees you a larger portion of the winnings, as well.* :eyes:\n\n\\- Minotaur :robot:\n\nDm <@333592723166724106> with questions or concerns!`;

                if (!avIds.includes(id) && !member.roles.cache.get('1256352789307588638')) {
                    try {
                        await member.send({embeds: [new EmbedBuilder().setColor(0x2b2d31).setTitle(title).setDescription(output)]});
                        console.log(`Sent to ${memberCount}: ${name} -- ${id}`);
                        sent++;
                    } catch (e) {
                        console.log(`Failed to message user ${id}: ${name}`);
                    }
                }
            }
            await interaction.editReply(`Successfully sent ${sent} messages out of ${memberCount - avIds.length} non-bot non-autovoters`);
        } catch (e) {
            console.error(e);
            await interaction.editReply(`An error occurred, sent message to ${sent} out of ${memberCount - avIds.length} non-bot non-autovoters.`);
        } finally {
            await mongo.close();
        }
    }
}