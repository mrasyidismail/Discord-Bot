const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency!'),
    async execute(interaction) {
        const user = interaction.user;
        const avatar = user.displayAvatarURL();
        const ping = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const embed = new EmbedBuilder()
            .setTitle('Pong!')
            .setDescription(`Latency: ${interaction.client.ws.ping}ms\nAPI Latency: ${ping.createdTimestamp - interaction.createdTimestamp}ms`)
            .setColor(0x0099FF)
            .setTimestamp()
            .setFooter({ text: `${user.username}`, iconURL: avatar });

        await interaction.editReply({ content: '', embeds: [embed] });
    },
};
