const getCaptcha = require('./captchas');

module.exports = async (id, token, target, type, captchaToken) => {

    if (!captchaToken) {
        try {
            captchaToken = await getCaptcha();
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
            token: token,
            type: type,
            username: target
        })
    });

    response = await ostracizeVote.json();

    console.log(`\n------------------${id}------------------`); // VISUAL SEPARATION

    if (response.success) {
        console.log(`Successfully voted for ${target}\nResponse:`);
        console.log(response);
        return true;
    } else {
        console.log(`Failed to vote\nResponse:`);
        console.log(response);
        
        return response.message;
    }
}