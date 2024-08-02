const getCaptcha = require('./captchas');
module.exports = async (id, email, password) => {

    async function login(captcha) {
        let response = await fetch("https://irk0p9p6ig.execute-api.us-east-1.amazonaws.com/prod/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password,
                recaptcha: captcha
            })
        });
        response = await response.json();
        
        if (!response.token) {
            console.log(`\n------------------${id}------------------`); // VISUAL SEPARATION
            console.log(`Failed to login as ${email}\nResponse:`);
            console.log(response);

            throw new Error(`LOGIN FAIL: Failed to login as ${email}, with response message: ${response.message}`);
        }
        return response.token;
    }

    let captchaToken = await getCaptcha();

    const token = await login(captchaToken);

    return token;
}