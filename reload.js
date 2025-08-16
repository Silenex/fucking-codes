// commands/reload.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('node:path');

module.exports = {
    name: 'reload',
    description: 'Reloads a specific command file.',
    usage: '`<prefix>reload <command_name>`',
    aliases: ['rl'],
    ownerOnly: true, // <--- THIS MAKES IT OWNER-ONLY
    permissions: [],

    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reloads a specific command file.')
        .addStringOption(option =>
            option.setName('command_name')
                .setDescription('The name of the command to reload.')
                .setRequired(true)),

    async execute(context, args, client) {
        const commandName = context.isChatInputCommand && context.isChatInputCommand() 
            ? context.options.getString('command_name').toLowerCase() 
            : args[0] ? args[0].toLowerCase() : null;

        if (!commandName) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ Please provide the name of the command to reload.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.reply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`❌ There is no command or alias with name \`${commandName}\`.`);
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.reply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        const commandFilePath = path.join(__dirname, `${command.name}.js`); // Use command.name, not commandName (could be alias)

        delete require.cache[require.resolve(commandFilePath)]; // Remove from cache

        try {
            const newCommand = require(commandFilePath);
            client.commands.set(newCommand.name, newCommand);
            if (newCommand.aliases && Array.isArray(newCommand.aliases)) {
                newCommand.aliases.forEach(alias => client.aliases.set(alias, newCommand.name));
            }

            const successEmbed = new EmbedBuilder().setColor('Green').setDescription(`✅ Command \`${newCommand.name}.js\` was reloaded!`);
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.reply({ embeds: [successEmbed] });
            } else {
                await context.reply({ embeds: [successEmbed] });
            }
        } catch (error) {
            console.error(`Error reloading command ${command.name}:`, error);
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(`❌ There was an error while reloading command \`${command.name}.js\`:\n\`\`\`${error.message}\`\`\``);
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.reply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await context.reply({ embeds: [errorEmbed] });
            }
        }
    },
};