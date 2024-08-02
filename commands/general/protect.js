const { SlashCommandBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const { connectURI } = require('../../config.json');
const search = require('../../search');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('protect')
        .setDescription('Enroll in the member protection system! Also makes you a verified member.')
        .addStringOption(option => option.setName('venmo').setDescription('Your exact Venmo username, without the @').setRequired(true)),
    async execute(interaction) {
        const inGuild = interaction.inGuild();
        const id = interaction.user.id;
        const username = interaction.user.username;
        const displayName = interaction.user.displayName;
        const venmo = interaction.options.getString('venmo').toLowerCase();

        const alive = await search(venmo);

        if (!alive) {
            await interaction.reply({content: `The venmo \`${venmo}\` is either ostracized or invalid. Please double check it and try again!`, ephemeral: inGuild});
            return;
        }

        const client = new MongoClient(connectURI);
        try {
            await client.connect();

            const whitelist = client.db('Minotaur').collection('Whitelist');

            const existing = await whitelist.findOne({discordId: id});

            // Adds one if none exists, because option {upsert: true}
            await whitelist.updateOne({discordId: id}, {$set: {vName: venmo, dName: username, dDisplayName: displayName}}, {upsert: true});

            const output = `You have been successfully ${existing ? 'updated within' : 'added to'} the system! You are now under official protection of Minotaur and the Northstar Accord.\nSubmitted username: \`${venmo}\``;
            await interaction.reply({content: output, ephemeral: inGuild});
            console.log(`${id}-- ${username} has protected!`);

            const guild = await interaction.client.guilds.cache.get('1255539802582028349'); // Minotaur
            const member = await guild.members.fetch(id);
            if (member) {
                const role = await guild.roles.cache.get('1255752940459917385');
                member.roles.add(role);
            }
        } catch (e) {
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
};