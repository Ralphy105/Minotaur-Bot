const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const { connectURI } = require('../../config.json');

const recruiters = [
    '333592723166724106', // Ralphy
    '642953947191181322', // Bluee
    '296890075126693889', // MSCHFbone
    '1242584022362620087', // Skyla
    '650864318509744129', // Loving
    '700089784927780975', // Fibx
    '292454343263911937', // Ambrew
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recruit')
        .setDescription('Send a venmo message to a player.')
        .addStringOption(option =>
            option.setName('platform')
                .setRequired(true)
                .setDescription('This is important for which kind of link you\'re given.')
                .addChoices(
                    { name: 'Computer', value: 'computer' },
                    { name: 'Mobile', value: 'mobile' }
        )),
    async execute(interaction) {

        const id = interaction.user.id;
        if (!recruiters.includes(id)) {
            await interaction.reply({ content: 'You\'re not signed up as a recruiter! Want to help out? Message <@333592723166724106>!', ephemeral: true});
            return;
        }

        const client = new MongoClient(connectURI);
        try {
            await client.connect();

            const db = client.db('Minotaur');
            const venmoCollection = db.collection('Venmos');
            const recruiterCollection = db.collection('Recruiters');

            let recruiter = await recruiterCollection.findOne({discordId: id});
            const venmo = await venmoCollection.findOneAndUpdate({reached: false, valid: true, processing: false}, {$set: {processing: true}});

            if (!recruiter) {
                await recruiterCollection.insertOne({discordId: id, sends: 0});
            }
            recruiter = await recruiterCollection.findOne({discordId: id});

            if (!venmo) {
                interaction.reply('An invalid venmo was retrieved. Please try again.');
                return;
            }

            const sends = recruiter.sends + 1;
            const name = venmo.username;
            let link = `https://venmo.com/pay&recipients=${name}&amount=0.01&audience=private`;
            const embed = new EmbedBuilder()
                .setColor(0x2cdcb4)
                .setAuthor({name: `Recruiter ${interaction.user.displayName}  --  Broadcast #${sends}`})
                .setTitle(`MPV Player:  ${name}`)
                .addFields({name: 'Log Your Result!', value: `Please indicate whether you successfully sent the message, the Venmo name was invalid, or if the message was not sent for any other reason. This message will close in <t:${Math.round(Date.now()/1000)+300}:R>`})
                .setFooter({text: 'Thanks for your help!'});

            if (interaction.options.getString('platform') == 'computer') {
                link += '&note=MSCHF%20Plays%20Venmo%20is%20struggling%20against%20bots.%20The%20Minotaur%20Group%20is%20dead%20set%20on%20taking%20out%20fake%2C%20nonhuman%20players.%20Earn%20a%20share%20of%20the%20prize%20without%20lifting%20a%20finger%2C%20by%20joining%20our%20autovoter!%20Join%20us%2C%20and%20be%20part%20of%20the%20most%20successful%20group%20in%20the%20game.%20discord.gg%2FntVkuRDjBg';
                
                embed.setDescription('Click the link, and press send!\n\nPlease do not use /recruit again until you finish this one.');
            } else {
                embed.setDescription(`Click the link, and paste the following message!\n\nPlease do not use /recruit again until you finish this one.`);
            }

            embed.setURL(link);

            const invalid = new ButtonBuilder()
                .setCustomId('invalid')
                .setLabel('Invalid Name')
                .setStyle(ButtonStyle.Danger);

            const cancel = new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary);

            const sent = new ButtonBuilder()
                .setCustomId('sent')
                .setLabel('Success!')
                .setStyle(ButtonStyle.Success);

            const buttonRow = new ActionRowBuilder().addComponents(invalid, cancel, sent);

            const message = await interaction.reply({embeds: [embed], components: [buttonRow]});

            let extra;

            if (interaction.options.getString('platform') == 'mobile') {
                const msg = 'MSCHF Plays Venmo is struggling against bots. The Minotaur Group is dead set on taking out fake, nonhuman players. Earn a share of the prize without lifting a finger, by joining our autovoter! Join us, and be part of the most successful group in the game. discord.gg/ntVkuRDjBg';
                extra = await interaction.followUp(`\`\`\`${msg}\`\`\``);
            }

            const collector = message.createMessageComponentCollector({ time: 300_000 });

            let reacted = false;

            collector.on('collect', async listener => {
                if (listener.user.id != id) {
                    await listener.reply({content: "You can't interact with someone else's message!", ephemeral: true});
                    return;
                }
                try {
                    await client.connect();

                    switch (listener.customId) {
                        case 'sent':
                            await venmoCollection.updateOne({username: name}, {$set: {reached: true, recruiter: id, processing: false, lastInteract: Date()}});
                            await recruiterCollection.updateOne({discordId: id}, {$set: {sends: sends}});
                            break;
                        case 'invalid':
                            await venmoCollection.updateOne({username: name}, {$set: {valid: false, recruiter: id, processing: false, lastInteract: Date()}});
                            break;
                        case 'cancel':
                            await venmoCollection.updateOne({username: name}, {$set: {processing: false}});
                            console.log(`Recruiter ${interaction.user.username} cancelled their recruit of ${name}`);
                            break;
                        default:
                            await venmoCollection.updateOne({username: name}, {$set: {processing: false}});
                            console.log(`Unknown error: Recruiter ${interaction.user.username} recruiting ${name}`);
                    }

                    await interaction.editReply({content: `The result \`${listener.customId}\` has been logged. Thank you for your help recruiting!`, embeds: [], components: []});
                } catch (e) {
                    console.error(e);
                } finally { // Would outer finally close the client? If so, why did I need to re-connect() it inside the callback?
                    await venmoCollection.updateOne({username: name}, {$set: {processing: false}});
                    await client.close();
                }
                reacted = true;
                await collector.stop();
            }).on('end', async () => {
                if (!reacted) {
                    await interaction.editReply({content: `The message timed out. No result has been logged`, embeds: [], components: []});
                }
                if (extra) {
                    await extra.delete();
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
            await client.close();
        }
    }
};