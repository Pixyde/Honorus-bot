const matches = require("../differents-matches")

module.exports = (client) => {
    setInterval(async () => {

        const guild = client.guilds.cache.get('1050150840813498401');
        guild.members.fetch();

        const allmatch = await matches.
        where('_notified').equals(0).
        where('_startDate').lt(Date.now()).
        where('_endDate').gt(Date.now())

        allmatch.forEach(element => {
            const team1Members = guild.roles.cache.get(element._team1).members.map(m => m.user.id)
            const team2Members = guild.roles.cache.get(element._team2).members.map(m => m.user.id)
            
            team1Members.forEach(async member => {
                const user = await client.users.fetch(member)
                user.send('You have a new match against ' + guild.roles.cache.get(element._team2).name + '! \n You have until the ' + element._endDate.toLocaleString("fr-FR") + ' to do your BO3 against the other team. \n Use the /matchdisponibilities command to tell us your disponibilities.')
            })

            team2Members.forEach(async member => {
                const user = await client.users.fetch(member)
                user.send('You have a new match against ' + guild.roles.cache.get(element._team1).name + '! \n You have until the ' + element._endDate.toLocaleString("fr-FR") + ' to do your BO3 against the other team. \n Use the /matchdisponibilities command to tell us your disponibilities.')
            })

            matches.findByIdAndUpdate(element._id, {_notified: 1}, function (err) {
                if (err) {
                    console.log(err)
                }
            })

        })
    }, 5000)
}