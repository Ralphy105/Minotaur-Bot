// const capsolver_key = "CAP-DEBF06E0A4F825746947C499A19A9818";
// const CapSolver = require('node-capsolver');
// const site_key = "6LeoN_cpAAAAANXqDxy6Sp_f78pyuHNvLqSOqMeR";
// const site_url = "https://mschfplaysvenmo.com";

module.exports = async () => {
    try {
        const tropCaptcha = await fetch("https://mschfpartyvote.com/secretbrrboo", {
            method: "PUT",
            headers: {
                authkeylmao: "!LZuAwD)e@v3Kab2CUSgNH9EUw7&)Gbv@Wp$vI!vk@JpB9Bpw#frqrY%yMscYPe^"
            }
        });

        const captcha = await tropCaptcha.json();

        return captcha.data;
    } catch (e) {
       const fail = 'CAPTCHA FAIL';
        console.log(fail);
        throw new Error(fail, { cause: e });
        // async function solveCaptcha() {
        //     const solver = new CapSolver(capsolver_key);
          
        //     try {
        //       const task = {
        //         type: 'ReCaptchaV3EnterpriseTaskProxyless',
        //         websiteURL: site_url,
        //         websiteKey: site_key,
        //         minScore: 0.3
        //       };
          
        //       const { taskId } = await solver.createTask(task);
        //       console.log('Task created, taskId:', taskId);
          
        //       const { solution } = await solver.getTaskResult(taskId);
        //       console.log('Captcha solved, token:', solution.gRecaptchaResponse);
          
        //       return solution.gRecaptchaResponse;
        //     } catch (error) {
        //       console.error('Error solving captcha:', error);
        //       throw error;
        //     }
        //   }
          
        //   solveCaptcha()
        //     .then(token => {
        //       console.log('Captcha token:', token);
        //     })
        //     .catch(error => {
        //       console.error('Failed to solve captcha:', error);
        //     });
    }
}