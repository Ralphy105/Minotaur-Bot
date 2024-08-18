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
    '456887123199524876' // 0100
];

const filename = 'scheduledTargets.txt';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('View or edit the vote schedule!')
        .addSubcommand(subcommand => subcommand
            .setName('view')
            .setDescription('View the schedule')
        ).addSubcommand(subcommand => subcommand
            .setName('edit')
            .setDescription('Edit the schedule')
            .addStringOption(option =>
                option.setName('action')
                    .setRequired(true)
                    .setDescription('Add or Remove targets from the schedule!')
                    .addChoices(
                        { name: 'Add', value: 'add' },
                        { name: 'Remove', value: 'remove' }
            ))
            .addStringOption(option => option.setName('targets').setDescription('Please enter exact MPV usernames separated ONLY by commas (no added whitespace)').setRequired(true))
        ).addSubcommand(subcommand => subcommand
            .setName('clear')
            .setDescription('Empty the schedule')
        ),
    async execute(interaction) {
        const id = interaction.user.id.toString();

        if (!authorized.includes(id)) {
            await interaction.reply({content: 'You are not authorized to use this command!', ephemeral: true});
            console.log(`Unauthorized user tried to use target: ${interaction.user.username} or ${interaction.user.displayName}`);
            return;
        }

        const schedule = fs.readFileSync(filename, 'utf-8').split('\r\n');
        const sc = interaction.options.getSubcommand();
        switch(sc) {
            case 'view':
                const time = new Date();
                const timestamped = schedule.map(e => {
                    const hour = time.getUTCHours();
                    const str = `**${time.getUTCMonth()+1}/${time.getUTCDate()}, ${hour}:00 GMT:** \`${e}\``;
                    time.setUTCHours(hour + 1);
                    return str;
                });
                const output = timestamped.join('\n');
                await interaction.reply(output);
                break;
            case 'edit':
                await interaction.deferReply();
                let input = await interaction.options.getString('targets').toLowerCase().split(',');
                try {
                    input = await search(input);
                    const alive = input.filter(e => e.alive && !schedule.includes(e.name)).map(e => e.name);
                    const invalid = input.filter(e => !e.alive).map(e => e.name);
                    const alreadyIn = input.filter(e => schedule.includes(e.name)).map(e => e.name);

                    const aliveStr = `${alive.join(',')}`;
                    const alreadyInStr = `${alreadyIn.join(',')}`;
                    const invalidStr = `${invalid.join(',')}`;

                    if (interaction.options.getString('action') == 'add' ) {
                        let output = '';
                        if (aliveStr != '') {
                            output += `Successfully added the following names to the schedule:\n\`${aliveStr}\`\n`;
                            const addNames = alive.join('\r\n');
                            fs.appendFileSync(filename, '\r\n'+addNames);

                            const msg = `User ${interaction.user.username} successfully added ${aliveStr}`;
                            console.log(msg);
                            interaction.client.emit('log', msg, true, 'Schedule');
                        }
                        if (alreadyInStr != '') {
                            output += `These names were already in the schedule:\n\`${alreadyInStr}\`\n`;
                        }
                        if (invalidStr != '') {
                            output += `These names are either ostracized or invalid:\n\`${invalidStr}\``;
                        }
                        await interaction.editReply(output);
                    } else {
                        const result = schedule.filter(e => !alreadyIn.includes(e)).join('\r\n');
                        fs.writeFileSync(filename, result);

                        let output = '';
                        if (alreadyInStr != '') {
                            output += `Successfully removed the following names from the schedule:\n\`${alreadyInStr}\`\n`;

                            const msg = `User ${interaction.user.username} successfully removed ${alreadyInStr}`;
                            console.log(msg);
                            interaction.client.emit('log', msg, true, 'Schedule');
                        }
                        if (aliveStr != '') {
                            output += `These names weren't in the schedule:\n\`${aliveStr}\`\n`;
                        }
                        if (invalidStr != '') {
                            output += `These names are either ostracized or invalid:\n\`${invalidStr}\``;
                        }
                        await interaction.editReply(output);
                    }
                } catch (e) {
                    console.error(e);
                    interaction.client.emit('log', `Unknown /schedule error: ${e}`, true, 'Command Error');
                    await interaction.editReply({content: 'Invalid input detected. Names must be at least 3 characters long, and in quoteless CSV format: `like,this,example`\nIf your input was correct, please message <@333592723166724106>', ephemeral: true});
                }
                break;
            case 'clear':
                fs.writeFileSync(filename, '');
                await interaction.reply('Successfully emptied the schedule!');
                break;
            default:
                const msg = `Invalid /schedule subcommand: ${sc} by ${interaction.user}`;
                interaction.client.emit('log', msg, true, 'Command Error');
                return;
        }
    }
}