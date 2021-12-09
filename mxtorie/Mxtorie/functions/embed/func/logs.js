const Discord = require("discord.js")
const config = require("../../../config.json")
const data = require("../../../database.json")
const permissions = require("../../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")

module.exports = async (client, message, name, text, sanctionned, color, channel) => {
    try {
        let chan = channel
        let embed = new Discord.MessageEmbed()
        embed.setTitle(name)
        if (sanctionned.user) embed.setAuthor(sanctionned.user.tag, sanctionned.user.displayAvatarURL({ dynamic: true }))
        else embed.setAuthor(sanctionned, message.guild.members.cache.has(sanctionned) ? message.guild.members.cache.find(m => m.id === sanctionned).user.displayAvatarURL({dynamic: true}) : client.user.displayAvatarURL({ dinamyc: true }))
        embed.setDescription(text)
        embed.setColor(color)
        embed.setTimestamp()
        if(!channel.id)channel = message.guild.channels.cache.get(c => c.id === chan)
        if(!channel) channel = message.guild.channels.cache(c => c.name === chan)
        if(!channel) return
        channel.send(embed)
    } catch (err) {
        console.log('Log embed : ' + err)
    }
}