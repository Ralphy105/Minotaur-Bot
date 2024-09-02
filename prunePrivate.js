const fs = require('node:fs');
const parseList = require('./parseList');
const parseWhitelist = require('./parseWhitelist');

module.exports = async (filename, filterWhitelist) => {
    let targets = await parseList.searched(filename);
    const invalids = targets.filter(e => !e.alive).map(e => e.name);
    targets = targets.filter(e => e.alive).map(e => e.name);
    
    const protected = [];
    let results = [];

    if (filterWhitelist) {
        const whitelist = await parseWhitelist();
        for (const name of targets) {

            if (whitelist.includes(name)) {
                protected.push(name);
            } else {
                results.push(name);
            }
        }
    } else {
        results = targets;
    }

    if (process.argv[2]) console.log(`Whitelist: ${protected.join('\n')}\nInvalid: ${invalids.join('\n')}`);

    fs.writeFile(filename, results.join('\r\n'), err => {
        if (err) console.log(`FileIO error occurred: ${err.message}`);
    });
};

if (process.argv[2]) module.exports(process.argv[2], process.argv[3]);