// commands/roleremove.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'roleremove',
    description: 'Removes a role from a specified user.',
    usage: '`<prefix>roleremove <user> <role>`',
    aliases: ['removerole', 'rr'],
    permissions: [PermissionsBitField.Flags.ManageRoles],

    data: new SlashCommandBuilder()
        .setName('roleremove')
        .setDescription('Removes a role from a specified user.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to remove the role from.')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to remove.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),

    async execute(context, args) {
        let memberToModify;
        let roleToRemove;
        let guild = context.guild;

        if (context.isChatInputCommand && context.isChatInputCommand()) {
            const interaction = context;
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                return interaction.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You do not have permission to use this command.')], ephemeral: true });
            }
            memberToModify = interaction.options.getMember('target');
            roleToRemove = interaction.options.getRole('role');
            await interaction.deferReply({ ephemeral: false });
        } else {
            const message = context;
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You do not have permission to use this command.')] });
            }
            memberToModify = message.mentions.members.first();
            roleToRemove = guild.roles.cache.find(r => r.name === args.slice(1).join(' ') || r.id === args[1]);
        }

        if (!memberToModify || !roleToRemove) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ Please provide a user and a role.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I do not have permission to manage roles.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        if (roleToRemove.managed) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I cannot remove that role (it is managed by Discord or an integration).');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        if (!memberToModify.roles.cache.has(roleToRemove.id)) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`❌ ${memberToModify.user.tag} does not have the \`${roleToRemove.name}\` role.`);
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        if (roleToRemove.position >= guild.members.me.roles.highest.position) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I cannot remove that role as it is higher than or equal to my highest role.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        try {
            await memberToModify.roles.remove(roleToRemove);

            const successEmbed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(`✅ Removed role \`${roleToRemove.name}\` from ${memberToModify.user.tag}.`);

            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.followUp({ embeds: [successEmbed] });
            } else {
                await context.reply({ embeds: [successEmbed] });
            }

        } catch (error) {
            console.error(`Error removing role from ${memberToModify.user.tag}:`, error);
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ There was an error trying to remove the role.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await context.reply({ embeds: [errorEmbed] });
            }
        }
    },
};