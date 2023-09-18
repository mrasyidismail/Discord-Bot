const { Events, ActivityType } = require('discord.js');
const { Character_AI, discord } = require('../../config.json');
const logger = require('../../modules/logger');
const CharacterAI = require('node_characterai');
const characterAI = new CharacterAI();

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        /**
         * Use guest if you don't want to authenticate
         * await characterAI.authenticateAsGuest();
         */
        await characterAI.authenticateWithToken(Character_AI.TOKEN);

        logger.info({
            client: {
                user: client.user.tag,
                guilds: client.guilds.cache.map(e => ({
                    name: e.name,
                    members: e.memberCount,
                })),
            },
        }, 'Client Ready');

        setInterval(async () => {
            await client.user.setPresence({
                activities: [{
                    type: ActivityType.Listening,
                    name: 'your conversations',
                }],
                status: 'idle',
            });
        }, 5000);

        client.on(Events.MessageCreate, async (message) => {
            const text = message.content;
            if (message.author.bot || text < 0) return;

            if (!message.guild) {
                logger.info({
                    message: {
                        user: message.author.username,
                        content: message.content,
                    },
                    attachments: message.attachments.map(e => ({
                        url: e.url,
                        type: e.contentType,
                    })) || [],
                    stickers: message.stickers.map(e => ({
                        name: e.name,
                        url: e.url,
                    })) || [],
                }, 'MessageCreate (DM)');
                return await Talk(text, message, client);
            }

            logger.info({
                guild: {
                    name: message.guild.name,
                    id: message.guildId,
                },
                message: {
                    user: message.author.username,
                    content: message.content,
                },
                attachments: message.attachments.map(e => ({
                    url: e.url,
                    type: e.contentType,
                })) || [],
                stickers: message.stickers.map(e => ({
                    name: e.name,
                    url: e.url,
                })) || [],
            }, 'MessageCreate (Guild)');

            if (text.startsWith('#')) return;

            switch (Character_AI.chatMode.type) {
                case 'mention':
                    if (message.mentions?.repliedUser?.id == client.user.id) return await Talk(text, message, client);
                    if (text.startsWith(!client.user.toString())) return;
                    await Talk(text, message, client);
                    break;
                case 'channel':
                    if (message.channelId != Character_AI.chatMode.channelId) {
                        logger.warn({
                            chatMode: Character_AI.chatMode,
                        }, 'Character AI chatMode channel id is not set or is invalid!\nCurrent config:');
                        return;
                    }
                    await Talk(text, message, client);
                    break;
                case 'hybrid':
                    if (message.mentions?.repliedUser?.id == client.user.id || message.channelId == Character_AI.chatMode.channelId || text.startsWith(client.user.toString())) return await Talk(text, message, client);
                    break;
                default:
                    logger.warn({
                        chatMode: Character_AI.chatMode,
                    }, 'Character AI chatMode is not set or is invalid!\nCurrent config:');
                    break;
            }
        });
    },
};

async function Talk(text, message, client) {
    await message.channel.sendTyping();

    if (text.startsWith(client.user.toString())) text = text.substring(client.user.toString().length).trim();

    let template = `(OOC: This message was sent by ${message.author.globalName || message.author.username})\n\nMessage: ${text}\n\n(OOC: If the message is empty, you can act like it's an empty message)`;
    if (message.author.id == discord.ownerID) template = text;

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

}