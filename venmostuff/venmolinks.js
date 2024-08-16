const fs = require('node:fs');

(async () => {
    const { client } = await require('../index');

    const names = fs.readFileSync('./venmostuff/venmos.txt','utf-8').toLowerCase().split('\n');

    const bading = await client.users.fetch('333592723166724106');

    for (let i = 0; i < 50; i++) {
        const name = names[i];
        const link = `https://venmo.com/?txn=pay&recipients=${name}&amount=0.01&audience=private&note=MSCHF%20Plays%20Venmo%20is%20struggling%20against%20bots.%20The%20Minotaur%20Group%20is%20dead%20set%20on%20taking%20out%20fake%2C%20nonhuman%20players.%20Earn%20a%20share%20of%20the%20prize%20without%20lifting%20a%20finger%2C%20by%20joining%20our%20autovoter!%20Join%20us%2C%20and%20be%20part%20of%20the%20most%20successful%20group%20in%20the%20game.%20discord.gg%2FntVkuRDjBg`;

        bading.send(`#${i} -- [\`${name}\`](<${link}>)`);
    }
})();

// const fs = require('node:fs');
// const { QuickDB } = require("quick.db");

// const db = new QuickDB({ filePath: "venmos.sqlite" });
// const names = fs.readFileSync('./venmostuff/venmos.txt','utf-8').toLowerCase().split('\n');

// (async () => {
//     for (const name of names) {
//         const ven = await db.get(name);

//         console.log(ven);
//     }
// })();