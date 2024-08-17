const { SlashCommandBuilder } = require('discord.js');
const checkWhitelist = require('../../checkWhitelist');
const search = require('../../search');
const runVotes = require('../../runVotes')

const authorized = [
    '333592723166724106', // Ralphy
    '570373756015345686', // Reina
    '642953947191181322', // Bluee
    '817805515349295154', // Robin
    '218074802835947531', // Tropical
    '731940787771932694', // My alt
    '884706249676046367', // Gojo
    '786486464120750130', // Kin
    '691797791512461343', // Notaspy
    '1256440832727191636', // Gem
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendvotes')
        .setDescription('Immediately sends votes out. Use with caution.')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('type of vote to send')
                .setRequired(true)
                .addChoices(
                    { name: 'Ostracize', value: 'ostracize' },
                    { name: 'Elect', value: 'elect' }
                ))
        .addStringOption(option => option.setName('target').setDescription('Vote directly for a player')),
    async execute(interaction) {
        const id = interaction.user.id;

        if (!authorized.includes(id)) {
            await interaction.reply({content: 'You are not authorized to use this command!', ephemeral: true});
            console.log(`Unauthorized user tried to use sendvotes: ${interaction.user.username} or ${interaction.user.displayName}`);
            return;
        }

        const type = await interaction.options.get('type').value;
        const target = await interaction.options.getString('target');

        if (target) {
            const alive = await search(target);

            if (!alive) {
                await interaction.reply(`User ${target} is either ostracized or doesn't exist!`);
                return;
            }

            const protected = await checkWhitelist(target);
            if (protected) {
                await interaction.reply({content: `They are on the whitelist!`, ephemeral: true});
                return;
            }

        }
        await interaction.reply('Attempting to send votes now!');

        await runVotes(interaction.client, type, target);
    }
}