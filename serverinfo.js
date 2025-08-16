// commands/serverinfo.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'serverinfo',
    description: 'Displays information about the server.',
    usage: '`<prefix>serverinfo`',
    aliases: ['si', 'server'],
    permissions: [],

    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Displays information about the server.'),

    async execute(context) {
        const guild = context.guild;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Server Info for ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'Members', value: `${guild.memberCount}`, inline: true },
                { name: 'Creation Date', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false },
                { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
                { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
                { name: 'Boosts', value: `${guild.premiumSubscriptionCount || '0'} (Level ${guild.premiumTier})`, inline: true }
            )
            .setFooter({ text: `ID: ${guild.id}` })
            .setTimestamp();

        try {
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.reply({ embeds: [embed] });
            } else {
                await context.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error sending serverinfo embed:', error);
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ There was an error trying to fetch server info.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                context.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(e => {});
            } else {
                context.reply({ embeds: [errorEmbed] }).catch(e => {});
            }
        }
    },
};