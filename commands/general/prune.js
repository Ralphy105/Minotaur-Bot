const { SlashCommandBuilder } = require('discord.js');
const search = require('../../search');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prune')
        .setDescription('Returns which names are alive, and which are either ostracized or invalid.')
        .addStringOption(option => option.setName('venmos').setDescription('Please enter exact MPV usernames separated ONLY by commas (no added whitespace)').setRequired(true)),
    async execute(interaction) {
        const venmos = await search(interaction.options.getString('venmos').toLowerCase().split(','));
        const alive = venmos.filter(e => e.alive).map(e => e.name);
        const invalid = venmos.filter(e => !e.alive).map(e => e.name);

        const aliveStr = `\`${alive.join('`\n`')}\``;
        const invalidStr = `\`${invalid.join('`\n`')}\``;

        await interaction.reply(`The following names are alive in the game:\n${aliveStr}\n\nThe following names are either ostracized or invalid:\n${invalidStr}`);
    }
};