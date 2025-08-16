// commands/leaveserver.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'leaveserver',
    description: 'Makes the bot leave a specified server.',
    usage: '`<prefix>leaveserver <guild_id>`',
    aliases: ['lv'],
    ownerOnly: true, // <--- THIS MAKES IT OWNER-ONLY
    permissions: [],

    data: new SlashCommandBuilder()
        .setName('leaveserver')
        .setDescription('Makes the bot leave a specified server by ID.')
        .addStringOption(option =>
            option.setName('guild_id')
                .setDescription('The ID of the server to leave.')
                .setRequired(true)),

    async execute(context, args, client) {
        const guildId = context.isChatInputCommand && context.isChatInputCommand() 
            ? context.options.getString('guild_id') 
            : args[0];

        if (!guildId) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ Please provide the ID of the server you want the bot to leave.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.reply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`❌ I am not in a server with the ID \`${guildId}\`.`);
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.reply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        try {
            await guild.leave();
            const successEmbed = new EmbedBuilder().setColor('Green').setDescription(`✅ Successfully left server: **${guild.name}** (\`${guild.id}\`)`);
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.reply({ embeds: [successEmbed] });
            } else {
                await context.reply({ embeds: [successEmbed] });
            }
        } catch (error) {
            console.error(`Error leaving server ${guildId}:`, error);
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`❌ There was an error trying to leave server \`${guild.name}\` (\`${guildId}\`).`);
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.reply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await context.reply({ embeds: [errorEmbed] });
            }
        }
    },
};