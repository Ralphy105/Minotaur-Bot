const getCaptcha = require('./captchas');

module.exports = async (av, target, type, captchaToken) => {

    if (!captchaToken) {
        console.log('Generating captcha');
        try {
            captchaToken = await getCaptcha.getToken();
        } catch (error) {
            return 'CAPTCHA FAIL';
        }
    }

    const ostracizeVote = await fetch("https://irk0p9p6ig.execute-api.us-east-1.amazonaws.com/prod/vote", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            recaptcha: captchaToken,
            token: av.token,
            type: type,
            username: target
        })
    });

    const response = await ostracizeVote.json();

    console.log(`\n------------------${av.email}------------------\nDiscord: ${av.discordId}`); // VISUAL SEPARATION

    if (response.success) {
        console.log(`Successfully voted for ${target}\nSent at: ${response.lastOstracizeVoteTime}`);
        return true;
    } else {
        console.log(`Failed to vote for ${target}\nResponse: ${response.message}`);        
        return response.message;
    }
}