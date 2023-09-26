const { Character_AI } = require('../config.json');
const logger = require('./logger');

module.exports = {
    Talk: async function(text, message, client, characterAI) {

        if (text.startsWith(client.user.toString())) text = text.substring(client.user.toString().length).trim();
        let template;
        switch (Character_AI.chatMode.template) {
            case true:
                template = `(OOC: This message was sent by ${message.author.globalName || message.author.username})\n\nMessage: ${text}\n\n(OOC: If the message is empty, you can act like it's an empty message)`;
                break;
            case false:
                template = text;
                break;
            default:
                logger.warn({
                    chatMode: Character_AI.chatMode,
                }, 'Character AI chatMode template is not set or is invalid!\nCurrent config:');
                return;
        }

        await message.channel.sendTyping();
        const chat = await characterAI.createOrContinueChat(Character_AI.ID);
        const response = await chat.sendAndAwaitResponse(template, true);

        try {
            await message.reply(response.text);
        }
        catch (e) {
            logger.error({
                e,
            }, 'Character AI ERROR');
        }

    },
};