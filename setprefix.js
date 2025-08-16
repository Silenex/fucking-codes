// commands/setprefix.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const prefixManager = require('../utils/prefixManager');

module.exports = {
    name: 'setprefix',
    description: 'Sets a custom prefix for the server.',
    usage: '`<prefix>setprefix <new-prefix>`',
    aliases: ['prefix'],
    permissions: [PermissionsBitField.Flags.ManageGuild],

    data: new SlashCommandBuilder()
        .setName('setprefix')
        .setDescription('Sets a custom prefix for the server.')
        .addStringOption(option =>
            option.setName('new_prefix')
                .setDescription('The new prefix to set for this server.')
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(5))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    async execute(context, args) {
        let newPrefix;
        let guildId = context.guild.id;

        if (context.isChatInputCommand && context.isChatInputCommand()) {
            const interaction = context;
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                return interaction.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You do not have permission to use this command.')], ephemeral: true });
            }
            newPrefix = interaction.options.getString('new_prefix');
            await interaction.deferReply({ ephemeral: true });
        } else {
            const message = context;
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You do not have permission to use this command.')] });
            }
            newPrefix = args[0];
        }

        if (!newPrefix || newPrefix.length > 5 || newPrefix.length < 1) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ Please provide a new prefix (1-5 characters).');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        prefixManager.setPrefix(guildId, newPrefix);

        const successEmbed = new EmbedBuilder()
            .setColor('Green')
            .setDescription(`✅ Server prefix has been set to: \`${newPrefix}\``);

        if (context.isChatInputCommand && context.isChatInputCommand()) {
            await context.followUp({ embeds: [successEmbed] });
        } else {
            await context.reply({ embeds: [successEmbed] });
        }
    },
};