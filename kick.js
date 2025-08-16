// commands/kick.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'kick',
    description: 'Kicks a user from the server.',
    usage: '`<prefix>kick <user> [reason]`',
    aliases: ['k'],
    permissions: [PermissionsBitField.Flags.KickMembers],

    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a user from the server.')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to kick.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for kicking.')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers),

    async execute(context, args, client) {
        let userToKick;
        let reason;
        let guild = context.guild;

        if (context.isChatInputCommand && context.isChatInputCommand()) {
            const interaction = context;
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return interaction.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You do not have permission to use this command.')], ephemeral: true });
            }

            userToKick = interaction.options.getUser('target');
            reason = interaction.options.getString('reason') || 'No reason provided.';

            await interaction.deferReply({ ephemeral: true });
        } else {
            const message = context;
            if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You do not have permission to use this command.')] });
            }

            userToKick = message.mentions.users.first();
            reason = args.slice(1).join(' ') || 'No reason provided.';
        }

        if (!userToKick) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ You must specify a user to kick.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        const memberToKick = guild.members.cache.get(userToKick.id);

        if (!memberToKick) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ That user is not in this server.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        if (!guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I do not have permission to kick members.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        if (memberToKick.roles.highest.position >= guild.members.me.roles.highest.position) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I cannot kick that user as their role is higher than or equal to mine.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }
        if (memberToKick.id === guild.ownerId) {
             const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I cannot kick the server owner.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }
        if (memberToKick.id === client.user.id) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I cannot kick myself.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        try {
            await memberToKick.kick({ reason });

            const successEmbed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(`✅ ${userToKick.tag} has been kicked for: ${reason}`);
            
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.followUp({ embeds: [successEmbed] });
            } else {
                await context.reply({ embeds: [successEmbed] });
            }
            
            const modLogsChannel = guild.channels.cache.find(channel => channel.name === client.config.modLogsChannelName || channel.id === client.config.modLogsChannelID);
            if (modLogsChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Member Kicked')
                    .setColor('Orange')
                    .addFields(
                        { name: 'User', value: `${userToKick.tag} (${userToKick.id})`, inline: true },
                        { name: 'Moderator', value: `${context.member.user.tag} (${context.member.id})`, inline: true },
                        { name: 'Reason', value: reason }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Bot Moderator Actions' });
                modLogsChannel.send({ embeds: [logEmbed] }).catch(e => console.error("Error sending kick log to mod-logs:", e));
            }

        } catch (error) {
            console.error(`Error kicking user ${userToKick.tag}:`, error);
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ There was an error trying to kick that user.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await context.reply({ embeds: [errorEmbed] });
            }
        }
    },
};