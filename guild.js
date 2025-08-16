// commands/guilds.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guilds',
    description: 'Lists all guilds the bot is in.',
    usage: '`<prefix>guilds`',
    aliases: ['servers'],
    ownerOnly: true, // <--- THIS MAKES IT OWNER-ONLY
    permissions: [],

    data: new SlashCommandBuilder()
        .setName('guilds')
        .setDescription('Lists all guilds the bot is in.'),

    async execute(context, args, client) {
        const guilds = client.guilds.cache.map(guild => `**${guild.name}** (\`${guild.id}\`) - Members: \`${guild.memberCount}\``);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Bot is in ${guilds.length} Guilds`)
            .setDescription(guilds.join('\n') || 'No guilds found.')
            .setTimestamp();

        try {
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.reply({ embeds: [embed], ephemeral: true }); // Ephemeral for privacy
            } else {
                await context.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error sending guilds list:', error);
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ There was an error trying to fetch guild information.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                context.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(e => {});
            } else {
                context.reply({ embeds: [errorEmbed] }).catch(e => {});
            }
        }
    },
};