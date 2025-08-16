// commands/help.js
const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    InteractionResponseFlags // For ephemeral replies
} = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Displays all available commands and modules.',
    usage: '`/help` or `<prefix>help`',
    aliases: ['h', 'commands'],
    category: 'General', // Assign a category to the help command itself
    permissions: [], // No specific permissions required, as it's a help command

    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays all available commands and modules.')
        .addStringOption(option =>
            option.setName('module')
                .setDescription('Get help for a specific module.')
                .setRequired(false) // Make it optional for the initial overview
                .setAutocomplete(true) // Enable autocomplete for modules
        ),

    async autocomplete(interaction, client) {
        const focusedValue = interaction.options.getFocused();
        const choices = [];
        const uniqueCategories = new Set();

        client.commands.forEach(command => {
            if (command.category) {
                uniqueCategories.add(command.category);
            }
        });

        // Add predefined categories if they don't have commands yet
        const predefinedCategories = [
            'Antinuke', 'Extra', 'General', 'Giveaways', 'Moderation', 'Music',
            'Ignore', 'Media', 'Invites', 'Raidmode', 'Voice', 'Games', 'Welcomer',
            'Owner', 'Information', 'Utility'
        ];
        predefinedCategories.forEach(cat => uniqueCategories.add(cat));

        const filtered = Array.from(uniqueCategories)
            .filter(category => category.toLowerCase().includes(focusedValue.toLowerCase()))
            .map(category => ({ name: category, value: category }));

        await interaction.respond(filtered);
    },

    async execute(context, args, client) {
        const isSlashCommand = context.isChatInputCommand();
        const guildId = context.guild.id;
        const currentPrefix = client.prefixManager.getPrefix(guildId);
        const totalCommands = client.commands.size; // Get total number of commands

        const user = context.user || context.author; // Get the user who invoked the command

        // Mapping categories to emojis
        const categoryEmojis = {
            'Antinuke': '🛡️',
            'Extra': '✨',
            'General': '💬',
            'Giveaways': '🎁',
            'Moderation': '🛠️',
            'Music': '🎵',
            'Ignore': '🙈',
            'Media': '🖼️',
            'Invites': '💼', // Using 'Invites' for 'InvC'
            'Raidmode': '🚨',
            'Voice': '🎙️',
            'Games': '🎮',
            'Welcomer': '👋',
            'Owner': '👑', // Added for owner commands
            'Information': 'ℹ️',
            'Utility': '⚙️',
            'Uncategorized': '❓' // Fallback for commands without a category
        };

        const moduleOption = isSlashCommand ? context.options.getString('module') : (args[0] || '').toLowerCase();

        // --- Generate Main Help Embed (Overview) ---
        if (!moduleOption) {
            const helpOverviewEmbed = new EmbedBuilder()
                .setColor('#0099ff') // A common Discord blue color
                .setAuthor({
                    name: `${user.username}`,
                    iconURL: user.displayAvatarURL({ dynamic: true })
                })
                .setTitle('Help Command Overview') // No emoji as per description
                .setDescription(
                    `The prefix for this server is \`${currentPrefix}\`\n` +
                    `Type \`/help <module>\` or \`${currentPrefix}help <command/module>\` to get more info regarding it.\n` +
                    `\n**${totalCommands}** Commands`
                );

            // Group commands by category
            const categories = new Map();
            client.commands.forEach(command => {
                const category = command.category || 'Uncategorized';
                if (!categories.has(category)) {
                    categories.set(category, []);
                }
                categories.get(category).push(command.name);
            });

            // Sort categories for consistent display
            const sortedCategories = Array.from(categories.keys()).sort((a, b) => {
                // Prioritize specific categories, then alphabetical
                const order = ['Antinuke', 'Moderation', 'General', 'Utility', 'Information', 'Owner'];
                const aIndex = order.indexOf(a);
                const bIndex = order.indexOf(b);
                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                return a.localeCompare(b);
            });

            let modulesFieldContent = '';
            for (const category of sortedCategories) {
                const emoji = categoryEmojis[category] || categoryEmojis['Uncategorized'];
                // Only list categories if they actually have commands
                if (categories.has(category) && categories.get(category).length > 0) {
                     modulesFieldContent += `**${emoji} ${category}**\n`;
                }
            }

            helpOverviewEmbed.addFields({
                name: 'Modules',
                value: modulesFieldContent || 'No modules found.',
                inline: false
            });

            // Footer
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            const dateString = now.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

            helpOverviewEmbed.setFooter({
                text: `Made By ofcyourpython • Today at ${timeString}`
            });

            // --- Dropdown Menu ---
            const selectOptions = sortedCategories.map(category => ({
                label: category,
                description: `View commands in the ${category} module.`,
                value: category.toLowerCase(), // Use lowercase for value
                emoji: categoryEmojis[category] || '❓'
            }));

            // Filter out categories with no commands if desired for dropdown
            // selectOptions = selectOptions.filter(option => categories.has(option.label) && categories.get(option.label).length > 0);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help_module_select')
                .setPlaceholder('Select Module To Get Help For That Module.')
                .addOptions(selectOptions);

            const selectRow = new ActionRowBuilder().addComponents(selectMenu);

            // --- Navigation Buttons ---
            const buttonsRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('help_back')
                        .setLabel('⬅️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true), // Disabled by default for overview
                    new ButtonBuilder()
                        .setCustomId('help_stop')
                        .setLabel('🟥') // Red square button
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('help_next')
                        .setLabel('➡️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true), // Disabled by default for overview
                    new ButtonBuilder()
                        .setCustomId('help_fast_forward')
                        .setLabel('⏩')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true) // Disabled by default for overview
                );

            if (isSlashCommand) {
                await context.reply({ embeds: [helpOverviewEmbed], components: [selectRow, buttonsRow] });
            } else {
                await context.reply({ embeds: [helpOverviewEmbed], components: [selectRow, buttonsRow] });
            }
            return;
        }

        // --- Handle Specific Module Help (triggered by dropdown or direct command) ---
        const targetModule = moduleOption.charAt(0).toUpperCase() + moduleOption.slice(1); // Capitalize first letter
        const moduleCommands = client.commands.filter(cmd => (cmd.category || 'Uncategorized').toLowerCase() === moduleOption);

        if (!moduleCommands.size) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`❌ No commands found for the module \`${targetModule}\`.`);
            if (isSlashCommand) return context.reply({ embeds: [embed], ephemeral: true });
            return context.reply({ embeds: [embed] });
        }

        const moduleHelpEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Commands in ${categoryEmojis[targetModule] || '❓'} ${targetModule} Module`)
            .setDescription(
                moduleCommands.map(cmd => {
                    const usage = cmd.usage ? cmd.usage.replace(/`<prefix>`/g, `\`${currentPrefix}\``) : 'No usage info.';
                    const description = cmd.description || 'No description provided.';
                    const aliases = cmd.aliases && cmd.aliases.length > 0 ? ` (Aliases: ${cmd.aliases.join(', ')})` : '';
                    return `**\`${cmd.name}\`** ${aliases}\n> ${description}`;
                }).join('\n\n')
            )
            .setFooter({ text: `Type /help or ${currentPrefix}help for overview.` });

        if (isSlashCommand) {
            await context.reply({ embeds: [moduleHelpEmbed] });
        } else {
            await context.reply({ embeds: [moduleHelpEmbed] });
        }
    },
};