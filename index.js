const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { token, startupVoteState } = require('./config.json');
const startJobs = require('./cronjobs/startJobs');

const allIntents = Object.keys(GatewayIntentBits).map( a => GatewayIntentBits[a] );

const client = new Client({ intents: allIntents });

client.commands = new Collection();

client.voteState = startupVoteState;
client.nextVoteState = startupVoteState;

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

(async () => {

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);
			// Set a new item in the Collection with the key as the command name and the value as the exported module
			if ('data' in command && 'execute' in command) {
				client.commands.set(command.data.name, command);
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}

	const eventsPath = path.join(__dirname, 'events');
	const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

	for (const file of eventFiles) {
		const filePath = path.join(eventsPath, file);
		const event = require(filePath);
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		} else {
			client.on(event.name, (...args) => event.execute(...args));
		}
	}

	await client.login(token);

	const logChannel = await client.channels.fetch('1274463691525456064');
	const modLogChannel = await client.channels.fetch('1274502604570755206');
	client.on('log', async (msg, public, context) => {
		const embed = new EmbedBuilder()
			.setColor(0x2b2d31)
			.setAuthor({name: new Date().toUTCString()})
			.setDescription(msg);
		if (context) embed.setTitle(context);

		await logChannel.send({embeds: [embed]});
		if (public === true) modLogChannel.send({embeds: [embed]});
	});

	module.exports = { client };
	startJobs(client);

})();