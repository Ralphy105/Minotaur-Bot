// const capsolver_key = "CAP-DEBF06E0A4F825746947C499A19A9818";
// const CapSolver = require('node-capsolver');
// const site_key = "6LeoN_cpAAAAANXqDxy6Sp_f78pyuHNvLqSOqMeR";
// const site_url = "https://mschfplaysvenmo.com";

module.exports = {

    reCaptchaData: {
        k: "6LeoN_cpAAAAANXqDxy6Sp_f78pyuHNvLqSOqMeR",
        co: "aHR0cHM6Ly9tc2NoZnBsYXlzdmVubW8uY29tOjQ0Mw..",
        v: "5VlvD-iBu8lCD1bRhHoe_TTl",
        cb: "aguv373qggkw",
        reason: "q",
        hl: "en",
        size: "invisible",
    },

    async getToken() {

        try {
            let grabToken = await fetch(`https://www.google.com/recaptcha/enterprise/anchor?k=${this.reCaptchaData.k}&co=${this.reCaptchaData.co}&v=${this.reCaptchaData.v}&cb=${this.reCaptchaData.cb}&size=invisible`);
        
            grabToken = await grabToken.text();
            let captchaToken = grabToken.split('recaptcha-token" value="')[1].split('">')[0];
        
            let solveCaptchaPayload = {
                ...this.reCaptchaData,
                c: captchaToken
            };
        
            let requestToken = await fetch("https://www.google.com/recaptcha/api2/reload", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams(solveCaptchaPayload).toString()
            });
        
            requestToken = await requestToken.text();

            return JSON.parse(requestToken.replace(")]}'\n", ""))[1];

        } catch (e) {
            try {
                const tropCaptcha = await fetch("https://mschfpartyvote.com/secretbrrboo", {
                    method: "PUT",
                    headers: {
                        authkeylmao: "!LZuAwD)e@v3Kab2CUSgNH9EUw7&)Gbv@Wp$vI!vk@JpB9Bpw#frqrY%yMscYPe^"
                    }
                });
    
                const captcha = await tropCaptcha.json();
    
                return captcha.data;
            } catch {
                const fail = 'CAPTCHA FAIL';
                console.log(fail);
                throw new Error(fail, { cause: e });
            }
        }
    }
}