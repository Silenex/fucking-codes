// commands/purge.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'purge',
    description: 'Deletes a specified number of messages from the channel.',
    usage: '`<prefix>purge <amount>`',
    aliases: ['clear', 'cl'],
    permissions: [PermissionsBitField.Flags.ManageMessages],

    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Deletes a specified number of messages from the channel.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The number of messages to delete (1-99).')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(99))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

    async execute(context, args) {
        let amount;
        let channel = context.channel;

        if (context.isChatInputCommand && context.isChatInputCommand()) {
            const interaction = context;
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return interaction.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You do not have permission to use this command.')], ephemeral: true });
            }
            amount = interaction.options.getInteger('amount');
            await interaction.deferReply({ ephemeral: true });
        } else {
            const message = context;
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You do not have permission to use this command.')] });
            }
            amount = parseInt(args[0]);
        }

        if (isNaN(amount) || amount < 1 || amount > 99) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ You need to specify a number between 1 and 99 messages to delete.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        try {
            const fetched = await channel.messages.fetch({ limit: amount + 1 });
            const messagesToDelete = fetched.filter(msg => Date.now() - msg.createdTimestamp < 1209600000); // 14 days in ms

            if (messagesToDelete.size === 0) {
                 const errorEmbed = new EmbedBuilder().setColor('Orange').setDescription('💡 No messages found within the last 14 days to delete, or none matching your criteria.');
                if (context.isChatInputCommand && context.isChatInputCommand()) {
                    return context.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    return context.reply({ embeds: [errorEmbed] });
                }
            }

            await channel.bulkDelete(messagesToDelete, true);

            const successEmbed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(`✅ Successfully deleted ${messagesToDelete.size - 1} messages.`)
                .setFooter({ text: 'This message will self-destruct in 5 seconds.' });

            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.followUp({ embeds: [successEmbed] }).then(msg => {
                    setTimeout(() => msg.delete().catch(e => {}), 5000);
                }).catch(e => console.error("Error sending/deleting purge follow-up:", e));
            } else {
                await context.reply({ embeds: [successEmbed] }).then(msg => {
                    setTimeout(() => msg.delete().catch(e => {}), 5000);
                }).catch(e => console.error("Error sending/deleting purge reply:", e));
            }

        } catch (error) {
            console.error(`Error purging messages:`, error);
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ There was an error trying to purge messages. Make sure I have "Manage Messages" permissions.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }
    },
};