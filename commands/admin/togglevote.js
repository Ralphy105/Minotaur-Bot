const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder } = require('discord.js');
const fs = require('node:fs');

const authorized = [
    '333592723166724106', // Ralphy
    '570373756015345686', // Reina
    '642953947191181322', // Bluee
    '817805515349295154', // Robin
    '218074802835947531', // Tropical
    '731940787771932694', // My alt
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('togglevote')
        .setDescription('Toggle between automatic voting and scheduled votes from a list. Changes apply each hour.'),
    async execute(interaction) {

        const client = interaction.client;

        const id = interaction.user.id;

        if (!authorized.includes(id)) {
            await interaction.reply({content: 'You are not authorized to use this command!', ephemeral: true});
            console.log(`Unauthorized user tried to use togglevoter: ${interaction.user.username} or ${interaction.user.displayName}`);
            return;
        }

        const current = `Current Setting: ${client.voteState}`;

        const algorithmEmbed = new EmbedBuilder()
            .setColor(0x00e67e)
            .setTitle(`Next Hour's Setting: Selection Algorithm`)
            .setDescription('Selects the voting target through an algorithm based on the target list, the protected venmos list, and the current MPV leaderboard.')
            .setFooter({text: current});

        const listEmbed = new EmbedBuilder()
            .setColor(0x00d1bd)
            .setTitle(`Next Hour's Setting: Schedule`)
            .setDescription('Follows a schedule of voting targets, moving on to the next target each hour regardless of the vote outcome.')
            .setFooter({text: current});

        const toggleButton = new ButtonBuilder()
            .setCustomId('toggle')
            .setLabel('Toggle Target Mode')
            .setStyle(ButtonStyle.Success);

        const buttonRow = new ActionRowBuilder().setComponents(toggleButton);

        let reply;
        if (client.nextVoteState == 'Selection Algorithm') {
            reply = {embeds: [algorithmEmbed], components: [buttonRow]};
        } else {
            reply = {embeds: [listEmbed], components: [buttonRow]};
        }

        const menu = await interaction.reply(reply);

            const collector = menu.createMessageComponentCollector({ time: 20_000 });

            // SETTINGS INTERACTION HANDLING
            collector.on('collect', async listener => {
                if (listener.user.id != interaction.user.id) {
                    await listener.reply({content: `You can't interact with someone else's command!`, ephemeral: true});
                    return;
                }

                if (listener.isButton()) {
                    if (client.nextVoteState == 'Selection Algorithm') {
                        client.nextVoteState = 'Schedule';
                        await listener.update({embeds: [listEmbed]});
                    } else if (client.nextVoteState == 'Schedule') {
                        client.nextVoteState = 'Selection Algorithm';
                        await listener.update({embeds: [algorithmEmbed]});
                    } else {
                        const msg = `Invalid nextVoteState error: ${client.nextVoteState}`;
                        console.log(msg);
                        await listener.followUp({content: msg+'\nPlease try again later, or notify <@333592723166724106>.', ephemeral: true});
                    }
                } else {
                    console.error(`Unhandled settings interaction was received: ${listener.customId}`);
                }
            });
    }
}