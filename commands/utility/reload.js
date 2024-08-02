const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command.')
		.addStringOption(option =>
			option.setName('command')
				.setDescription('The command to reload.')
				.setRequired(true)),
	async execute(interaction) {
		if (interaction.user.id != '333592723166724106') {
			interaction.reply({content: 'You are not authorized to use this command!', ephemeral: true});
			return;
		}
		const commandName = interaction.options.getString('command', true).toLowerCase();
		const command = interaction.client.commands.get(commandName);

		if (!command) {
			return interaction.reply(`There is no command with name \`${commandName}\`!`);
		}

		const commandFolders = fs.readdirSync(path.dirname(__dirname));

		let folder;
		for (folder of commandFolders) {
			try {
				delete require.cache[require.resolve(`../${folder}/${command.data.name}.js`)];
				break;
			} catch (err) {
				// console.log(err);
			}
		}

        try {
            const newCommand = require(`../${folder}/${command.data.name}.js`);
            interaction.client.commands.set(newCommand.data.name, newCommand);
            await interaction.reply(`Command \`${newCommand.data.name}\` was reloaded!`);
			console.log(`Command ${newCommand.data.name} was reloaded!`);
        } catch (error) {
            console.error(error);
            await interaction.reply(`There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``);
			console.log(`There was an error while reloading a command ${command.data.name}:\n${error.message}`);
        }
	},
};