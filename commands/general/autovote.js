const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const { connectURI } = require('../../config.json');
const jwt = require('jsonwebtoken');
const getToken = require('../../getToken');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('autovote')
		.setDescription('Interact with our automated voting program! Used to enter, edit, or remove your information.')
        .addSubcommand(subcommand => subcommand
            .setName('signup')
            .setDescription('Join our automatic voting program! Your information will always be encrypted and secure.')
            .addStringOption(option => option.setName('email').setDescription('Your ENTIRE MPV Account Email').setRequired(true))
            .addStringOption(option => option.setName('password').setDescription('Your MPV Account Password').setRequired(true))
        ).addSubcommand(subcommand => subcommand
            .setName('edit')
            .setDescription('Change the information you provided!')
            .addStringOption(option => option.setName('email').setDescription('Re-enter Your Email').setRequired(true))
            .addStringOption(option => option.setName('password').setDescription('Re-enter Your Password').setRequired(true))
        ).addSubcommand(subcommand => subcommand
            .setName('deactivate')
            .setDescription('Retract your information from the database and end automated voting.')
        ),

	async execute(interaction) {

        const inGuild = interaction.inGuild();

        const id = interaction.user.id;
        const username = interaction.user.username;
        const displayName = interaction.user.displayName;

        const mongo = new MongoClient(connectURI);
        try {
            await mongo.connect();
            const avCollection = mongo.db('Minotaur').collection('Autovoters');
            const whitelist = mongo.db('Minotaur').collection('Whitelist');

            const existingAv = await avCollection.findOne({discordId: id});

            switch(interaction.options.getSubcommand()) {
                case 'signup':
                
                    if (existingAv && existingAv.active) {
                        await interaction.reply({content: `You're already signed up! To change your registered information, use \`/autovote edit\`. If you think this is a mistake, message <@333592723166724106>.`, ephemeral: inGuild});
                        console.log(`${id}-- ${username} has tried to signup again!`);
                    } else {                        
                        console.log(`${id}-- ${username} has signed up!`);

                        const email = interaction.options.getString('email');
                        const password = interaction.options.getString('password');

                        const result = await avCollection.updateOne({discordId: id}, {$set: {email: email, password: password, validInfo: 'Untested', hasVoted: false, dmVoter: true, token: null, active: true}}, {upsert: true});

                        const embed = new EmbedBuilder()
                            .setColor(0x2b2d31)
                            .setTitle('Thank you for signing up for autovoting!')
                            .setDescription(`Your information is kept encrypted and secure.\n\nHere's the info you provided:\nEmail: \`${email}\`, Password: \`${password}\``)
                            .setFooter({text: 'Now attempting to set your account up for voting!'});
                        await interaction.reply({embeds: [embed], ephemeral: inGuild});
                        
                        try {
                            const token = await getToken(id, email, password);
                            await avCollection.updateOne({discordId: id}, {$set: {validInfo: true, token: token}});
                            const venmo = jwt.decode(token).username;
                            await whitelist.updateOne({discordId: id}, {$set: {vName: venmo, dName: username, dDisplayName: displayName}}, {upsert: true});
                            await interaction.followUp({content: `Successfully generated an account token for autovoting. While I'm at it, I enrolled you in my Member Protection System as well!`, ephemeral: inGuild});
                        } catch (e) {
                            console.log(`/autovote: Couldn't get token for user ${id}/${username}\nError: ${e.message}`);
        
                            if (e.message.includes('LOGIN FAIL')) {
                                await avCollection.updateOne({discordId: id}, {$set: {validInfo: false}});
                                await interaction.followUp({content: 'The login credentials provided appear to be incorrect. Please use \`/autovote edit\` to update them. If you think this is a mistake, message <@333592723166724106>.', ephemeral: inGuild});
                            } else if (e.message.includes('CAPTCHA FAIL')) {
                                await interaction.followUp({content: `Member Protection Enrollment Error: Unfortunately, our captcha service is down, so we couldn't enter/update you automatically. Please use \`/protect\` to enroll yourself manually!`, ephemeral: inGuild});
                            }
                        }
                    }
                    break;

                case 'edit':
                    if (!(existingAv && existingAv.active)) {
                        await interaction.reply({content: `You're not signed up yet! To do so, use \`/autovote signup\`.`, ephemeral: inGuild});
                        console.log(`${id}-- ${username} has tried to edit before signup!`);
                    } else {
                        console.log(`${id}-- ${username} has edited!`);
                        const hasToken = Boolean(existingAv.token);
                        const email = interaction.options.getString('email');
                        const password = interaction.options.getString('password');

                        const result = await avCollection.updateOne({discordId: id}, {$set: {email: email, password: password, validInfo: 'Untested'}});
                    
                        const embed = new EmbedBuilder()
                            .setColor(0x2b2d31)
                            .setTitle('Your account information has been successfully updated!')
                            .setDescription(`Old Email: \`${existingAv.email}\`, Old Password: \`${existingAv.password}\`\n\nEmail: \`${email}\`, Password: \`${password}\``)
                            .setFooter({text: hasToken ? 'Your account should now be set for autovoting!' : 'Now attempting to set your account up for voting!'});
                        await interaction.reply({embeds: [embed], ephemeral: inGuild});

                        if (!hasToken) {
                            try {
                                const token = await getToken(id, email, password);
                                await avCollection.updateOne({discordId: id}, {$set: {validInfo: true, token: token}});
                                const venmo = jwt.decode(token).username;
                                await whitelist.updateOne({discordId: id}, {$set: {vName: venmo, dName: username, dDisplayName: displayName}}, {upsert: true});
                                await interaction.followUp({content: `Successfully generated an account token for autovoting. While I'm at it, if you weren't already enrolled in my Member Protection System, you've just been added!`, ephemeral: inGuild});
                            } catch (e) {
                                console.log(`/autovote: Couldn't get token for user ${id}/${username}\nError: ${e.message}`);
            
                                if (e.message.includes('LOGIN FAIL')) {
                                    await avCollection.updateOne({discordId: id}, {$set: {validInfo: false}});
                                    await interaction.followUp({content: 'The login credentials provided appear to be incorrect. Please use \`/autovote edit\` to update them. If you think this is a mistake, message <@333592723166724106>.', ephemeral: inGuild});
                                } else if (e.message.includes('CAPTCHA FAIL')) {
                                    await interaction.followUp({content: `Member Protection Enrollment Error: Unfortunately, our captcha service is down, so we couldn't enter/update you automatically. Please use \`/protect\` to enroll yourself manually!`, ephemeral: inGuild});
                                }
                            }
                        }
                    }
                    break;

                case 'deactivate':
                    if (!(existingAv && existingAv.active)) {
                        await interaction.reply({content: `You're not signed up yet! To do so, use \`/autovote signup\`. If you think this is a mistake, message <@333592723166724106>.`, ephemeral: inGuild});
                        console.log(`${id}-- ${username} has tried to edit before signup!`);

                    } else {
                        console.log(`${id}-- ${username} has deactivated!`);

                        const result = await avCollection.updateOne({discordId: id}, {$set: {active: false}});

                        await interaction.reply({content: `Your autovoting account has successfully been deactivated!`, ephemeral: inGuild});
                    }
                    break;

                default:
                    await interaction.reply({content: "Something went wrong with the command.", ephemeral: true});
            }

        } catch (e) { // does get caught here
            console.error(e);
            const msg = 'An unknown error occurred while processing the command. Use `/status` to see if your data was entered. Please notify <@333592723166724106> if the error persists.';
            if (!interaction.replied) {
                await interaction.reply({ content: msg, ephemeral: true});
            } else {
                await interaction.editReply({ content: msg, embeds: []});
            }
        } finally {
            await mongo.close();
        }
	},
};