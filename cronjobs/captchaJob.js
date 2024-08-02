const getCaptcha = require('../captchas');
// TODO use mongo to dynamically get correct number of captchas

module.exports = async (captchas) => {
    try {
        for (let i = 0; i < 50; i++) {
            const captcha = await getCaptcha();
            captchas.push(captcha);
        }
    } catch (e) {
    }
}