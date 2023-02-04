const { SlashCommandBuilder } = require('@discordjs/builders')
const { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Events, ButtonBuilder, ButtonStyle } = require('discord.js')

const matchesSchema = require("../../differents-matches")

function formatDate(date) {
    const [day1, month2, year3] = date.split('/');

    // 👇️ format Date string as `yyyy-mm-dd`
    const isoFormattedStr = `${year3}-${month2}-${day1}`;

    var d = new Date(isoFormattedStr),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

module.exports = {
    data: new SlashCommandBuilder()
    .setName('choosematchdate')
    .setDescription('Used to propose a date for a specific match'),

    async execute(interaction, client) {

        const guild = interaction.guild
        guild.members.fetch()

        var match;

        const proposedDate = []

        var globalPropositionRow;

        const allMatches = await matchesSchema.
        where('_notified').equals(2).
        where('_startDate').lt(Date.now()).
        where('_endDate').gt(Date.now()).
        where('_choosedDate').equals(null)

        const sameDisponibilities = []

        if (allMatches.length > 0) {
            const embed = new EmbedBuilder()
            .setTitle('Select a match')
            .setDescription('Click on the match you want to propose a date for')
            .setColor(0x18e1ee)
            .setFooter({ text: 'Menu of ' + interaction.user.tag})

            const componentsMenu = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                    .setCustomId('select')
                    .setPlaceholder('Nothing selected')               
                )

            allMatches.forEach(element => {
                componentsMenu.components[0].addOptions({
                    label: interaction.guild.roles.cache.get(element._team1).name + ' VS ' + interaction.guild.roles.cache.get(element._team2).name,
                    value: element.id,
                    }
                )
            })

            const message = await interaction.reply({embeds: [embed], components: [componentsMenu], fetchReply: true})

            const collector = message.channel.createMessageComponentCollector({
                filter: (u) => {
                    if (u.user.id === interaction.user.id) return true
                    else{
                        return false
                    }
                }            
            })

            collector.on('collect', async (cld) => {
                for (i = 0; i < allMatches.length; i++) {
                    if(cld.values[0] === allMatches[i]._id.toString()){

                        match = allMatches[i]

                        const dayEmbed = new EmbedBuilder()
                        .setTitle(interaction.guild.roles.cache.get(allMatches[i]._team1).name + ' VS ' + interaction.guild.roles.cache.get(allMatches[i]._team2).name)
                        .setDescription('Click on the date you want to propose the match for')
                        .setColor(0x18e1ee)
                        .setFooter({ text: 'Menu of ' + interaction.user.tag})

                        const dayMenu = new ActionRowBuilder().addComponents(
                            new StringSelectMenuBuilder()
                            .setCustomId('select')
                            .setPlaceholder('Nothing selected')  
                            .addOptions({
                                label: 'Propose a differente date',
                                value: 'customDate',
                            })             
                        )
                        
                        const team1Disponibilities = allMatches[i]._team1Disponibilities
                        const team2Disponibilities = allMatches[i]._team2Disponibilities

                        team1Disponibilities.forEach(date => {
                            var from;
                            var to;

                            const team1From = new Date(formatDate(date.day) + 'T' + date.from)
                            const teamlTo = from = new Date(formatDate(date.day) + 'T' + date.to)

                            for (i = 0; i < team2Disponibilities.length; i++) {
                                if (date.day == team2Disponibilities[i].day) {
                                    const team2From = new Date(formatDate(team2Disponibilities[i].day) + 'T' + team2Disponibilities[i].from)
                                    const team2To = from = new Date(formatDate(team2Disponibilities[i].day) + 'T' + team2Disponibilities[i].to)

                                    if (team1From > team2From) {
                                        from = team1From
                                    }
                                    else {
                                        from = team2From
                                    }

                                    if (teamlTo > team2To) {
                                        to = team2To
                                    }
                                    else {
                                        to = teamlTo
                                    }

                                    if (from - to <= -7200000) {
                                        sameDisponibilities.push({ day: date.day, from: from.toLocaleTimeString().substring(0, 5), to: to.toLocaleTimeString().substring(0, 5)})
                                    }
                                }
                            }
                        })

                        if (sameDisponibilities.length > 0) {
                            sameDisponibilities.forEach(date => {
                                dayMenu.components[0].addOptions(
                                    {
                                        label: 'The ' + date.day + ' from ' + date.from + ' to ' + date.to,
                                        value: date.day,
                                    }
                                )
                            })
                        }
                        
                        await cld.reply({embeds: [dayEmbed], components: [dayMenu], fetchReply: true})
                        await interaction.deleteReply()
                        return
                    }
                }
            })
        }
        else {
            await interaction.reply('You have no match to choose a date for')
        }

        var ennemyCaptain;

        client.on(Events.InteractionCreate, async reponse => {
            const propositionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('accept')
                        .setLabel('Accepet')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(false)
                )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('refuse')
                        .setLabel('Refuse')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(false)
                )

            if (reponse.user.id === interaction.user.id){
                if (reponse.isModalSubmit()) {
                    const date1 = reponse.fields.getTextInputValue('fromDate')
                    const date2 = reponse.fields.getTextInputValue('toDate')
                    const day = reponse.fields.getTextInputValue('day')
                    var role;
                    if (interaction.member.roles.cache.has(match._team1)) {
                        role = match._team2
                    }
                    else if (interaction.member.roles.cache.has(match._team2)) {
                        role = match._team1
                    }
                    const teamMembers = guild.roles.cache.get(role).members.map(m => m.user.id)
                    const captain = guild.roles.cache.get('1053422811588329604').members.map(m => m.user.id)

                    teamMembers.forEach(async member => {
                        const user = await client.users.fetch(member)
                        if (captain.includes(member)) {
                            const propositionRow = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('accept')
                                        .setLabel('Accepet')
                                        .setStyle(ButtonStyle.Success)
                                )
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('refuse')
                                        .setLabel('Refuse')
                                        .setStyle(ButtonStyle.Danger)
                                )

                            const propositionEmbed = new EmbedBuilder()
                            .setTitle(interaction.guild.roles.cache.get(match._team1).name + ' VS ' + interaction.guild.roles.cache.get(match._team2).name)
                            .setDescription('The captain of the ennemy team has proposed the date of the ' + formatDate(day) + ' from ' + date1 + ' to ' + date2 + ' for your match')
                            .setColor(0x18e1ee)
                            user.send({embeds: [propositionEmbed], components: [propositionRow]})
                            ennemyCaptain = user
                            proposedDate.push({day: day, from: date1, to: date2, team: interaction.guild.roles.cache.get(role).name})
                        }
                    })

                    reponse.reply('Succesfully sent the proposition to the capitain of the other team')                   
                }
                else if (reponse.isStringSelectMenu()) {
                    if (reponse.values[0] === 'customDate') {
                        const modal = new ModalBuilder()
                        .setCustomId('customDate')
                        .setTitle('Propose a different date')

                        const day = new TextInputBuilder()
                        .setCustomId('day')
                        .setLabel('The:')
                        .setPlaceholder('Put the day in this format YYYY/MM/DD')
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(10)
                        .setMinLength(10)

                        const fromDate = new TextInputBuilder()
                        .setCustomId('fromDate')
                        .setLabel('From')
                        .setPlaceholder('Put the hour in this format HH:MM')
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(5)
                        .setMinLength(5)

                        const toDate = new TextInputBuilder()
                        .setCustomId('toDate')
                        .setLabel('To')
                        .setPlaceholder('Put the hour in this format HH:MM')
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(5)
                        .setMinLength(5)

                        modal.addComponents(new ActionRowBuilder().addComponents(day))
                        modal.addComponents(new ActionRowBuilder().addComponents(fromDate))
                        modal.addComponents(new ActionRowBuilder().addComponents(toDate))

                        reponse.showModal(modal)
                    }
                    else {
                        sameDisponibilities.forEach(date => {
                            if (reponse.values[0] === date.day) {
                                var role;
                                if (interaction.member.roles.cache.has(match._team1)) {
                                    role = match._team2
                                }
                                else if (interaction.member.roles.cache.has(match._team2)) {
                                    role = match._team1
                                }
                                const teamMembers = guild.roles.cache.get(role).members.map(m => m.user.id)
                                const captain = guild.roles.cache.get('1053422811588329604').members.map(m => m.user.id)

                                teamMembers.forEach(async member => {
                                    const user = await client.users.fetch(member)
                                    if (captain.includes(member)) {
                                        const propositionEmbed = new EmbedBuilder()
                                        .setTitle(interaction.guild.roles.cache.get(match._team1).name + ' VS ' + interaction.guild.roles.cache.get(match._team2).name)
                                        .setDescription('The captain of the ennemy team has proposed the date of the ' + formatDate(date.day) + ' from ' + date.from + ' to ' + date.to + ' for your match')
                                        .setColor(0x18e1ee)
                                        user.send({embeds: [propositionEmbed], components: [propositionRow]})
                                        ennemyCaptain = user
                                        proposedDate.push({day: date.day, from: date.from, to: date.to, team: interaction.guild.roles.cache.get(role).name})
                                    }
                                })
                                reponse.reply('Succesfully sent the proposition to the capitain of the other team')
                            }
                        })
                    }
                                        
                }
            }
            else if (reponse.user.id === ennemyCaptain.id) {
                if (reponse.isButton()) {
                    if (reponse.customId === 'accept') {
                        reponse.reply('Date accepted')
                        propositionRow.components[0].setDisabled(true)
                        propositionRow.components[1].setDisabled(true)
                        reponse.message.edit({components: [propositionRow]})
                        const date = new Date(formatDate(proposedDate[0].day) + 'T' + proposedDate[0].from)
                        console.log(date)
                        matchesSchema.findByIdAndUpdate(match._id, {_choosedDate: date}, function (err) {
                            if (err) {
                                console.log(err)
                            }
                        })
                        interaction.user.send('You proposition agains ' + proposedDate[0].team + ' has been accepted. \n Your match will have place the ' + proposedDate[0].day + ' from ' + proposedDate[0].from + ' to ' + proposedDate[0].to)
                    }
                    if (reponse.customId === 'refuse') {
                        reponse.reply('Date refused')
                        propositionRow.components[0].setDisabled(true)
                        propositionRow.components[1].setDisabled(true)
                        reponse.message.edit({components: [propositionRow]})
                        interaction.user.send('You proposition agains ' + proposedDate.team + ' has been refused')
                    }
                }
            }
        });
    }
}