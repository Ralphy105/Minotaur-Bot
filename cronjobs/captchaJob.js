const getCaptcha = require('../captchas');
// TODO use mongo to dynamically get correct number of captchas

module.exports = async (captchas, num) => {
    try {
        for (let i = 0; i < num; i++) {
            const captcha = await getCaptcha.getToken();
            captchas.push(captcha);
        }
    } catch (e) {
        console.log(`Error filling captchas: ${e}`);
    }
}