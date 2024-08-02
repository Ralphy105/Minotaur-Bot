const fs = require('node:fs');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const { CronJob } = require('cron');
// const voter = require("./voter");
// const userExists = require("./search");
// const getTarget = require("./selectTarget");
// const vote = require('./runVotes');
// const renewTokens = require('./loginTokens');
const { MongoClient } = require('mongodb');
const { connectURI } = require('./config.json');
const { capsolver_key } = require('./config.json');
const site_key = "6LeoN_cpAAAAANXqDxy6Sp_f78pyuHNvLqSOqMeR";
const site_url = "https://mschfplaysvenmo.com";
const getCaptcha = require('./captchas');
const check = require('./checkWhitelist');

(async () => {
    const arr = [];
    const max = 1;
    for (let i=0;i<max;i++) {
        const captcha = await getCaptcha();
        arr.push(captcha);
    }
    const start = new Date();
    for (let i = 0; i < max; i++) {

        const ostracizeVote = await fetch("https://irk0p9p6ig.execute-api.us-east-1.amazonaws.com/prod/vote", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                recaptcha: arr[i],
                token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1sZ3JhbHBoeTEwNUBnbWFpbC5jb20iLCJ1c2VybmFtZSI6ImdhcmJhZ2UtbWFuIiwicGFpZCI6dHJ1ZSwiaWF0IjoxNzIyMzMzMjk1LCJleHAiOjE3MjM1NDI4OTV9.wDE28P0Q5Z4cq6H5QezOpYRXz_42IfNoqJE6RQNQKQw",
                type: "ostracize",
                username: "god"
            })
        });

        response = await ostracizeVote.json();

        console.log(response);
    }
    console.log(`${new Date() - start} ms`);
})();