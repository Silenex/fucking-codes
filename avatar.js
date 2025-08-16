// commands/avatar.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'avatar',
    description: 'Displays a user\'s avatar.',
    usage: '`<prefix>avatar [user]`',
    aliases: ['av', 'pfp'],
    permissions: [],

    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Displays a user\'s avatar.')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user whose avatar you want to see (defaults to yourself).')
                .setRequired(false)),

    async execute(context, args) {
        let user;

        if (context.isChatInputCommand && context.isChatInputCommand()) {
            const interaction = context;
            user = interaction.options.getUser('target') || interaction.user;
        } else {
            const message = context;
            user = message.mentions.users.first() || message.author;
        }

        if (!user) {
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ Could not find that user.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                return context.reply({ embeds: [errorEmbed], ephemeral: true });
            } else {
                return context.reply({ embeds: [errorEmbed] });
            }
        }

        const avatarEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${user.username}'s Avatar`)
            .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setDescription(`[Avatar URL](${user.displayAvatarURL({ dynamic: true, size: 4096 })})`)
            .setFooter({ text: `Requested by ${context.member.user.tag}` })
            .setTimestamp();

        try {
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                await context.reply({ embeds: [avatarEmbed] });
            } else {
                await context.reply({ embeds: [avatarEmbed] });
            }
        } catch (error) {
            console.error('Error sending avatar embed:', error);
            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription('❌ There was an error trying to fetch the avatar.');
            if (context.isChatInputCommand && context.isChatInputCommand()) {
                context.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(e => {});
            } else {
                context.reply({ embeds: [errorEmbed] }).catch(e => {});
            }
        }
    },
};