const Discord = require("discord.js")
const config = require("../../config.json")
const data = require("../../database.json")
const color = require("../../color.json")
const permissions = require("../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")
const embed2 = require("../../functions/embed/main")
const language = require("../../lang.json")
const logs = require('../../functions/logs/main')
const moment = require('moment')
getNow = () => { return { time: new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }), }; };
module.exports.run = async (client, message, args, prefix, perm, whitelisted, database, database2, lang) => {
    try {
        await CmdExist(database, message, this.help.name).then(async () => {
            await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, this.help.name], async (error, result) => {
                var canaccess = false
                try {
                    if (error) return message.reply(language[lang].error + error)
                    if (!result[0]) canaccess = true
                    if (result[0].perm == '0') canaccess = true
                    if (result[0].perm == '1') if (perm[0]) canaccess = true
                    if (result[0].perm == '2') if (perm[0] || perm[1]) canaccess = true
                    if (result[0].perm == '3') if (perm[0] || perm[1] || perm[2]) canaccess = true
                    if (result[0].perm == 'giveaway') if (perm[3]) canaccess = true
                    if (result[0].perm == 'mention everyone') if (perm[4]) canaccess = true
                    if (result[0].perm == 'whitelist') if (whitelisted) canaccess = true
                    if (result[0].perm == 'owner') if (config.owners.includes(message.author.id) || config.buyer == message.author.id || config.creator == message.author.id) canaccess = true
                    if (result[0].perm == 'buyer') if (config.buyer == message.author.id || config.creator == message.author.id) canaccess = true
                    if (result[0].perm == 'kick/ban') {
                        await database.query("SELECT * FROM roles WHERE serverid = ?", message.guild.id, async function (error, result, fields) {
                            if (error || result < 1) return message.reply(lang.undefinederror)
                            let myrole = result[0].ban
                            if (!message.guild.roles.cache.has(myrole)) return embed2.simple(client, message, 'Perm kick/ban', message.guild.iconURL({ dynamic: true }), lang.rolebanproblem, color.orangered, message.channel)
                            let pban = message.guild.roles.cache.get(myrole).name
                            if (message.member.roles.cache.has(myrole)) canaccess = true
                        })
                    }
                    if (!canaccess) return message.channel.send(language[lang].permissionmissing + `**\`perm ${result[0].perm} minimum\`**`)
                    var lang2 = lang
                    var botaccess = true
                    var botperm = this.help.access_bot.map(i => ` \`${permissions.fr[i]}\` |`)
                    if (this.help.access_bot.length > 0) {
                        await this.help.access_bot.map(i => {
                            if (!message.guild.me.hasPermission(i)) return botaccess = false
                        })
                        lang = language[`${lang}`]
                        if (!botaccess) return embed2.permissionMissing(client, message, botperm, lang.botpermissionmissing)
                    }
                    lang = language[`${lang2}`]

                    let rawData = db.all()
                        .filter(data => data.ID.startsWith(`level_${message.guild.id}`))
                        .sort((a, b) => b.data - a.data);
                    const lvl2 = rawData.map((data2, i2) => `**${++i2}. <@${data2.ID.split('_')[2]}>** - ${lang.level} : **${data2.data.toLocaleString()}**`).join("\n")
                    rawData.length = 15;
                    let embed = new Discord.MessageEmbed()
                        .setAuthor(`${message.guild.name} - ${lang.leaderboard} 🏆 !`, message.guild.iconURL({ dynamic: true }))
                        .setColor(color.yellow)
                        .setDescription(rawData.map((data2, i2) => `**${++i2}. <@${data2.ID.split('_')[2]}>** - ${lang.level} : **${data2.data.toLocaleString()}**`).join("\n"))
                        .setFooter(client.user.tag, client.user.displayAvatarURL({ dynamic: true }))
                        .setTimestamp()

                    if (args[0] == 'messages' || args[0] == 'message' || args[0] == 'msg') {
                        rawData = db.all()
                            .filter(data => data.ID.startsWith(`messages_${message.guild.id}`))
                            .sort((a, b) => b.data - a.data);
                        rawData.length = 15;
                        embed = new Discord.MessageEmbed()
                            .setAuthor(`${message.guild.name} - ${lang.leaderboard} 🏆 !`, message.guild.iconURL({ dynamic: true }))
                            .setColor(color.blue)
                            .setDescription(rawData.map((data, i) => `**${++i}. <@${data.ID.split('_')[2]}>** - Messages : ${data.data.toLocaleString()}`).join("\n"))
                            .setFooter(client.user.tag, client.user.displayAvatarURL({ dynamic: true }))
                            .setTimestamp()
                        message.channel.send(embed)
                    } else if (args[0] == 'voice' || args[0] == 'vocal' || args[0] == 'voc') {
                        rawData = db.all()
                            .filter(data => data.ID.startsWith(`voicetime_${message.guild.id}`))
                            .sort((a, b) => b.data - a.data);
                        rawData.length = 15;
                        embed = new Discord.MessageEmbed()
                            .setAuthor(`${message.guild.name} - ${lang.leaderboard} 🏆 !`, message.guild.iconURL({ dynamic: true }))
                            .setColor(color.red)
                            .setDescription(rawData.map((data, i) => `**${++i}. <@${data.ID.split('_')[2]}>** - Temps en vocal : ${pretty(ms(data.data))}`).join("\n"))
                            .setFooter(client.user.tag, client.user.displayAvatarURL({ dynamic: true }))
                            .setTimestamp()
                        message.channel.send(embed)
                    } else return message.channel.send(embed)



                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

// return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

module.exports.help = {
    name: "leaderboard",
    aliases: [`leader`],
    desc: ["Montre le niveau actuel des membres", "Show current level of a member"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["leaderboard", "leaderboard message"],
    type: ["Information", "Information"],
    perm: "0"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, '0']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}