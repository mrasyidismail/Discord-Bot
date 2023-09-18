const { pino } = require('pino');

module.exports = pino({
    level: 'trace',
    timestamp: () => `,"time": "${new Date().toLocaleTimeString()}"`,
});