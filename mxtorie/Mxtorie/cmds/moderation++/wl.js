const Discord = require("discord.js")
const config = require("../../config.json")
const data = require("../../database.json")
const color = require("../../color.json")
const permissions = require("../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")
const embed = require("../../functions/embed/main")
const language = require("../../lang.json")
const logs = require('../../functions/logs/main')
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
                    if (!canaccess) return message.channel.send(language[lang].permissionmissing + `**\`perm ${result[0].perm} minimum\`**`)
                    var lang2 = lang
                    var botaccess = true
                    var botperm = this.help.access_bot.map(i => ` \`${permissions.fr[i]}\` |`)
                    if (this.help.access_bot.length > 0) {
                        await this.help.access_bot.map(i => {
                            if (!message.guild.me.hasPermission(i)) return botaccess = false
                        })
                        lang = language[`${lang}`]
                        if (!botaccess) return embed.permissionMissing(client, message, botperm, lang.botpermissionmissing)
                    }
                    lang = language[`${lang2}`]

                    if (!args[0]) {
                        return embed.whitelist(client, message, database, lang)
                    } else {
                        if (!config.owners.includes(message.author.id) && !config.buyer != message.author.id && config.creator != message.author.id) return message.channel.send(lang.permissionmissing + `**\`${lang.owner} minimum\`**`)
                        let argument = args[0].toLowerCase()
                        if (argument != 'add' && argument != 'remove') return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        let mention
                        let member
                        switch (argument) {
                            case 'add':
                                mention = message.mentions.members.first()
                                if (mention) mention = mention.id
                                if (!mention) mention = args[1]
                                if (!mention || isNaN(mention) || mention.length != 18) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [message.guild.id, mention], async (error, result, fields) => {
                                    if (result < 1) {
                                        var ladate = new Date()
                                        let values2 = [
                                            [message.guild.id, mention, `${ladate.getDate() + "/" + (ladate.getMonth() + 1) + "/" + ladate.getFullYear() + "  " + ladate.getHours() + ":" + ladate.getMinutes() + ":" + ladate.getSeconds()}`]
                                        ]
                                        await database.query("INSERT INTO u_whitelist(serverid, userid, date) VALUES ?", [values2], async function (error, result, fields) {
                                            if (error || result === undefined) return message.reply(lang.error + error)
                                            embed.whitelisted(client, message, database, lang, mention, false, color.green)
                                            member = message.guild.members.cache.find(u => u.id === mention)
                                            if (!member) return
                                            logs.sanctions(client, message, database, 'Whitelist', lang.whitelisted, member, null, color.orange, lang, message.author, 'sanctions')
                                        })
                                    } else {
                                        embed.whitelisted(client, message, database, lang, mention, true, color.red)
                                    }
                                })
                                break;

                            case 'remove':
                                mention = message.mentions.members.first()
                                if (mention) mention = mention.id
                                if (!mention) mention = args[1]
                                if (!mention || isNaN(mention) || mention.length != 18) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [message.guild.id, mention], async (error, result, fields) => {
                                    if (result[0]) {
                                        await database.query("DELETE FROM u_whitelist WHERE serverid = " + message.guild.id + " AND userid = " + mention, async function (error, result, fields) {
                                            if (error || result === undefined) return message.reply(lang.error + error)
                                            embed.unwhitelisted(client, message, database, lang, mention, false, color.green)
                                            member = message.guild.members.cache.find(u => u.id === mention)
                                            if (!member) return
                                            logs.sanctions(client, message, database, 'Whitelist', lang.unwhitelisted, member, null, color.orange, lang, message.author, 'sanctions')
                                        })

                                    } else {
                                        return embed.unwhitelisted(client, message, database, lang, mention, true, color.orange)
                                    }
                                })
                                break;
                        }
                    }

                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

module.exports.help = {
    name: "wl",
    aliases: [`whitelist`],
    desc: ["Ajoute des membres à la whitelist pour leur permettre de passer outre quelques protections", "Add some users in the whitelist, with that they can bypass some protections"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["wl", "wl add <mention/id>", "wl remove <mention/id>"],
    type: ["Modération ++", "Moderation ++"],
    perm: "2"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, '2']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}