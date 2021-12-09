const Discord = require("discord.js")
const config = require("../../../config.json")
const data = require("../../../database.json")
const permissions = require("../../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")

module.exports = async (client, message, title, icon, text, color, channel) => {
    try {
        let embed = new Discord.MessageEmbed()
        if (title) embed.setAuthor(title, icon)
        embed.setDescription(text)
        embed.setColor(color)
        //embed.setTimestamp()
        channel.send(embed)
    } catch (err) {
        console.log('Simple embed : ' + err)
    }
}