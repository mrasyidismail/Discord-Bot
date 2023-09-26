const { Events, ActivityType } = require('discord.js');
const { Talk } = require('../../modules/request');
const { Character_AI } = require('../../config.json');
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
                    await Talk(text, message, client, characterAI);
                    break;
                case 'channel':
                    if (message.channelId != Character_AI.chatMode.channelId) {
                        logger.warn({
                            chatMode: Character_AI.chatMode,
                        }, 'Character AI chatMode channel id is not set or is invalid!\nCurrent config:');
                        return;
                    }
                    await Talk(text, message, client, characterAI);
                    break;
                case 'hybrid':
                    if (message.mentions?.repliedUser?.id == client.user.id || message.channelId == Character_AI.chatMode.channelId || text.startsWith(client.user.toString())) return await Talk(text, message, client, characterAI);
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