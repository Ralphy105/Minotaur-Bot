const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const generalCmds = [];
const utilityCmds = [];
const adminCmds = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			if (folder=='utility') {
				utilityCmds.push(command.data.toJSON());
			} else if (folder=='admin') {
				adminCmds.push(command.data.toJSON());
			} else {
				generalCmds.push(command.data.toJSON());
			}
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${generalCmds.length} global and ${utilityCmds.length} utility and ${adminCmds.length} admin (/) commands.`);

		// The put method is used to fully refresh all commands globally
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: generalCmds },
		);
		// The put method is used to fully refresh all commands in the guild with the current guildId set
		const dataU = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: utilityCmds },
		);

		// Deploy admin commands to Embassy only.
		const dataA = await rest.put(
			Routes.applicationGuildCommands(clientId, '1260201840151101563'),
			{ body: adminCmds },
		);

		console.log(`Successfully reloaded ${data.length} global and ${dataU.length} utility and ${dataA.length} admin (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

// Delete guild commands
// rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
// 	.then(() => console.log('Successfully deleted all guild commands.'))
// 	.catch(console.error);

// Delete global commands
// rest.put(Routes.applicationCommands(clientId), { body: [] })
//     .then(() => console.log('Successfully deleted all application commands.'))
//     .catch(console.error);