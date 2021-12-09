const Discord = require("discord.js")
const config = require("../../../config.json")
const data = require("../../../database.json")
const color = require("../../../color.json")
const permissions = require("../../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")

module.exports = async(client, message, database, lang, member, already, color) => {
    try {
        let embed = new Discord.MessageEmbed()
        embed.setDescription(`<@${member}> ${already ? lang.alreadyuwl : lang.hasbeenuwl}`)
        embed.setColor(color)
        message.channel.send(embed)
    } catch (err) {
        console.log('Unwhitelisted embed : ' + err)
    }
}