module.exports = async names => {

    // console.log(`Searching for "${username}"`);

    let arr = await fetch(`https://irk0p9p6ig.execute-api.us-east-1.amazonaws.com/prod/players?type=ostracize&quantity=11917&startIndex=0&reversed=true`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    });

    arr = await arr.json().then(res => res.players.map(e => e.username));

    if (typeof names == 'string') names = [names];

    if (Array.isArray(names))
        return names.map(e => {return {name: e, alive: arr.includes(e)}});
    else
        throw new Error(`Invalid search input: ${names}`);
}