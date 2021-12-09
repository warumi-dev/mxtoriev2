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
const moment = require('moment')
const axios = require('axios')
const { sanctions } = require("../../functions/db/main")
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
                            if (!message.guild.roles.cache.has(myrole)) return embed.simple(client, message, 'Perm kick/ban', message.guild.iconURL({ dynamic: true }), lang.rolebanproblem, color.orangered, message.channel)
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
                        if (!botaccess) return embed.permissionMissing(client, message, botperm, lang.botpermissionmissing)
                    }
                    lang = language[`${lang2}`]

                    var embed2 = new Discord.MessageEmbed()
                    if (!args[0]) {
                        await database.query("SELECT * FROM blacklist", async (error, result, fields) => {
                            if (result < 1) {
                                embed2.setTitle("__Blacklist__")
                                embed2.setDescription("Personne n'a été blacklisté.")
                                embed2.setColor(color.red)
                                embed2.setFooter(client.user.tag)
                                embed2.setTimestamp()
                                message.channel.send(embed2)
                            } else {
                                let desc = result.map((i, n) => `${n + 1} - <@${i.userid}> | \`${i.date}\` | [${i.userid}]`)
                                embed2.setTitle("__Blacklist__")
                                embed2.setDescription(desc)
                                embed2.setColor(color.white)
                                embed2.setFooter(client.user.tag)
                                embed2.setTimestamp()
                                message.channel.send(embed2)
                            }
                        })
                    } else {
                        let mention
                        switch (args[0]) {
                            case 'add':
                                mention = message.mentions.members.first()
                                if (mention) mention = mention.id
                                if (!mention) {
                                    mention = args[1]
                                }
                                if (!mention || mention.length != 18) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                let values = [mention]
                                await database.query("SELECT * FROM blacklist WHERE userid = ?", values, async (error, result, fields) => {
                                    if (result.length < 1) {
                                        var ladate = new Date()
                                        let values2 = [
                                            [message.guild.id, mention, `${ladate.getDate() + "/" + (ladate.getMonth() + 1) + "/" + ladate.getFullYear() + "  " + ladate.getHours() + ":" + ladate.getMinutes() + ":" + ladate.getSeconds()}`, message.author.id]
                                        ]
                                        await database.query("INSERT INTO blacklist(serverid, userid, date, author) VALUES ?", [values2], async function (error, result, fields) {
                                            if (error || result === undefined) return message.reply(lang.error + error)
                                            let reason = args.splice(2).join(' ')
                                            if (!reason) reason = "aucune raison"
                                            embed.warn(client, message, mention, "blacklisté", color.black, true, false, lang, reason, message.channel)
                                            /*embed.warn(client, message, mention, 'blacklisté', color.black, true, false, lang, reason, message.channel)
                                            embed.simple(client, message, "Blacklisté", client.users.cache.find(u => u.id==mention).displayAvatarURL({dynamic: true}), `<@${mention}>(${mention}) a été blacklisté raison suivante : \`${reason}\`.`, color.black, message.channel)*/
                                            try {
                                                sanctions(client, message, mention, 'blacklist', reason, message.member, database)
                                            } catch (err) { }
                                            client.guilds.cache.forEach(async g => {
                                                g.members.ban(mention, { days: 7, reason: 'blacklisted' }).catch(err => { return })
                                            })
                                            logs.sanctions(client, message, database, "Blacklist", lang.blacklisted + `\nBanni de **${client.guilds.cache.size}** serveur(s).`, mention, reason, color.black, lang, message.author, "sanctions", false, false, false, false)
                                        })
                                    } else {
                                        embed.simple(client, message, 'Blacklist', message.guild.iconURL({ dynamic: true }), `<@${mention}> est déjà blacklisté.`, color.red, message.channel)
                                    }
                                })
                                break;
                            case 'remove':
                                mention = message.mentions.members.first()
                                if (mention) mention = mention.id
                                if (!mention) {
                                    mention = args[1]
                                }
                                if (!mention || mention.length != 18) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                let values3 = [mention]
                                await database.query("SELECT * FROM blacklist WHERE userid = ?", values3, async (error, result, fields) => {
                                    if (result.length < 1) {
                                        embed.simple(client, message, 'Blacklist', message.guild.iconURL({ dynamic: true }), `<@${mention}> n'est pas blaklisté.`, color.red, message.channel)
                                    } else {
                                        await database.query("DELETE FROM blacklist WHERE userid = " + mention, async function (error, result, fields) {
                                            if (error || result === undefined) return message.reply(lang.undefinederror)
                                            embed.warn(client, message, mention, "déblacklisté", color.black, false, false, lang, false, message.channel)
                                            logs.sanctions(client, message, database, "Blacklist", lang.unblacklisted, mention, false, color.black, lang, message.author, "sanctions", false, false, false, false)
                                            client.guilds.cache.map(async g => {
                                                g.fetchBans().then(bans => {
                                                    let member = bans.get(mention)
                                                    if (!member) return
                                                    g.members.unban(mention).catch(err => { return })
                                                })
                                            })
                                        })
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

// return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

module.exports.help = {
    name: "bl",
    aliases: [`blacklist`],
    desc: ["Bannir un membre de tout les serveurs sur lequel le bot ce trouve, même débanni il ne pourra plus rejoindre.", "description en"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "BAN_MEMBERS"],
    usage: ["bl", "bl add <mention/id> [raison]", "bl remove <id>"],
    type: ["Modération ++", "Moderation ++"],
    perm: "owner"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, 'owner']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}