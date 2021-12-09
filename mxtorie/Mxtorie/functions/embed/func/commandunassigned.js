const Discord = require("discord.js")
const config = require("../../../config.json")
const data = require("../../../database.json")
//const color = require("../../../color.json")
const permissions = require("../../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")

module.exports = async(client, message, mention, level, lang, type, already, color) => {
    try {
        let embed = new Discord.MessageEmbed()
        if(level == 'g') level = 'giveaway'
        if(level == 'eve') level = 'mention everyone'
        embed.setDescription(`**${mention}** ${already ? lang.alreadyunassigned : lang.permunassigned+` **${level}**.`}`)
        embed.setColor(color)
        message.channel.send(embed)
    } catch (err) {
        console.log('Command unassigned embed : ' + err)
    }
}