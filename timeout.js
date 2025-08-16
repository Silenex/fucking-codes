// commands/timeout.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'timeout',
    description: 'Times out a user for a specified duration.',
    usage: '`<prefix>timeout <user> <duration_minutes> [reason]`',
    aliases: ['mute'], // Common alias, though technically a timeout is different
    permissions: [PermissionsBitField.Flags.ModerateMembers], // Required permission for timeout

    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Times out a user for a specified duration.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to time out.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration of timeout in minutes (max 40320 minutes = 28 days).') // 28 days in minutes
                .setRequired(true)
                .setMinValue(1) // Minimum 1 minute
                .setMaxValue(40320)) // Max 28 days in minutes
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the timeout.')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),

    async execute(context, args, client) {
        let userToTimeout;
        let durationMinutes;
        let reason;
        let guild = context.guild;

        if (context.isChatInputCommand && context.isChatInputCommand()) {
            const interaction = context;
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return interaction.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You do not have permission to use this command.')], ephemeral: true });
            }
            userToTimeout = interaction.options.getUser('target');
            durationMinutes = interaction.options.getInteger('duration');
            reason = interaction.options.getString('reason') || 'No reason provided.';
            await interaction.deferReply({ ephemeral: false });
        } else {
            const message = context;
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You do not have permission to use this command.')] });
            }
            userToTimeout = message.mentions.users.first();
            durationMinutes = parseInt(args[1]);
            reason = args.slice(2).join(' ') || 'No reason provided.';
        }

        if (!userToTimeout || isNaN(durationMinutes) || durationMinutes < 1 || durationMinutes > 40320) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ Please provide a user and a valid duration in minutes (1-40320).');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        const memberToTimeout = guild.members.cache.get(userToTimeout.id);

        if (!memberToTimeout) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ That user is not in this server.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I do not have permission to timeout members.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        if (memberToTimeout.roles.highest.position >= guild.members.me.roles.highest.position) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I cannot timeout that user as their role is higher than or equal to mine.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }
        if (memberToTimeout.id === guild.ownerId) {
             const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I cannot timeout the server owner.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }
        if (memberToTimeout.id === client.user.id) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I cannot timeout myself.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        try {
            const durationMs = durationMinutes * 60 * 1000; // Convert minutes to milliseconds
            await memberToTimeout.timeout(durationMs, reason);

            const successEmbed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(`✅ ${userToTimeout.tag} has been timed out for ${durationMinutes} minutes for: ${reason}`);
            
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.followUp({ embeds: [successEmbed] });
            } else {
                await context.reply({ embeds: [successEmbed] });
            }
            
            const modLogsChannel = guild.channels.cache.find(channel => channel.name === client.config.modLogsChannelName || channel.id === client.config.modLogsChannelID);
            if (modLogsChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Member Timed Out')
                    .setColor('Purple')
                    .addFields(
                        { name: 'User', value: `${userToTimeout.tag} (${userToTimeout.id})`, inline: true },
                        { name: 'Moderator', value: `${context.member.user.tag} (${context.member.id})`, inline: true },
                        { name: 'Duration', value: `${durationMinutes} minutes`, inline: true },
                        { name: 'Reason', value: reason }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Bot Moderator Actions' });
                modLogsChannel.send({ embeds: [logEmbed] }).catch(e => console.error("Error sending timeout log to mod-logs:", e));
            }

        } catch (error) {
            console.error(`Error timing out user ${userToTimeout.tag}:`, error);
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ There was an error trying to time out that user.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await context.reply({ embeds: [errorEmbed] });
            }
        }
    },
};