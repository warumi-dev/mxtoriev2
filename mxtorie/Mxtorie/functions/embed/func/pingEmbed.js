const Discord = require("discord.js")
const config = require("../../../config.json")
const data = require("../../../database.json")
const color = require("../../../color.json")
const permissions = require("../../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")

module.exports = async(client, message, ping, APIping, lang, msg) => {
    try {
        let embed = new Discord.MessageEmbed()
        embed.setAuthor('Ping', client.user.displayAvatarURL({ dynamic: true }))
        embed.addField("Bot", ping, true)
        embed.addField("API", APIping, true)
        return msg.edit(embed).catch(e => {})
    } catch (err) {
        console.log('Ping embed : ' + err)
    }
}