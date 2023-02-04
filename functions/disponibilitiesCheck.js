const matchesSchema = require('../differents-matches')
const disponibilitiesSchema = require('../disponibilities')

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

module.exports = (client) => {
    setInterval(async () => {

        const guild = client.guilds.cache.get('1050150840813498401');
        guild.members.fetch();

        const allmatch = await matchesSchema.
        where('_notified').equals(1).
        where('_startDate').lt(Date.now()).
        where('_endDate').gt(Date.now()).
        where('_choosedDate').equals(null)

        

        allmatch.forEach(async element => {
            const team1Members = guild.roles.cache.get(element._team1).members.map(m => m.user.id)
            const team2Members = guild.roles.cache.get(element._team2).members.map(m => m.user.id)
            const captain = guild.roles.cache.get('1053422811588329604').members.map(m => m.user.id)

            const dayNumber = 1 + (element._endDate - element._startDate) / 86400000
            const team1Timetable = []
            const team1Disponibilities = await disponibilitiesSchema.
            where('_matchID').equals(element.id).
            where('_teamID').equals(element._team1)
            const team2Timetable = []
            const team2Disponibilities = await disponibilitiesSchema.
            where('_matchID').equals(element.id).
            where('_teamID').equals(element._team2)

            if (team1Disponibilities.length >= 1) {
                var ready = 0
                team1Disponibilities.forEach(user => {
                    if (user._disponibilities.length === dayNumber) {
                        ready += 1
                    }
                })

                if (ready >= 1) {
                    const date = new Date(element._startDate)
                    for (i = 0; i < dayNumber; i++) {
                        const formatedDate = date.toLocaleDateString().substring(0, 10)
                        var from = null
                        var to = null
                        for (y = 0; y < team1Disponibilities.length; y++) {
                            const userDisponibilities = team1Disponibilities[y]._disponibilities.findIndex(o => o.day === formatedDate)                     
                            const userFrom = new Date(formatDate(date) + 'T' + team1Disponibilities[y]._disponibilities[userDisponibilities].from)
                            const userTo = new Date(formatDate(date) + 'T' + team1Disponibilities[y]._disponibilities[userDisponibilities].to)
                            if (from === null && to === null) {
                                from = userFrom
                                to = userTo
                            }
                            else {
                                if (from - userFrom < 0) {
                                    from = userFrom
                                }
                                if (to - userTo > 0) {
                                    to = userTo
                                }
                            }

                        }
                        if (from - to <= -7200000) {
                            team1Timetable.push({ day: formatedDate, from: from.toLocaleTimeString().substring(0, 5), to: to.toLocaleTimeString().substring(0, 5)})
                        }
                        date.setDate(date.getDate() + 1)
                    }
                }
            }            

            if (team1Timetable.length > 0) {
                matchesSchema.findByIdAndUpdate(element._id, {$set: {_team1Disponibilities: team1Timetable,}}, function (err) {
                    if (err) {
                        console.log(err)
                    }
                })
            }

            if (team2Disponibilities.length >= 1) {
                var ready = 0
                team2Disponibilities.forEach(user => {
                    if (user._disponibilities.length === dayNumber) {
                        ready += 1
                    }
                })

                if (ready >= 1) {
                    const date = new Date(element._startDate)
                    for (i = 0; i < dayNumber; i++) {
                        const formatedDate = date.toLocaleDateString().substring(0, 10)
                        var from = null
                        var to = null
                        for (y = 0; y < team2Disponibilities.length; y++) {
                            const userDisponibilities = team2Disponibilities[y]._disponibilities.findIndex(o => o.day === formatedDate)                     
                            const userFrom = new Date(formatDate(date) + 'T' + team2Disponibilities[y]._disponibilities[userDisponibilities].from)
                            const userTo = new Date(formatDate(date) + 'T' + team2Disponibilities[y]._disponibilities[userDisponibilities].to)
                            if (from === null && to === null) {
                                from = userFrom
                                to = userTo
                            }
                            else {
                                if (from - userFrom < 0) {
                                    from = userFrom
                                }
                                if (to - userTo > 0) {
                                    to = userTo
                                }
                            }

                        }
                        if (from - to <= -7200000) {
                            team2Timetable.push({ day: formatedDate, from: from.toLocaleTimeString().substring(0, 5), to: to.toLocaleTimeString().substring(0, 5)})
                        }
                        date.setDate(date.getDate() + 1)
                    }
                }
            }

            if (team2Timetable.length > 0) {
                matchesSchema.findByIdAndUpdate(element._id, {$set: {_team2Disponibilities: team1Timetable,}}, function (err) {
                    if (err) {
                        console.log(err)
                    }
                })
            }

            if (team1Timetable.length > 0 && team2Timetable.length > 0) {
                const team1Members = guild.roles.cache.get(element._team1).members.map(m => m.user.id)
                const team2Members = guild.roles.cache.get(element._team2).members.map(m => m.user.id)
                const captain = guild.roles.cache.get('1053422811588329604').members.map(m => m.user.id)
    
                team1Members.forEach(async member => {
                    const user = await client.users.fetch(member)
                    if (captain.includes(member)) {
                        user.send('You can now choose a date for your match agains ' + guild.roles.cache.get(element._team2).name + ' with the command \'/choosematchdate\'')
                    }
                })
                team2Members.forEach(async member => {
                    const user = await client.users.fetch(member)
                    if (captain.includes(member)) {
                        user.send('You can now choose a date for your match agains ' + guild.roles.cache.get(element._team1).name + ' with the command \'/choosematchdate\'')
                    }
                })
                matchesSchema.findByIdAndUpdate(element._id, {_notified: 2}, function (err) {
                    if (err) {
                        console.log(err)
                    }
                })    
            }
        }) 
    }, 5000)
}