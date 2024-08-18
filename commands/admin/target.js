const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const search = require('../../search');

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

const filename = 'targets.txt';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('target')
        .setDescription('Add a target to the list! Use CSV format, with quotes for multiple.')
        .addStringOption(option =>
            option.setName('action')
                .setRequired(true)
                .setDescription('Add or Remove targets from the list!')
                .addChoices(
                    { name: 'Add', value: 'add' },
                    { name: 'Remove', value: 'remove' }
                ))
        .addStringOption(option => option.setName('targets').setDescription('Please enter exact MPV usernames separated ONLY by commas (no added whitespace)').setRequired(true)),
    async execute(interaction) {
        const id = interaction.user.id.toString();

        if (!authorized.includes(id)) {
            await interaction.reply({content: 'You are not authorized to use this command!', ephemeral: true});
            console.log(`Unauthorized user tried to use target: ${interaction.user.username} or ${interaction.user.displayName}`);
            return;
        }

        await interaction.deferReply();

        const input = await interaction.options.getString('targets').toLowerCase().split(',');

        try {
            const targets = fs.readFileSync(filename, 'utf8');
            let names = await search(input);

            const alive = names.filter(e => e.alive && !targets.includes(e.name)).map(e => e.name);
            const invalid = names.filter(e => !e.alive).map(e => e.name);
            const alreadyIn = names.filter(e => targets.includes(e.name)).map(e => e.name);

            const aliveStr = `${alive.join(',')}`;
            const alreadyInStr = `${alreadyIn.join(',')}`;
            const invalidStr = `${invalid.join(',')}`;

            if (interaction.options.getString('action') == 'add' ) {
                let output = '';
                if (aliveStr != '') {
                    output += `Successfully added the following names to the target list:\n\`${aliveStr}\`\n`;
                    console.log(`User ${interaction.user.username} successfully added ${aliveStr}`);
                    const addNames = alive.join('\r\n');
                    fs.appendFileSync(filename, '\r\n'+addNames);
                }
                if (alreadyInStr != '') {
                    output += `These names were already in the list:\n\`${alreadyInStr}\`\n`;
                }
                if (invalidStr != '') {
                    output += `These names are either ostracized or invalid:\n\`${invalidStr}\``;
                }
                await interaction.editReply(output);
            } else {
                const result = targets.filter(e => !alreadyIn.includes(e)).join('\r\n');
                fs.writeFileSync(filename, result);

                let output = '';
                if (alreadyInStr != '') {
                    output += `Successfully removed the following names from the target list:\n\`${alreadyInStr}\`\n`;
                    console.log(`User ${interaction.user.username} successfully removed ${alreadyInStr}`);
                }
                if (aliveStr != '') {
                    output += `These names weren't in the list:\n\`${aliveStr}\`\n`;
                }
                if (invalidStr != '') {
                    output += `These names are either ostracized or invalid:\n\`${invalidStr}\``;
                }
                await interaction.editReply(output);
            }
        } catch (e) {
            console.error(e);
            await interaction.editReply({content: 'Invalid input detected. Names must be at least 3 characters long, and in quoteless CSV format: `like,this,example`\nIf your input was correct, please message <@333592723166724106>', ephemeral: true});
        }
    }
}