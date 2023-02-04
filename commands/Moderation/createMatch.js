const { SlashCommandBuilder } = require('@discordjs/builders');

const matches = require("../../differents-matches")

module.exports = {
    data: new SlashCommandBuilder()
    .setName('creatematch')
    .setDescription('Used to create a new match')
    .addRoleOption(role => role.setName('team1').setDescription('Ping the role of the first team').setRequired(true))
    .addRoleOption(role => role.setName('team2').setDescription('Ping the role of the second team').setRequired(true))
    .addStringOption(role => role.setName('startingdate').setDescription('The date of the start of the allowed period for the match in this format MM/DD/YYYY').setRequired(true))
    .addStringOption(role => role.setName('endingdate').setDescription('The date of the end of the allowed period for the match in this format MM/DD/YYYY').setRequired(true)),
    async execute(interaction, client) {
        let team1 = interaction.options.get('team1').role.id;
        let team2 = interaction.options.get('team2').role.id;
        let startingdate = interaction.options.get('startingdate').value;
        let startdate = new Date(startingdate);
        let endingdate = interaction.options.get('endingdate').value;
        let enddate = new Date(endingdate);
        if (!isNaN(startdate) && !isNaN(enddate)) {
        await matches.create({ _team1: team1, _team2: team2, _startDate: startdate, _endDate: enddate, _notified: 0});
        await interaction.reply('Match succesfully created');
        }
        else {
            await interaction.reply('Date error');
        }
    }
}