const fs = require('node:fs');
const search = require('./search');
const parseWhitelist = require('./parseWhitelist');

(async (filename) => {
    let targets = await search(fs.readFileSync(filename,'utf8').toLowerCase().split('\r\n'));
    const invalids = targets.filter(e => !e.alive).map(e => e.name);
    targets = targets.filter(e => e.alive).map(e => e.name);
    const whitelist = await parseWhitelist(process.argv[3]);
    
    const protected = [];
    const results = [];

    for (const name of targets) {

        if (whitelist.includes(name)) {
            protected.push(name);
        } else {
            results.push(name);
        }
    }

    console.log(`Whitelist: ${protected.join('\n')}\nInvalid: ${invalids.join('\n')}`);

    fs.writeFile(filename, results.join('\r\n'), err => {
        if (err) console.log(`FileIO error occurred: ${err.message}`);
    });
})(process.argv[2]);