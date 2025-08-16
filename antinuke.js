// commands/antinuke.js
const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionsBitField,
    ChannelType,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');

// Corrected relative paths for utility managers
const configManager = require('../utils/configManager'); // Ensure correct path
const antiNukeConfigManager = require('../utils/antiNukeConfigManager'); // Ensure correct path

module.exports = {
    name: 'antinuke', // For prefix command usage (if you define one with this name)
    description: 'Manages the server\'s anti-nuke and security settings, including quarantine.',
    usage: '`/antinuke <subcommand>`',
    aliases: ['anuke', 'security'], // Aliases for prefix commands
    category: 'Antinuke',
    permissions: [PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.Administrator], // Required permissions for users to use this command

    data: new SlashCommandBuilder()
        .setName('antinuke')
        .setDescription('Manages the server\'s anti-nuke and security settings, including quarantine.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild) // Discord's built-in permission check for slash commands

        // Subcommand: status
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Shows the current anti-nuke and quarantine settings for this server.')
        )

        // Subcommand: enable
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Enables the anti-nuke system for this server.')
        )

        // Subcommand: disable
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disables the anti-nuke system for this server.')
        )

        // Subcommand: quicksetup
        .addSubcommand(subcommand =>
            subcommand
                .setName('quicksetup')
                .setDescription('Performs an automated quick setup of essential anti-nuke components (Quarantine, Logging).')
        )

        // Subcommand Group: quarantine
        .addSubcommandGroup(group =>
            group
                .setName('quarantine')
                .setDescription('Manage the server\'s quarantine role and system.')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('setup')
                        .setDescription('Sets up or creates the quarantine role for this server.')
                        .addRoleOption(option =>
                            option.setName('role')
                                .setDescription('An existing role to use as the quarantine role.')
                                .setRequired(false) // If not provided, bot will try to create one
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add')
                        .setDescription('Puts a member into quarantine.')
                        .addUserOption(option =>
                            option.setName('target')
                                .setDescription('The member to put in quarantine.')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('reason')
                                .setDescription('Reason for quarantining the member.')
                                .setRequired(false)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Removes a member from quarantine.')
                        .addUserOption(option =>
                            option.setName('target')
                                .setDescription('The member to remove from quarantine.')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option.setName('reason')
                                .setDescription('Reason for removing the member from quarantine.')
                                .setRequired(false)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('role')
                        .setDescription('Sets or views the configured quarantine role.')
                        .addRoleOption(option =>
                            option.setName('new_role')
                                .setDescription('The new role to set as the quarantine role.')
                                .setRequired(false)
                        )
                )
        )

        // Subcommand: set (for other general anti-nuke settings)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Configure specific anti-nuke settings like thresholds or punishments.')
                .addStringOption(option =>
                    option.setName('setting')
                        .setDescription('The setting to configure.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'threshold', value: 'threshold' },
                            { name: 'punishment_type', value: 'punishment_type' }, // e.g., 'ban', 'kick', 'quarantine'
                            { name: 'alert_channel', value: 'alert_channel' }
                            // Add more settings here as needed
                        )
                )
                .addStringOption(option =>
                    option.setName('value')
                        .setDescription('The value for the setting (e.g., number for threshold, role/channel ID, or text).')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('action_type', 'action_type') // specific action for punishment (e.g., mass_ban, channel_create)
                        .setDescription('The type of action to apply the setting to (e.g., mass_ban, role_create, etc.)')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Mass Ban', value: 'mass_ban' },
                            { name: 'Mass Kick', value: 'mass_kick' },
                            { name: 'Channel Create', value: 'channel_create' },
                            { name: 'Channel Delete', value: 'channel_delete' },
                            { name: 'Role Create', value: 'role_create' },
                            { name: 'Role Delete', value: 'role_delete' },
                            { name: 'Bot Add', value: 'bot_add' },
                            { name: 'Emoji Create', value: 'emoji_create' },
                            { name: 'Emoji Delete', value: 'emoji_delete' },
                            { name: 'Webhook Create', value: 'webhook_create' },
                            { name: 'Webhook Delete', value: 'webhook_delete' }
                            // Add more actions as per your anti-nuke system's audit log monitoring
                        )
                )
        ),

    async execute(interaction, args, client) {
        const { guild, options, member } = interaction;
        const antiNukeConfigManager = client.antiNukeConfigManager; // Get manager from client

        // Although setDefaultMemberPermissions is set, it's good practice to have a runtime check for robust error handling.
        if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You need the "Manage Server" permission to use this command.')],
                ephemeral: true
            });
        }

        const subcommand = options.getSubcommand();
        const subcommandGroup = options.getSubcommandGroup(false); // Pass false to not throw error if no group

        const config = antiNukeConfigManager.getGuildConfig(guild.id);

        const embed = new EmbedBuilder();

        // Handle subcommand groups first
        if (subcommandGroup === 'quarantine') {
            const quarantineRoleID = config.quarantineRoleID;
            let quarantineRole = null;
            if (quarantineRoleID) {
                quarantineRole = guild.roles.cache.get(quarantineRoleID);
            }

            switch (subcommand) {
                case 'setup': {
                    const existingRoleOption = options.getRole('role');
                    if (existingRoleOption) {
                        // Use existing role provided by the user
                        antiNukeConfigManager.setGuildConfig(guild.id, { quarantineRoleID: existingRoleOption.id });
                        embed.setColor('Green').setDescription(`✅ Set <@&${existingRoleOption.id}> as the quarantine role.`);
                        await interaction.reply({ embeds: [embed] });
                    } else {
                        // Create a new quarantine role if none provided and no existing one is set
                        if (quarantineRole) {
                            embed.setColor('Yellow').setDescription(`⚠️ A quarantine role (<@&${quarantineRole.id}>) is already set. If you want to use a different one, consider deleting the old role first or specifying a new role with \`/antinuke quarantine setup role:<role>\`.`);
                            return interaction.reply({ embeds: [embed], ephemeral: true });
                        }

                        try {
                            // Defer reply as role creation and permission setting can take time
                            await interaction.deferReply();

                            const newQuarantineRole = await guild.roles.create({
                                name: 'Quarantined',
                                color: '#808080', // Grey color
                                permissions: [], // No permissions by default
                                hoist: false, // Don't display separately in member list
                                mentionable: false,
                                reason: 'Anti-Nuke Quarantine Role Creation (via /antinuke quarantine setup)'
                            });

                            // Deny Send Messages, Add Reactions, and Use Application Commands in all existing text channels
                            // Deny Speak and Connect in all existing voice channels
                            await Promise.all(guild.channels.cache.map(async (channel) => {
                                try {
                                    if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildForum || channel.type === ChannelType.GuildMedia) {
                                        await channel.permissionOverwrites.edit(newQuarantineRole, {
                                            SendMessages: false,
                                            AddReactions: false,
                                            UseApplicationCommands: false,
                                            CreatePublicThreads: false,
                                            CreatePrivateThreads: false,
                                            SendMessagesInThreads: false,
                                            SendVoiceMessages: false
                                        });
                                    } else if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
                                        await channel.permissionOverwrites.edit(newQuarantineRole, {
                                            Speak: false,
                                            Connect: false,
                                            Stream: false,
                                            UseVAD: false
                                        });
                                    } else if (channel.type === ChannelType.GuildCategory) {
                                        // For categories, deny ViewChannel if you want to completely hide channels
                                        // Or deny specific perms if channels inherit
                                        await channel.permissionOverwrites.edit(newQuarantineRole, {
                                            ViewChannel: false // Deny access to entire category
                                        });
                                    }
                                } catch (e) {
                                    console.error(`Failed to set quarantine permissions for channel ${channel.name} (${channel.id}): ${e.message}`);
                                }
                            }));

                            antiNukeConfigManager.setGuildConfig(guild.id, { quarantineRoleID: newQuarantineRole.id });
                            embed.setColor('Green').setDescription(`✅ Created and configured <@&${newQuarantineRole.id}> as the quarantine role.`);
                            await interaction.editReply({ embeds: [embed] }); // Use editReply after defer
                        } catch (error) {
                            console.error('Error creating quarantine role:', error);
                            embed.setColor('Red').setDescription('❌ Failed to create the quarantine role. Please check bot permissions and ensure it has `Manage Roles` and `Manage Channels`.');
                            if (interaction.deferred) {
                                await interaction.editReply({ embeds: [embed], ephemeral: true });
                            } else {
                                await interaction.reply({ embeds: [embed], ephemeral: true });
                            }
                        }
                    }
                    break;
                }

                case 'add': {
                    const targetMember = options.getMember('target');
                    const reason = options.getString('reason') || 'No reason provided.';

                    if (!targetMember) {
                        embed.setColor('Red').setDescription('❌ Could not find that member.');
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                    if (targetMember.id === member.id) {
                        embed.setColor('Red').setDescription('❌ You cannot quarantine yourself.');
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                    if (targetMember.user.bot) {
                        embed.setColor('Red').setDescription('❌ You cannot quarantine bots.');
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                    // Prevent quarantining members with higher or equal roles, or administrators
                    if (targetMember.permissions.has(PermissionsBitField.Flags.Administrator) || targetMember.roles.highest.position >= member.roles.highest.position) {
                         embed.setColor('Red').setDescription('❌ Cannot quarantine an administrator or someone with an equal or higher role than yourself.');
                         return interaction.reply({ embeds: [embed], ephemeral: true });
                    }

                    if (!quarantineRole) {
                        embed.setColor('Red').setDescription('❌ No quarantine role is set up for this server. Use `/antinuke quarantine setup` first.');
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }

                    if (targetMember.roles.cache.has(quarantineRole.id)) {
                        embed.setColor('Yellow').setDescription(`⚠️ ${targetMember.user.tag} is already in quarantine.`);
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }

                    try {
                        // Store original roles to re-add later, excluding @everyone role
                        const originalRoles = targetMember.roles.cache
                            .filter(role => role.id !== guild.id && role.id !== quarantineRole.id) // Exclude @everyone and quarantine role itself
                            .map(role => role.id);

                        // Remove all roles except @everyone (guild.id) and then add the quarantine role
                        // Set new roles in one go for efficiency and to clear others
                        await targetMember.roles.set([guild.id, quarantineRole.id], `Quarantined by ${member.user.tag} | ${reason}`);

                        // Store original roles for later removal from quarantine
                        antiNukeConfigManager.addQuarantinedUser(guild.id, targetMember.id, originalRoles);

                        embed.setColor('Orange').setDescription(`🔒 ${targetMember.user.tag} has been put into quarantine. Reason: ${reason}`);
                        await interaction.reply({ embeds: [embed] });
                    } catch (error) {
                        console.error('Error adding member to quarantine:', error);
                        embed.setColor('Red').setDescription('❌ Failed to put member in quarantine. Check bot permissions (Manage Roles).');
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                    break;
                }

                case 'remove': {
                    const targetMember = options.getMember('target');
                    const reason = options.getString('reason') || 'No reason provided.';

                    if (!targetMember) {
                        embed.setColor('Red').setDescription('❌ Could not find that member.');
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }

                    if (!quarantineRole || !targetMember.roles.cache.has(quarantineRole.id)) {
                        embed.setColor('Yellow').setDescription(`⚠️ ${targetMember.user.tag} is not currently in quarantine.`);
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }

                    try {
                        // Remove the quarantine role
                        await targetMember.roles.remove(quarantineRole, `Removed from quarantine by ${member.user.tag} | ${reason}`);

                        // Retrieve and re-add original roles
                        const quarantinedUserData = antiNukeConfigManager.getQuarantinedUser(guild.id, targetMember.id);
                        if (quarantinedUserData && quarantinedUserData.originalRoles && quarantinedUserData.originalRoles.length > 0) {
                            // Filter out any roles that no longer exist in the guild to prevent errors
                            const validOriginalRoles = quarantinedUserData.originalRoles.filter(roleId => guild.roles.cache.has(roleId));
                            await targetMember.roles.add(validOriginalRoles, `Restoring roles after quarantine by ${member.user.tag}`);
                            antiNukeConfigManager.removeQuarantinedUser(guild.id, targetMember.id); // Remove from tracking
                        } else {
                            // If no original roles were stored or found, just remove the quarantine role
                            antiNukeConfigManager.removeQuarantinedUser(guild.id, targetMember.id);
                        }


                        embed.setColor('Green').setDescription(`🔓 ${targetMember.user.tag} has been removed from quarantine. Reason: ${reason}`);
                        await interaction.reply({ embeds: [embed] });
                    } catch (error) {
                        console.error('Error removing member from quarantine:', error);
                        embed.setColor('Red').setDescription('❌ Failed to remove member from quarantine. Check bot permissions (Manage Roles).');
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                    break;
                }

                case 'role': {
                    const newRoleOption = options.getRole('new_role');
                    if (newRoleOption) {
                        // Set new quarantine role
                        antiNukeConfigManager.setGuildConfig(guild.id, { quarantineRoleID: newRoleOption.id });
                        embed.setColor('Green').setDescription(`✅ Quarantine role updated to <@&${newRoleOption.id}>.`);
                        await interaction.reply({ embeds: [embed] });
                    } else {
                        // View current quarantine role
                        if (quarantineRole) {
                            embed.setColor('Blue').setDescription(`ℹ️ The current quarantine role is <@&${quarantineRole.id}>.`);
                        } else {
                            embed.setColor('Yellow').setDescription('⚠️ No quarantine role is currently set for this server. Use `/antinuke quarantine setup` to configure one.');
                        }
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                    break;
                }
            }
        } else { // Handle top-level subcommands (status, enable, disable, set, quicksetup)
            switch (subcommand) {
                case 'status': {
                    embed.setColor('Blue')
                        .setTitle('🛡️ Anti-Nuke Status')
                        .addFields(
                            { name: 'System Status', value: config.enabled ? '🟢 Enabled' : '🔴 Disabled', inline: true },
                            { name: 'Quarantine Role', value: config.quarantineRoleID ? `<@&${config.quarantineRoleID}>` : 'Not Set', inline: true },
                            { name: 'Alert Channel', value: config.alertChannel ? `<#${config.alertChannel}>` : 'Not Set', inline: true },
                            { name: 'Default Punishment', value: config.defaultPunishment || 'None', inline: false }
                        );

                    // Add details for each action type with configured punishment
                    const actionTypes = Object.keys(config.punishment || {});
                    if (actionTypes.length > 0) {
                        const actionFields = actionTypes.map(action => {
                            const details = config.punishment[action];
                            // Capitalize each word in action_type for better display
                            const formattedAction = action.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                            return `**${formattedAction}**:\n` +
                                `Threshold: \`${details.threshold || 'N/A'}\`\n` +
                                `Punishment: \`${details.punishmentType || 'N/A'}\``;
                        }).join('\n\n');
                        embed.addFields({ name: 'Configured Action Punishments', value: actionFields, inline: false });
                    } else {
                        embed.addFields({ name: 'Configured Action Punishments', value: 'No specific action punishments configured. Bot will use default punishment/threshold if any.', inline: false });
                    }

                    await interaction.reply({ embeds: [embed] });
                    break;
                }
                case 'enable': {
                    if (config.enabled) {
                        embed.setColor('Yellow').setDescription('⚠️ Anti-nuke system is already **enabled** for this server.');
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                    antiNukeConfigManager.setGuildConfig(guild.id, { enabled: true });
                    embed.setColor('Green').setDescription('✅ Anti-nuke system has been **enabled** for this server.');
                    await interaction.reply({ embeds: [embed] });
                    break;
                }
                case 'disable': {
                    if (!config.enabled) {
                        embed.setColor('Yellow').setDescription('⚠️ Anti-nuke system is already **disabled** for this server.');
                        return interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                    antiNukeConfigManager.setGuildConfig(guild.id, { enabled: false });
                    embed.setColor('Red').setDescription('❌ Anti-nuke system has been **disabled** for this server.');
                    await interaction.reply({ embeds: [embed] });
                    break;
                }
                case 'quicksetup': {
                    await interaction.deferReply(); // Defer reply as this might take time

                    const initialEmbed = new EmbedBuilder()
                        .setColor('Blue')
                        .setTitle('🛡️ Anti-Nuke Quick Setup')
                        .setDescription('Initializing Quick Setup! Checking for permissions...')
                        .addFields(
                            { name: 'Permissions', value: '⬜ Checking permissions...', inline: false },
                            { name: 'Quarantine Role', value: '⬜ Checking quarantine role...', inline: false },
                            { name: 'Role Permissions', value: '⬜ Setting up role permissions...', inline: false },
                            { name: 'Logging Channel', value: '⬜ Checking logging channel...', inline: false }
                        );

                    await interaction.editReply({ embeds: [initialEmbed] });

                    const updates = [];
                    const startTime = Date.now();

                    // Step 1: Check Permissions
                    const requiredPerms = [
                        PermissionsBitField.Flags.ManageRoles,
                        PermissionsBitField.Flags.ManageChannels,
                        PermissionsBitField.Flags.KickMembers,
                        PermissionsBitField.Flags.BanMembers,
                        PermissionsBitField.Flags.ViewAuditLog, // Highly recommended for anti-nuke
                        PermissionsBitField.Flags.ManageGuild // General guild management
                    ];
                    const botMember = await guild.members.fetch(client.user.id);
                    const missingPerms = requiredPerms.filter(perm => !botMember.permissions.has(perm));

                    if (missingPerms.length > 0) {
                        updates.push({ name: 'Permissions', value: `❌ Missing required permissions: \`${missingPerms.map(p => PermissionsBitField.Flags[p]).join(', ')}\`` });
                        initialEmbed.setColor('Red'); // Set red if permissions are critically missing
                    } else {
                        updates.push({ name: 'Permissions', value: '✅ All required permissions found.' });
                    }
                    initialEmbed.setFields(updates);
                    await interaction.editReply({ embeds: [initialEmbed] });
                    if (missingPerms.length > 0) {
                        initialEmbed.setFooter({ text: 'Please grant the missing permissions and try again.' });
                        await interaction.editReply({ embeds: [initialEmbed] });
                        return; // Stop if critical permissions are missing
                    }

                    // Step 2: Quarantine Role Setup
                    let quarantineRole = guild.roles.cache.get(config.quarantineRoleID);
                    updates.push({ name: 'Quarantine Role', value: '⬜ Checking quarantine role...' });
                    initialEmbed.setFields(updates);
                    await interaction.editReply({ embeds: [initialEmbed] });

                    if (!quarantineRole) {
                        try {
                            quarantineRole = await guild.roles.create({
                                name: 'Quarantined',
                                color: '#808080',
                                permissions: [],
                                hoist: false,
                                mentionable: false,
                                reason: 'Anti-Nuke Quick Setup: Creating Quarantine Role'
                            });
                            antiNukeConfigManager.setGuildConfig(guild.id, { quarantineRoleID: quarantineRole.id });
                            updates[updates.findIndex(f => f.name === 'Quarantine Role')].value = `✅ Created <@&${quarantineRole.id}>.`;
                        } catch (e) {
                            console.error('Error creating quarantine role during quicksetup:', e);
                            updates[updates.findIndex(f => f.name === 'Quarantine Role')].value = '❌ Failed to create quarantine role. Check bot permissions (Manage Roles).';
                            initialEmbed.setColor('Red');
                        }
                    } else {
                        updates[updates.findIndex(f => f.name === 'Quarantine Role')].value = `✅ Found existing Quarantine Role: <@&${quarantineRole.id}>.`;
                    }
                    initialEmbed.setFields(updates);
                    await interaction.editReply({ embeds: [initialEmbed] });


                    // Step 3: Set up Quarantine Role permissions across channels
                    if (quarantineRole) {
                        updates.push({ name: 'Role Permissions', value: '⬜ Setting up role permissions...' });
                        initialEmbed.setFields(updates);
                        await interaction.editReply({ embeds: [initialEmbed] });

                        try {
                            let allPermsSet = true;
                            await Promise.all(guild.channels.cache.map(async (channel) => {
                                try {
                                    if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildForum || channel.type === ChannelType.GuildMedia) {
                                        await channel.permissionOverwrites.edit(quarantineRole, {
                                            SendMessages: false,
                                            AddReactions: false,
                                            UseApplicationCommands: false,
                                            CreatePublicThreads: false,
                                            CreatePrivateThreads: false,
                                            SendMessagesInThreads: false,
                                            SendVoiceMessages: false
                                        });
                                    } else if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
                                        await channel.permissionOverwrites.edit(quarantineRole, {
                                            Speak: false,
                                            Connect: false,
                                            Stream: false,
                                            UseVAD: false
                                        });
                                    } else if (channel.type === ChannelType.GuildCategory) {
                                        await channel.permissionOverwrites.edit(quarantineRole, {
                                            ViewChannel: false // Deny access to entire category
                                        });
                                    }
                                } catch (e) {
                                    console.error(`Failed to set quarantine permissions for channel ${channel.name} (${channel.id}): ${e.message}`);
                                    allPermsSet = false; // Mark as failed
                                }
                            }));
                            if (allPermsSet) {
                                 updates[updates.findIndex(f => f.name === 'Role Permissions')].value = '✅ Quarantine role permissions set across all channels.';
                            } else {
                                 updates[updates.findIndex(f => f.name === 'Role Permissions')].value = '⚠️ Some quarantine role permissions failed to set. Check bot permissions (Manage Channels, Manage Roles) and channel specific overrides.';
                                 initialEmbed.setColor('Orange'); // Indicate partial success/warning
                            }
                        } catch (error) {
                            console.error('General error setting quarantine role permissions:', error);
                            updates[updates.findIndex(f => f.name === 'Role Permissions')].value = '❌ Failed to set quarantine role permissions. Check bot permissions.';
                            initialEmbed.setColor('Red');
                        }
                    } else {
                        updates.push({ name: 'Role Permissions', value: '⚠️ Skipped: No quarantine role to configure. (Create manually or fix errors above)' });
                        initialEmbed.setColor('Orange');
                    }
                    initialEmbed.setFields(updates);
                    await interaction.editReply({ embeds: [initialEmbed] });


                    // Step 4: Logging Channel Setup
                    updates.push({ name: 'Logging Channel', value: '⬜ Checking logging channel...' });
                    initialEmbed.setFields(updates);
                    await interaction.editReply({ embeds: [initialEmbed] });

                    let loggingChannel = guild.channels.cache.get(config.alertChannel);
                    if (!loggingChannel) {
                        try {
                            loggingChannel = await guild.channels.create({
                                name: 'antinuke-logs',
                                type: ChannelType.GuildText,
                                permissionOverwrites: [
                                    {
                                        id: guild.id, // @everyone role
                                        deny: [PermissionsBitField.Flags.ViewChannel] // Deny @everyone access
                                    },
                                    {
                                        id: client.user.id, // Bot itself
                                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks]
                                    }
                                    // You might want to add permissions for specific staff roles here:
                                    // {
                                    //     id: 'YOUR_STAFF_ROLE_ID', // Replace with an actual staff role ID
                                    //     allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                                    // }
                                ],
                                reason: 'Anti-Nuke Quick Setup: Creating Logging Channel'
                            });
                            antiNukeConfigManager.setGuildConfig(guild.id, { alertChannel: loggingChannel.id });
                            updates[updates.findIndex(f => f.name === 'Logging Channel')].value = `✅ Created <#${loggingChannel.id}> for logs.`;
                        } catch (e) {
                            console.error('Error creating logging channel during quicksetup:', e);
                            updates[updates.findIndex(f => f.name === 'Logging Channel')].value = '❌ Failed to create logging channel. Check bot permissions (Manage Channels).';
                            initialEmbed.setColor('Red');
                        }
                    } else {
                        updates[updates.findIndex(f => f.name === 'Logging Channel')].value = `✅ Found existing Logging Channel: <#${loggingChannel.id}>.`;
                    }
                    initialEmbed.setFields(updates);
                    await interaction.editReply({ embeds: [initialEmbed] });

                    // Finalizing
                    const endTime = Date.now();
                    const duration = ((endTime - startTime) / 1000).toFixed(1);

                    initialEmbed
                        .setDescription('Setup Finished! The setup finished successfully in ' + duration + 's.')
                        .setFooter({ text: 'You can now proceed with setting up other configurations using `/antinuke set`.' });

                    // If no critical errors (Red) or warnings (Orange), set final color to Green
                    if (initialEmbed.data.color !== '#FF0000' && initialEmbed.data.color !== '#FFA500') {
                         initialEmbed.setColor('Green');
                    }

                    await interaction.editReply({ embeds: [initialEmbed] });
                    break;
                }
                case 'set': {
                    const setting = options.getString('setting');
                    const value = options.getString('value');
                    const actionType = options.getString('action_type');

                    let updateSuccess = false;
                    switch (setting) {
                        case 'threshold': {
                            const numValue = parseInt(value);
                            if (isNaN(numValue) || numValue <= 0) {
                                embed.setColor('Red').setDescription('❌ Threshold value must be a positive number.');
                                return interaction.reply({ embeds: [embed], ephemeral: true });
                            }
                            if (actionType) {
                                // Set specific action threshold
                                const currentPunishment = config.punishment[actionType] || {};
                                antiNukeConfigManager.setGuildConfig(guild.id, {
                                    punishment: {
                                        ...(config.punishment || {}), // Ensure punishment object exists
                                        [actionType]: { ...currentPunishment, threshold: numValue }
                                    }
                                });
                                embed.setColor('Green').setDescription(`✅ Threshold for **${actionType.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}** set to \`${numValue}\`.`);
                            } else {
                                // Set default global threshold
                                antiNukeConfigManager.setGuildConfig(guild.id, { defaultThreshold: numValue });
                                embed.setColor('Green').setDescription(`✅ Default anti-nuke threshold set to \`${numValue}\`.`);
                            }
                            updateSuccess = true;
                            break;
                        }
                        case 'punishment_type': {
                            if (!actionType) {
                                embed.setColor('Red').setDescription('❌ You must specify an `action_type` when setting a `punishment_type`.');
                                return interaction.reply({ embeds: [embed], ephemeral: true });
                            }
                            const validPunishmentTypes = ['kick', 'ban', 'quarantine', 'none']; // Define allowed punishment types
                            if (!validPunishmentTypes.includes(value.toLowerCase())) {
                                embed.setColor('Red').setDescription(`❌ Invalid punishment type. Must be one of: ${validPunishmentTypes.join(', ')}.`);
                                return interaction.reply({ embeds: [embed], ephemeral: true });
                            }

                            const currentPunishment = config.punishment[actionType] || {};
                            antiNukeConfigManager.setGuildConfig(guild.id, {
                                punishment: {
                                    ...(config.punishment || {}),
                                    [actionType]: { ...currentPunishment, punishmentType: value.toLowerCase() }
                                }
                            });
                            embed.setColor('Green').setDescription(`✅ Punishment for **${actionType.replace(/_/g, ' ')}** set to \`${value}\`.`);
                            updateSuccess = true;
                            break;
                        }
                        case 'alert_channel': {
                            const channel = guild.channels.cache.get(value);
                            if (!channel || channel.type !== ChannelType.GuildText) {
                                embed.setColor('Red').setDescription('❌ Invalid channel ID provided. Must be a text channel.');
                                return interaction.reply({ embeds: [embed], ephemeral: true });
                            }
                            antiNukeConfigManager.setGuildConfig(guild.id, { alertChannel: channel.id });
                            embed.setColor('Green').setDescription(`✅ Alert channel set to <#${channel.id}>.`);
                            updateSuccess = true;
                            break;
                        }
                        default:
                            embed.setColor('Red').setDescription('❌ Unknown setting.');
                            break;
                    }
                    if (updateSuccess) {
                        await interaction.reply({ embeds: [embed] });
                    } else {
                        if (!interaction.replied && !interaction.deferred) {
                             await interaction.reply({ embeds: [embed], ephemeral: true });
                        }
                    }
                    break;
                }
                default:
                    embed.setColor('Red').setDescription('❌ Unknown anti-nuke subcommand.');
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    break;
            }
        }
    },
};