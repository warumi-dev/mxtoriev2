const Discord = require("discord.js")
const config = require("../../../config.json")
const data = require("../../../database.json")
const permissions = require("../../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")
const color = require('../../../color.json')

module.exports = async(client, message, name, usage, prefix) => {
    try {
        let embed = new Discord.MessageEmbed()
        //embed.setTitle(name)
        embed.setAuthor(name, message.member.user.displayAvatarURL({dynamic: true}))     
        embed.setDescription(usage.map(i => `\`${prefix+i}\``))
        embed.setColor(color.orange)
        message.channel.send(embed)
    } catch (err) {
        console.log('Invalid args embed : ' + err)
    }
}