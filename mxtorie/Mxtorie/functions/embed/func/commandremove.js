const Discord = require("discord.js")
const config = require("../../../config.json")
const data = require("../../../database.json")
//const color = require("../../../color.json")
const permissions = require("../../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")

module.exports = async(client, message, lang, color, prefix) => {
    try {
        let embed = new Discord.MessageEmbed()
        embed.setDescription(`${lang.permcommands} \`${prefix}perm add <command name> 0\``)
        embed.setColor(color)
        message.channel.send(embed)
    } catch (err) {
        console.log('Command warning embed : ' + err)
    }
}