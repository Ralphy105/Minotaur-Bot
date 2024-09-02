const { CronJob } = require('cron');

module.exports = (client) => {
    const hourlyJob = new CronJob('10 0 * * * *', require('./hourly').bind(null, client));
    hourlyJob.start();

    const protectJob = new CronJob('10/20 * * * *', require('./checkDanger').bind(null, client));
    protectJob.start();

    const tokenJob = new CronJob('0 0 1,11,21 * *', require('./resetTokens'));
    tokenJob.start();

    const voteMsg = new CronJob('1,10,30,50 * * * *', require('./updateMessages').targetMessage.bind(null, client));
    voteMsg.start();

    const voteMinute = Math.floor(client.voteOffset / 60);
    const voteSecond = Math.floor(client.voteOffset % 60);
    const captchaMinute = (voteMinute+59)%60;
    const captchas = [];
    const captchaJob = new CronJob(`${voteSecond} ${captchaMinute} * * * *`, async () => {
        if (client.voteState != 'Off') await require('./captchaJob')(captchas, 50);
    });
    captchaJob.start();

    const voteJob = new CronJob(`${voteSecond} ${voteMinute} * * * *`, async () => {
        if (client.voteState != 'Off') await require('../runVotes')(client, 'ostracize', undefined, captchas);
        captchas.length = 0;
	});
	voteJob.start();
};