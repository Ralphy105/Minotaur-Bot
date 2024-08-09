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
    const mongo = new MongoClient(connectURI);
    try {
        await mongo.connect();
        const avCol = mongo.db('Minotaur').collection('Autovoters');

        const result = await avCol.updateMany({hasVoted: true}, {$set: {hasVoted: false}});

        console.log(result);
    } catch (e) {

    } finally {
        await mongo.close();
    }
})();