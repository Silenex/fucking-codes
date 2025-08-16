// commands/whitelist.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'whitelist',
    description: 'Manages the bot\'s internal whitelist for anti-nuke or other features.',
    usage: '`<prefix>whitelist <add|remove> <user>`',
    aliases: ['wl'],
    permissions: [PermissionsBitField.Flags.Administrator], // Only administrators can manage whitelist

    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Manages the bot\'s internal whitelist for anti-nuke or other features.')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Adds a user to the whitelist.')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to add to the whitelist.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('Removes a user from the whitelist.')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to remove from the whitelist.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('Lists users currently in the whitelist.'))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    async execute(context, args) {
        let action;
        let userTarget;
        let embed = new EmbedBuilder();

        if (context.isChatInputCommand && context.isChatInputCommand()) {
            const interaction = context;
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You must be an administrator to manage the whitelist.')], ephemeral: true });
            }
            action = interaction.options.getSubcommand();
            userTarget = interaction.options.getUser('target'); // Only available for 'add' and 'remove'
            await interaction.deferReply({ ephemeral: false }); // Reply publicly unless sensitive
        } else {
            const message = context;
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You must be an administrator to manage the whitelist.')] });
            }
            action = args[0] ? args[0].toLowerCase() : 'list';
            userTarget = message.mentions.users.first();
        }
        
        // --- IMPORTANT: You need to implement your actual whitelist storage and logic here ---
        // For demonstration, I'll use a dummy array. Replace this with your actual data management.
        const dummyWhitelist = ['123456789012345678', '987654321098765432']; // Example IDs
        
        let replyMessage;

        switch (action) {
            case 'add':
                if (!userTarget) {
                    embed.setColor('Red').setDescription('❌ Please specify a user to add to the whitelist.');
                    break;
                }
                if (dummyWhitelist.includes(userTarget.id)) { // Replace with your whitelist check
                    embed.setColor('Orange').setDescription(`💡 ${userTarget.tag} is already in the whitelist.`);
                } else {
                    // Implement actual logic to add user to whitelist
                    dummyWhitelist.push(userTarget.id); // Example: Adding to dummy
                    embed.setColor('Green').setDescription(`✅ Added ${userTarget.tag} to the whitelist.`);
                }
                break;
            case 'remove':
                if (!userTarget) {
                    embed.setColor('Red').setDescription('❌ Please specify a user to remove from the whitelist.');
                    break;
                }
                if (!dummyWhitelist.includes(userTarget.id)) { // Replace with your whitelist check
                    embed.setColor('Orange').setDescription(`💡 ${userTarget.tag} is not in the whitelist.`);
                } else {
                    // Implement actual logic to remove user from whitelist
                    const index = dummyWhitelist.indexOf(userTarget.id);
                    if (index > -1) dummyWhitelist.splice(index, 1); // Example: Removing from dummy
                    embed.setColor('Green').setDescription(`✅ Removed ${userTarget.tag} from the whitelist.`);
                }
                break;
            case 'list':
            default:
                // Implement actual logic to list whitelist
                const whitelistUsers = dummyWhitelist.length > 0
                    ? dummyWhitelist.map(id => `<@${id}>`).join('\n')
                    : 'No users currently whitelisted.';
                embed.setColor('Blue').setTitle('Whitelisted Users').setDescription(whitelistUsers);
                break;
        }

        try {
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.followUp({ embeds: [embed] });
            } else {
                await context.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error(`Error executing whitelist command with action '${action}':`, error);
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ An error occurred while managing the whitelist.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                context.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(e => {});
            } else {
                context.reply({ embeds: [errorEmbed] }).catch(e => {});
            }
        }
    },
};