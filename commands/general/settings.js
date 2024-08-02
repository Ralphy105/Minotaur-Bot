const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType } = require('discord.js');
const { MongoClient } = require('mongodb');
const { connectURI } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Update your autovote settings.'),
    async execute(interaction) {
        const mongo = new MongoClient(connectURI);
        try {
            await mongo.connect();

            const avCollection = mongo.db('Minotaur').collection('Autovoters');

            const id = interaction.user.id;

            const user = await avCollection.findOne({discordId: id});

            const settingsMenu = new StringSelectMenuBuilder()
                .setCustomId('settings')
                .setPlaceholder('Choose a setting to update!')
                .addOptions(    
                    new StringSelectMenuOptionBuilder()
                        .setLabel('View List')
                        .setDescription('List of all settings')
                        .setValue('list')
                );
            const dmVoterSelection = new StringSelectMenuOptionBuilder()
                .setLabel('Message Me When Voting')
                .setDescription('Receive a DM when the bot votes for you')
                .setValue('dmVoter');
            if (user) {
                settingsMenu.addOptions(dmVoterSelection);
            }

            const listEmbed = new EmbedBuilder()
                .setColor(0x2cccb4)
                .setTitle('Settings Menu')
                .setDescription('All autovote user settings. Choose one to view/change using the select menu.\n')
                .addFields(
                    { name: 'Message Me When Voting', value: 'Toggle whether the bot DMs you a "Vote Report" message after sending a vote for you.' },
                    { name: 'More Settings to Come', value: '...' }
                );

            const settingsRow = new ActionRowBuilder().addComponents(settingsMenu);

            const menu = await interaction.reply({embeds: [listEmbed], components: [settingsRow]});

            const collector = menu.createMessageComponentCollector({ time: 60_000 });

            // SETTINGS INTERACTION HANDLING
            collector.on('collect', async listener => {
                if (listener.user.id != interaction.user.id) {
                    await listener.reply({content: `You can't interact with someone else's settings!`, ephemeral: true});
                    return;
                }

                await mongo.connect();

                if (listener.isStringSelectMenu()) {
                    const buttonRow = new ActionRowBuilder();

                    switch (listener.values[0]) {
                        case 'list':
                            await listener.update({embeds: [listEmbed], components: [settingsRow]});
                            break;
                        case 'dmVoter':
                            const dmEmbed = new EmbedBuilder()
                                .setColor(0x00afb5)
                                .setTitle('Message Me When Voting')
                                .setDescription('The bot will DM (direct message) you a "Vote Report" message every time it sends a vote for you.\n\nThis setting is currently:')
                                .addFields({ name: user.dmVoter ? '\u2705 Enabled' : '\u274C Disabled', value: '\u200b'});
                            const enable = new ButtonBuilder()
                                .setCustomId('dmVoterDisable')
                                .setLabel('Disable')
                                .setStyle(ButtonStyle.Danger);
                            const disable = new ButtonBuilder()
                                .setCustomId('dmVoterEnable')
                                .setLabel('Enable')
                                .setStyle(ButtonStyle.Success);
                            buttonRow.addComponents(enable, disable);
                            await listener.update({embeds: [dmEmbed], components: [settingsRow, buttonRow]});
                            break;
                        default:
                            console.error(`Unhandled settings interaction was received: ${listener.customId}`);
                    }
                } else if (listener.isButton()) {
                    switch (listener.customId) {
                        case 'dmVoterEnable':
                            await avCollection.updateOne({discordId: id}, {$set: {dmVoter: true}});
                            user.dmVoter = true;
                            const dmEmbed = EmbedBuilder.from(listener.message.embeds[0]).setFields({ name: '\u2705 Enabled', value: '\u200b'});
                            await listener.update({embeds: [dmEmbed]});
                            break;
                        case 'dmVoterDisable':
                            await avCollection.updateOne({discordId: id}, {$set: {dmVoter: false}});
                            user.dmVoter = false;
                            const dmEmbed2 = EmbedBuilder.from(listener.message.embeds[0]).setFields({ name: '\u274C Disabled', value: '\u200b'});
                            await listener.update({embeds: [dmEmbed2]});
                            break;
                        default:
                            console.error(`Unhandled settings interaction was received: ${listener.customId}`);
                    }
                } else {
                    console.error(`Unhandled settings interaction was received: ${listener.customId}`);
                }
            });
        } catch (e) {
            console.error(e);
            const msg = 'An unknown error occurred while processing the command. Please notify <@333592723166724106> if the error persists.';
            if (!interaction.replied) {
                await interaction.reply({ content: msg, ephemeral: true});
            } else {
                await interaction.editReply({ content: msg, embeds: []});
            }
        } finally {
            await mongo.close();
        }
    }
}