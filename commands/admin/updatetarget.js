const { SlashCommandBuilder } = require('discord.js');

const authorized = [
    '333592723166724106', // Ralphy
    '570373756015345686', // Reina
    '642953947191181322', // Bluee
    '817805515349295154', // Robin
    '218074802835947531', // Tropical
    '731940787771932694', // My alt
    '884706249676046367', // Gojo
    '1102026521142636554', // Dread
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updatetarget')
        .setDescription('Updates the target message in the Minotaur server (if a new target was just added to the list)'),
    async execute(interaction) {
        const id = interaction.user.id;

        if (!authorized.includes(id)) {
            await interaction.reply({content: 'You are not authorized to use this command!', ephemeral: true});
            console.log(`Unauthorized user tried to use updatetarget: ${interaction.user.username} or ${interaction.user.displayName}`);
            return;
        }

        await interaction.deferReply();

        const update = await require('../../cronjobs/targetMessage')();

        if (update) {
            await interaction.editReply("Successfully updated the target message!");
        } else {
            await interaction.editReply("The target message did not need to be updated!");
        }
    }
}