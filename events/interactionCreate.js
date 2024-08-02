const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) {

			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(error);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
				} else {
					await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
				}
			}
		} else if (interaction.isMessageComponent()) {
			// if (interaction.customId == "settings") {
			// 	switch (interaction.values[0]) {
			// 		case 'list':
			// 			const listEmbed = new EmbedBuilder()
			// 				.setColor(0x00afb5)
			// 				.setTitle('Settings Menu')
			// 				.setDescription('All autovote user settings. Choose one to view/change using the select menu.\n')
			// 				.addFields(
			// 					{ name: 'Message Me When Voting', value: 'Toggle whether the bot DMs you a "Vote Report" message after sending a vote for you.' },
			// 					{ name: 'More Settings to Come', value: '...' }
			// 				);
			// 			interaction.update({embeds: [listEmbed]});
			// 			break;
			// 		case 'dmVoter':
			// 			const dmEmbed = new EmbedBuilder()
			// 				.setColor(0x00afb5)
			// 				.setTitle('Message Me When Voting')
			// 				.setDescription('The bot will DM (direct message) you a "Vote Report" message every time it sends a vote for you.\n\nThis setting is currently:')
			// 				.addFields({ name: true ? '\u2713 Enabled' : '\u274C Disabled', value: '\u200b'});
			// 			interaction.update({embeds: [dmEmbed]});
			// 			break;
			// 		default:
			// 			console.error(`Unhandled settings interaction was received: ${interaction}`);
			// 		}
			// }
		} else {
			console.error(`Unhandled interaction was received: ${interaction}`);
			return;
		}
	},
};