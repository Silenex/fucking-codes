// commands/ban.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Bans a user from the server.',
    usage: '`<prefix>ban <user> [reason]`',
    aliases: ['b'],
    permissions: [PermissionsBitField.Flags.BanMembers],

    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a user from the server.')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to ban.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for banning.')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers), 

    async execute(context, args, client) {
        let userToBan;
        let reason;
        let guild = context.guild;

        if (context.isChatInputCommand && context.isChatInputCommand()) {
            const interaction = context;
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return interaction.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You do not have permission to use this command.')], ephemeral: true });
            }

            userToBan = interaction.options.getUser('target');
            reason = interaction.options.getString('reason') || 'No reason provided.';

            await interaction.deferReply({ ephemeral: true });
        } else {
            const message = context;
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You do not have permission to use this command.')] });
            }

            userToBan = message.mentions.users.first();
            reason = args.slice(1).join(' ') || 'No reason provided.';
        }

        if (!userToBan) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ You must specify a user to ban.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        const memberToBan = guild.members.cache.get(userToBan.id);

        if (!memberToBan) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ That user is not in this server.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        if (!guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I do not have permission to ban members.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        if (memberToBan.roles.highest.position >= guild.members.me.roles.highest.position) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I cannot ban that user as their role is higher than or equal to mine.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }
        if (memberToBan.id === guild.ownerId) {
             const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I cannot ban the server owner.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }
        if (memberToBan.id === client.user.id) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I cannot ban myself.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        try {
            await memberToBan.ban({ reason });

            const successEmbed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(`✅ ${userToBan.tag} has been banned for: ${reason}`);
            
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.followUp({ embeds: [successEmbed] });
            } else {
                await context.reply({ embeds: [successEmbed] });
            }
            
            const modLogsChannel = guild.channels.cache.find(channel => channel.name === client.config.modLogsChannelName || channel.id === client.config.modLogsChannelID);
            if (modLogsChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Member Banned')
                    .setColor('Red')
                    .addFields(
                        { name: 'User', value: `${userToBan.tag} (${userToBan.id})`, inline: true },
                        { name: 'Moderator', value: `${context.member.user.tag} (${context.member.id})`, inline: true },
                        { name: 'Reason', value: reason }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Bot Moderator Actions' });
                modLogsChannel.send({ embeds: [logEmbed] }).catch(e => console.error("Error sending ban log to mod-logs:", e));
            }

        } catch (error) {
            console.error(`Error banning user ${userToBan.tag}:`, error);
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ There was an error trying to ban that user.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await context.reply({ embeds: [errorEmbed] });
            }
        }
    },
};