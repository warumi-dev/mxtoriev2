const Discord = require("discord.js")
const config = require("../../../config.json")
const data = require("../../../database.json")
const color = require("../../../color.json")
const permissions = require("../../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")

module.exports = async(client, message, perm, text) => {
    try {
        let embed = new Discord.MessageEmbed()
        embed.setDescription(text + perm)
        embed.setColor(color.red)
        message.channel.send(embed)
    } catch (err) {
        console.log('Permission missing embed : ' + err)
    }
}