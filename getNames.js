const fs = require('node:fs');

(async () => {
    let list = await fetch(`https://irk0p9p6ig.execute-api.us-east-1.amazonaws.com/prod/players?type=ostracize&quantity=100&startIndex=5000&reversed=true`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    });

    list = await list.json();

    let names = list.players;

    for (let i = 0; i < names.length; i++) {
        names[i] = names[i].username;
        console.log("\`"+names[i]+"\`");
    }

    // console.log(names);

    // fs.writeFileSync('list.json', JSON.stringify(list), (err) => {console.error(err)});
})();