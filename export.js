const parseWhitelist = require('./parseWhitelist');
const fs = require('fs');
const search = require('./search');

const filename = 'temp.txt';

(async () => {
    const wl = await parseWhitelist(true);

    console.log(wl.join('\n'));
})();