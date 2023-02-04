const { SlashCommandBuilder, EmbedBuilder} = require('discord.js');

const matches = require("../../differents-matches")

module.exports = {
    data: new SlashCommandBuilder()
    .setName('listmatches')
    .setDescription('Used to see all the matches')
    .setDMPermission(true)
    .addBooleanOption(boolean => boolean.setName('showpastmatches').setDescription('Decide if the matches that are finnished are showed or not').setRequired(true))
    .addBooleanOption(boolean => boolean.setName('showcurrentmatches').setDescription('Decide if the matches that are ongoing are showed or not').setRequired(true))
    .addBooleanOption(boolean => boolean.setName('showfuturematches').setDescription('Decide if the matches that have not started yet are showed or not').setRequired(true)),
    async execute(interaction, client) {

        if (interaction.options.get('showpastmatches').value === false && interaction.options.get('showcurrentmatches').value === false && interaction.options.get('showfuturematches').value === false) {
            await interaction.reply('Select true for at least one of the options')
            return
        }

        const test = await matches.find()
        
        const embed = new EmbedBuilder()
        .setTitle('Matches')
        .setDescription('Show the differents matches')
        .setColor(0x18e1ee)
        .setTimestamp(Date.now())
        
        test.forEach(element => {
            if ( (interaction.options.get('showpastmatches').value === true && element._endDate <= Date.now())  || (interaction.options.get('showcurrentmatches').value === true && element._startDate <= Date.now() && element._endDate >= Date.now()) || (interaction.options.get('showfuturematches').value === true && element._startDate >= Date.now()) ) {
                var choosedDate;
                if (element._choosedDate == null) {
                    choosedDate = 'XX/XX/XXXX'
                }
                else {
                    choosedDate = new Date(element._choosedDate).toLocaleString("fr-FR")
                }
                embed.addFields(
                    [
                        {                        
                            name: interaction.guild.roles.cache.get(element._team1).name + ' VS ' + interaction.guild.roles.cache.get(element._team2).name,
                            value: 'Start date : ' + element._startDate.toLocaleString("fr-FR") + '\n End date : ' + element._endDate.toLocaleString("fr-FR") + '\n Choosed match date : ' + choosedDate
                        }
                    ]
                )
            }            
        });

        await interaction.reply({
            embeds: [embed]
        })

    }
}