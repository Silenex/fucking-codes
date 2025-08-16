// commands/roleadd.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'roleadd',
    description: 'Adds a role to a specified user.',
    usage: '`<prefix>roleadd <user> <role>`',
    aliases: ['addrole', 'ar'],
    permissions: [PermissionsBitField.Flags.ManageRoles],

    data: new SlashCommandBuilder()
        .setName('roleadd')
        .setDescription('Adds a role to a specified user.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to add the role to.')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to add.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),

    async execute(context, args) {
        let memberToModify;
        let roleToAdd;
        let guild = context.guild;

        if (context.isChatInputCommand && context.isChatInputCommand()) {
            const interaction = context;
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                return interaction.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You do not have permission to use this command.')], ephemeral: true });
            }
            memberToModify = interaction.options.getMember('target');
            roleToAdd = interaction.options.getRole('role');
            await interaction.deferReply({ ephemeral: false });
        } else {
            const message = context;
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You do not have permission to use this command.')] });
            }
            memberToModify = message.mentions.members.first();
            roleToAdd = guild.roles.cache.find(r => r.name === args.slice(1).join(' ') || r.id === args[1]); // Assuming role is provided as name or ID after user mention/ID
        }

        if (!memberToModify || !roleToAdd) {
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

        if (roleToAdd.managed) { // Prevent managing Discord integrated roles
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I cannot add that role (it is managed by Discord or an integration).');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        if (memberToModify.roles.cache.has(roleToAdd.id)) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`❌ ${memberToModify.user.tag} already has the \`${roleToAdd.name}\` role.`);
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        if (roleToAdd.position >= guild.members.me.roles.highest.position) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ I cannot add that role as it is higher than or equal to my highest role.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }
        
        try {
            await memberToModify.roles.add(roleToAdd);

            const successEmbed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(`✅ Added role \`${roleToAdd.name}\` to ${memberToModify.user.tag}.`);

            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.followUp({ embeds: [successEmbed] });
            } else {
                await context.reply({ embeds: [successEmbed] });
            }

        } catch (error) {
            console.error(`Error adding role to ${memberToModify.user.tag}:`, error);
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ There was an error trying to add the role.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await context.reply({ embeds: [errorEmbed] });
            }
        }
    },
};