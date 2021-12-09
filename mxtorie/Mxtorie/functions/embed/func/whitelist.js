const Discord = require("discord.js")
const config = require("../../../config.json")
const data = require("../../../database.json")
const color = require("../../../color.json")
const permissions = require("../../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")

module.exports = async(client, message, database, lang) => {
    try {
        let embed = new Discord.MessageEmbed()
        await database.query("SELECT * FROM u_whitelist WHERE serverid = ?", message.guild.id, async(error, result, fields) => {
            if (result < 1) {
                embed.setTitle("__Whitelist__")
                embed.setDescription(lang.nouwl)
                embed.setColor(color.red)
                embed.setFooter(message.guild.name)
                embed.setTimestamp()
                message.channel.send(embed)
            } else {
                let desc = result.map((i, n) => `${n+1} - <@${i.userid}> | \`${i.date}\``)
                embed.setTitle("__Whitelist__")
                embed.setDescription(desc)
                embed.setColor(color.whitesmoke)
                embed.setFooter(message.guild.name)
                embed.setTimestamp()
                message.channel.send(embed)
            }
        })
    } catch (err) {
        console.log('Whitelist list embed : ' + err)
    }
}