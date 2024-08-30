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
        const current = schedule[0];
        const sc = interaction.options.getSubcommand();
        switch(sc) {
            case 'view':
                let time = Math.floor(new Date().valueOf()/3600000)*3600;
                const timestamped = schedule.map(e => {
                    const str = `**<t:${time}:f>** \`${e}\``;
                    time += 3600;
                    return str;
                });
                
                let output = timestamped.join('\n');
                const ops = [];
                while (output.length > 2000) {
                    let temp = output.substring(0, 2000);
                    const n = temp.lastIndexOf('\n');
                    temp = temp.substring(0, n);
                    output = output.substring(n+1);
                    ops.push(temp);
                }
                ops.push(output);
                await interaction.reply(ops.splice(0, 1)[0]);
                for (const op of ops) {
                    await interaction.followUp(op);
                }
                break;
            case 'edit':
                await interaction.deferReply();
                let input = interaction.options.getString('targets').toLowerCase();
                if (input.indexOf('sex-haver-19') != -1) {
                    await interaction.editReply('Haha you thought L');
                    return;
                }
                input = [...new Set(input.split(','))];
                // const i = input.indexOf(current);
                // if (i != -1) {
                //     interaction.followUp(`The current target, ${current}, cannot be re-added or removed`);
                //     input.splice(i, 1);
                // }
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
                            let addNames = alive.join('\r\n');
                            if (current) addNames = `\r\n${addNames}`;
                            fs.appendFileSync(filename, addNames);

                            const msg = `${interaction.user} successfully added ${aliveStr}`;
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

                            const msg = `${interaction.user} successfully removed ${alreadyInStr}`;
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