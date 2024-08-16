const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');

const authorized = [
    '333592723166724106', // Ralphy
    '570373756015345686', // Reina
    '642953947191181322', // Bluee
    '817805515349295154', // Robin
    '218074802835947531', // Tropical
    '731940787771932694', // My alt
    '884706249676046367', // Gojo
];

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
        .addStringOption(option => option.setName('targets').setDescription('Enter target exactly. Use CSV format with quotes for multiple.').setRequired(true)),
    async execute(interaction) {
        const id = interaction.user.id.toString();

        if (!authorized.includes(id)) {
            await interaction.reply({content: 'You are not authorized to use this command!', ephemeral: true});
            console.log(`Unauthorized user tried to use target: ${interaction.user.username} or ${interaction.user.displayName}`);
            return;
        }

        await interaction.deferReply();

        const input = await interaction.options.getString('targets').toLowerCase();

        try {
            const single = input.includes(',')
            let names;

            if (!single) {
                names = [input];
            } else {
                names = input.split(',');
                names = names.map(name => name.trim()).map(name => name.substring(1,name.length-1));
            }

            const alreadyIn = [];
            const invalid = [];
            const alive = [];

            const targets = fs.readFileSync('targets.txt', 'utf8');

            for (const name of names) {
                const isAlive = await require('../../search.js')(name);
                const inList = targets.includes(name);

                if (isAlive) {
                    if (inList) {
                        alreadyIn.push(name);
                    } else {
                        alive.push(name);
                    }
                } else {
                    invalid.push(name);
                }
            }

            const aliveStr = `"${alive.join('","')}"`;
            const alreadyInStr = `"${alreadyIn.join('","')}"`;
            const invalidStr = `"${invalid.join('","')}"`;

            if (interaction.options.getString('action') == 'add' ) {
                let output = '';
                if (aliveStr != '""') {
                    output += `Successfully added the following names to the target list:\n\`${aliveStr}\`\n`;
                    console.log(`User ${interaction.user.username} successfully added ${aliveStr}`);
                    const addNames = alive.join('\r\n');
                    fs.appendFileSync('targets.txt', '\r\n'+addNames);
                }
                if (alreadyInStr != '""') {
                    output += `These names were already in the list:\n\`${alreadyInStr}\`\n`;
                }
                if (invalidStr != '""') {
                    output += `These names are either ostracized or invalid:\n\`${invalidStr}\``;
                }
                await interaction.editReply(output);
            } else {
                for (const name of alreadyIn) {
                    const namesArr = targets.split('\n');
                    namesArr.splice(namesArr.indexOf(name), 1);
                    const result = namesArr.join('\r\n');
                    fs.writeFile('targets.txt', result, async err => {
                        if (err) await interaction.editReply(`FileIO error occurred: ${err.message}`);
                    });
                }
                let output = '';
                if (alreadyInStr != '""') {
                    output += `Successfully removed the following names from the list:\n\`${alreadyInStr}\`\n`;
                    console.log(`User ${interaction.user.username} successfully removed ${alreadyInStr}`);
                }
                if (aliveStr != '""') {
                    output += `These names weren't in the list:\n\`${aliveStr}\`\n`;
                }
                if (invalidStr != '""') {
                    output += `These names are either ostracized or invalid:\n\`${invalidStr}\``;
                }
                await interaction.editReply(output);
            }
        } catch (e) {
            console.error(e);
            await interaction.editReply({content: 'Invalid input detected. Names must be at least 3 characters long, and in quote CSV format: `"like","this","example"`', ephemeral: true});
        }
    }
}