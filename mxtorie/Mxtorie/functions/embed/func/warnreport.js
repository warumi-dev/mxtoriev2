const Discord = require("discord.js")
const config = require("../../../config.json")
const data = require("../../../database.json")
//const color = require("../../../color.json")
const permissions = require("../../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")

module.exports = async (client, message, mention, type, color, reason, authorornot, lang, thereason, channel) => {
    try {
        let embed = new Discord.MessageEmbed()
        let warnlogs
        if (reason) warnlogs = lang.warned
        else if (!authorornot) warnlogs = lang.warned2
        else warnlogs = lang.warned3
        warnlogs = warnlogs.replace('[member]', `<@${mention}>`)
        warnlogs = warnlogs.replace('[author]', message.author)
        warnlogs = warnlogs.replace('[reason]', `\`${thereason}\``)
        warnlogs = warnlogs.replace('[sanction]', type)
        embed.setDescription(`${warnlogs}`)
        embed.setColor(color)
        if(!channel) return message.channel.send(embed)
        if(channel.id) return channel.send(embed)
        let chan = message.guild.channels.cache.find(c => c.id === channel)
        if(!chan) return
        return chan.send(embed)
    } catch (err) {
        console.log('Warn report embed : ' + err)
    }
}