// commands/ping.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Checks the bot\'s latency to the Discord API.',
    usage: '`<prefix>ping`',
    aliases: ['p'], 
    permissions: [], 

    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Checks the bot\'s latency to the Discord API.'),

    async execute(context, args, client) { 
        if (context.isChatInputCommand && context.isChatInputCommand()) {
            const interaction = context;
            const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true, ephemeral: false });
            const latency = sent.createdTimestamp - interaction.createdTimestamp;
            await interaction.editReply(`Pong! 🏓 Latency is ${latency}ms. API Latency is ${interaction.client.ws.ping}ms.`);
        } else {
            const message = context;
            const sent = await message.reply('Pinging...');
            const latency = sent.createdTimestamp - message.createdTimestamp;
            await sent.edit(`Pong! 🏓 Latency is ${latency}ms. API Latency is ${client.ws.ping}ms.`);
        }
    },
};