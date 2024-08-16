const fs = require('node:fs');
const search = require('./search');
const parseWhitelist = require('./parseWhitelist');

const filename = 'temp.txt';

(async () => {
    let targets = await search(fs.readFileSync(filename,'utf8').toLowerCase().split('\r\n'));
    targets = targets.filter(e => e.alive).map(e => e.name);
    const whitelist = await parseWhitelist(true);
    
    const protected = [];
    const results = [];

    for (const name of targets) {

        if (whitelist.includes(name)) {
            protected.push(name);
        } else {
            results.push(name);
        }
    }

    console.log(protected);

    fs.writeFile(filename, results.join('\r\n'), err => {
        if (err) console.log(`FileIO error occurred: ${err.message}`);
    });
})();