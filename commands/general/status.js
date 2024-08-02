const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const { connectURI } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('View the current information regarding your registered account.'),
    async execute(interaction) {

        const id = interaction.user.id;

        let venmo;
        const client = new MongoClient(connectURI);
        try {
            await client.connect();

            const db = client.db('Minotaur');
            const protectedUser = await db.collection('Whitelist').findOne({discordId: id});
            const av = await db.collection('Autovoters').findOne({discordId: id});

            if (!protectedUser) {
                venmo = 'You are not protected!';
            } else {
                venmo = `Enrolled as \`${protectedUser.vName}\``;
            }

            if (!av) {
                await interaction.reply({content: `You're not signed up for automated voting! To do so, send me a DM with the command \`/autovote signup\`!\n\nMember Protection Status: ${venmo}`, ephemeral: true});
                return;
            }

            const output = `Status Report for User ${interaction.user}:\n\nCurrently submitted info:\nEmail: \`${av.email}\`\nPassword: \`${av.password}\`\n\nValid Login Credentials? \`${av.validInfo}\`\nAutovoted This Hour (to ostracize)? \`${av.hasVoted}\`\n\nSettings:\nDM User on Vote? \`${av.dmVoter}\`\n\nMember Protection Status: ${venmo}`;

            if (interaction.inGuild()) {
                await interaction.reply({content: `For a permanent message response, use this command in <@1258277794257829948>'s DMs!`, embeds: [new EmbedBuilder().setColor(0x2b2d31).setDescription(output)], ephemeral: true});
            } else {
                await interaction.reply({embeds: [new EmbedBuilder().setColor(0x2b2d31).setDescription(output)]});
            }
        }
        catch (e) {
            console.error(e);
            const msg = 'An unknown error occurred while processing the command. Please notify <@333592723166724106> if the error persists.';
            if (!interaction.replied) {
                await interaction.reply({ content: msg, ephemeral: true});
            } else {
                await interaction.editReply({ content: msg, embeds: []});
            }
        } finally {
            await client.close();
        }
    }
}