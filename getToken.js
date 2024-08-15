const getCaptcha = require('./captchas');
module.exports = async (id, email, password, token) => {

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

    async function prodToken(captcha) {
        let response = await fetch("https://irk0p9p6ig.execute-api.us-east-1.amazonaws.com/prod/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                recaptcha: captcha,
                token: token,
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

    let captchaToken = await getCaptcha.getToken();

    let newToken;
    
    if (token) {
        newToken = await prodToken(captchaToken);
    } else {
        newToken = await login(captchaToken);
    }

    return newToken;
}