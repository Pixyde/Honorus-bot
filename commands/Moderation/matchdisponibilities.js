const { SlashCommandBuilder } = require('@discordjs/builders')
const { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Events } = require('discord.js')

const matches = require("../../differents-matches")

const disponibilitiesSchema = require("../../disponibilities")

module.exports = {
    data: new SlashCommandBuilder()
    .setName('matchdisponibilities')
    .setDescription('Used to give your disponibilities for a specific match')
    .setDMPermission(true),

    async execute(interaction, client) {

        const userRoles = interaction.member.roles.cache.map((role) => role.id)
        let allMatches = await matches.
        where('_notified').gt(0).
        where('_startDate').lt(Date.now()).
        where('_endDate').gt(Date.now()).
        where('_choosedDate').equals(null)

        let userMatches = []

        allMatches.forEach(element => {
            userRoles.forEach(role => {
                if (element._team1 === role || element._team2 === role) {
                    userMatches.push(element)
                }
            })
        })

        var match;

        if (userMatches.length > 0) {
            const embed = new EmbedBuilder()
            .setTitle('Select a match')
            .setDescription('Click on the match you want to set your disponibilities for')
            .setColor(0x18e1ee)
            .setFooter({ text: 'Menu of ' + interaction.user.tag})

            const componentsMenu = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                    .setCustomId('select')
                    .setPlaceholder('Nothing selected')               
                )

            userMatches.forEach(element => {
                componentsMenu.components[0].addOptions(
                    {
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
                for (i = 0; i < userMatches.length; i++) {
                    if(cld.values[0] === userMatches[i]._id.toString()){

                        const dayEmbed = new EmbedBuilder()
                        .setTitle(interaction.guild.roles.cache.get(userMatches[i]._team1).name + ' VS ' + interaction.guild.roles.cache.get(userMatches[i]._team2).name)
                        .setDescription('Click on one of the day to set your disponibilities for it')
                        .setColor(0x18e1ee)
                        .setFooter({ text: 'Menu of ' + interaction.user.tag})

                        const dayMenu = new ActionRowBuilder().addComponents(
                            new StringSelectMenuBuilder()
                            .setCustomId('select')
                            .setPlaceholder('Nothing selected')               
                        )

                        const dayNumber = 1 + (userMatches[i]._endDate - userMatches[i]._startDate) / 86400000

                        const date = new Date(userMatches[i]._startDate)

                        for (y = 0; y < dayNumber; y++) {
                            dayMenu.components[0].addOptions(
                                {
                                    label: date.toLocaleDateString(),
                                    value: date.toLocaleDateString(),
                                }
                            )
                            date.setDate(date.getDate() + 1)
                        }                    

                        match = userMatches[i]
                        
                        await cld.reply({embeds: [dayEmbed], components: [dayMenu], fetchReply: true})
                        await interaction.deleteReply()
                        return
                    }
                }
            })
        }
        else {
            interaction.reply('You have no match to set disponibilities for')
        }

        

        client.on(Events.InteractionCreate, async reponse => {
            if (reponse.user.id === interaction.user.id){
                if (reponse.isModalSubmit()) {
                    const date1 = reponse.fields.getTextInputValue('fromDate');
                    const date2 = reponse.fields.getTextInputValue('toDate');
                    if (new Date(reponse.customID + 'T' + date1) && new Date(reponse.customID + 'T' + date2)) {
                        var role;
                        if (interaction.member.roles.cache.has(match._team1)) {
                            role = match._team1
                        }
                        else if (interaction.member.roles.cache.has(match._team2)) {
                            role = match._team2
                        }
                        const userDisponibilities = {day: reponse.customId, from: date1, to: date2}
                        const disponibilitiesExist = await disponibilitiesSchema.where('_matchID').equals(match._id).where('_userID').equals(reponse.user.id).where('_teamID').equals(role)
                        if (disponibilitiesExist[0] != null) {
                            const disponibilities = disponibilitiesExist[0]._disponibilities
                            const alreadyExist = disponibilities.findIndex(o => o.day === reponse.customId)

                            if (alreadyExist >= 0) {
                                disponibilitiesSchema.findOneAndUpdate({_id: disponibilitiesExist[0]._id, '_disponibilities.day': reponse.customId}, {$set: {'_disponibilities.$.from': date1, '_disponibilities.$.to': date2}}, function (err) {
                                    if (err) {
                                        console.log(err)
                                    }
                                })
                            }
                            else {
                                disponibilitiesSchema.findByIdAndUpdate(disponibilitiesExist[0]._id, {$push: {_disponibilities: userDisponibilities}}, function (err) {
                                    if (err) {
                                        console.log(err)
                                    }
                                })
                            }                            
                        }
                        else {
                            await disponibilitiesSchema.create({  _teamID: role, _matchID: match._id, _userID: interaction.user.id, _disponibilities: userDisponibilities })
                        }
                        reponse.reply('Answer received').then(msg => {
                            setTimeout(() => reponse.deleteReply(), 5000)
                        })
                    }
                    else {
                        reponse.reply('Date error').then(msg => {
                            setTimeout(() => reponse.deleteReply(), 5000)
                          })
                    }
                    

                }
                else if (reponse.isStringSelectMenu()) {
                    if (match) {
                        const dayNumber = 1 + (match._endDate - match._startDate) / 86400000
                        const date = new Date(match._startDate)
                        for (i = 0; i < dayNumber; i++) {
                            if (reponse.values[0] === date.toLocaleDateString())
                            {
                                const modal = new ModalBuilder()
                                .setCustomId(date.toLocaleDateString().substring(0, 10))
                                .setTitle('The ' + date.toLocaleDateString() + ' you will be available')

                                const fromDate = new TextInputBuilder()
                                .setCustomId('fromDate')
                                .setLabel('From')
                                .setPlaceholder('Put the hour in this fromat HH:MM')
                                .setRequired(true)
                                .setStyle(TextInputStyle.Short)
                                .setMaxLength(5)
                                .setMinLength(5)

                                const toDate = new TextInputBuilder()
                                .setCustomId('toDate')
                                .setLabel('To')
                                .setPlaceholder('Put the hour in this fromat HH:MM')
                                .setRequired(true)
                                .setStyle(TextInputStyle.Short)
                                .setMaxLength(5)
                                .setMinLength(5)

                                modal.addComponents(new ActionRowBuilder().addComponents(fromDate))
                                modal.addComponents(new ActionRowBuilder().addComponents(toDate))

                                reponse.showModal(modal)
                                return
                            }   
                            date.setDate(date.getDate() + 1)
                        }
                    }
                    
            }}
        });
    }
}