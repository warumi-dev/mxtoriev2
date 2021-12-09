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
const { sanctions } = require("../../functions/logs/main")
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
                    let fr = lang.by == 'by' ? false : true
                    var embed2 = new Discord.MessageEmbed()
                    if (!args[0]) {
                        await database.query("SELECT * FROM r_whitelist WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
                            if (result < 1) {
                                embed2.setTitle(fr ? "__Rôle(s) protéger__" : "__Role(s) protected__")
                                embed2.setDescription(lang.noprotected)
                                embed2.setColor(color.red)
                                embed2.setFooter(message.guild.name)
                                embed2.setTimestamp()
                                message.channel.send(embed2)
                            } else {
                                let desc = result.map((i, n) => `${n + 1} - <@&${i.roleid}>`)
                                embed2.setTitle(fr ? "__Rôle(s) protéger__" : "__Role(s) protected__")
                                embed2.setDescription(desc)
                                embed2.setColor(color.whitesmoke)
                                embed2.setFooter(message.guild.name)
                                embed2.setTimestamp()
                                message.channel.send(embed2)
                            }
                        })
                    } else {
                        let mention
                        switch (args[0]) {
                            case 'add':
                                if (!config.owners.includes(message.author.id) && config.buyer != message.author.id && config.creator != message.author.id) return message.channel.send(language[lang].permissionmissing + `**\`perm owner minimum\`**`)
                                mention = message.mentions.roles.first()
                                if (mention) mention = mention.id
                                if (!mention) {
                                    mention = args[1]
                                }
                                if (!mention || mention.length != 18) embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                let values = [message.guild.id, mention]
                                await database.query("SELECT * FROM r_whitelist WHERE serverid = ? AND roleid = ?", values, async (error, result, fields) => {
                                    if (result < 1) {
                                        var ladate = new Date()
                                        let values2 = [
                                            [message.guild.id, mention]
                                        ]
                                        await database.query("INSERT INTO r_whitelist(serverid, roleid) VALUES ?", [values2], async function (error, result, fields) {
                                            if (error || result === undefined) return message.reply(lang.error + error)
                                            embed.simple(client, message, fr ? "Rôle protéger" : "Role protected", message.guild.iconURL({ dynamic: true }), fr ? `🔑 - <@&${mention}> est maintenant protéger par l'anti-rôle.` : `🔑 - <@&${mention}> is now protected by the anti-role.`, color.green, message.channel)
                                            sanctions(client, message, database, fr ? "Rôle protéger" : "Role protected", lang.roleprotected, mention, false, color.seagreen, lang, message.author, 'protections', false, false)
                                        })
                                    } else {
                                        embed.simple(client, message, fr ? "Rôle protéger" : "Role protected", message.guild.iconURL({ dynamic: true }), fr ? `❌ - <@&${mention}> est déjà protéger par l'anti-rôle.` : `❌ - <@&${mention}> is already protected by the anti-role.`, color.green, message.channel)
                                    }
                                })
                                break;
                            case 'remove':
                                if (!config.owners.includes(message.author.id) && config.buyer != message.author.id && config.creator != message.author.id) return message.channel.send(language[lang].permissionmissing + `**\`perm owner minimum\`**`)
                                mention = message.mentions.roles.first()
                                if (mention) mention = mention.id
                                if (!mention) {
                                    mention = args[1]
                                }
                                if (!mention || mention.length != 18) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                let values3 = [
                                    [message.guild.id, mention]
                                ]
                                await database.query("SELECT * FROM r_whitelist WHERE serverid = ? AND roleid = ?", [values3], async (error, result, fields) => {
                                    if (result < 1) {
                                        embed.simple(client, message, fr ? "Rôle protéger" : "Role protected", message.guild.iconURL({ dynamic: true }), fr ? `❌ - <@&${mention}> n'est déjà pas protéger par l'anti-rôle.` : `❌ - <@&${mention}> is already not protected by the anti-role.`, color.green, message.channel)
                                    } else {
                                        await database.query("DELETE FROM r_whitelist WHERE serverid = " + message.guild.id + " AND roleid = " + mention, async function (error, result, fields) {
                                            if (error || result === undefined) return message.reply(lang.error + error)
                                            embed.simple(client, message, fr ? "Rôle protéger" : "Role protected", message.guild.iconURL({ dynamic: true }), fr ? `🔑 - <@&${mention}> n'est plus protéger par l'anti-rôle.` : `🔑 - <@&${mention}> is now not protected by the anti-role.`, color.orange, message.channel)
                                            sanctions(client, message, database, fr ? "Rôle protéger" : "Role protected", lang.roleunprotected, mention, false, color.orangered, lang, message.author, 'protections', false, false)
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
    name: "prole",
    aliases: [`rwl`],
    desc: ["Mettre un rôle sous la protection de l'anti-rôle", "Protect a role with the anti-role"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["prole", "prole add <mention/id>", "prole remove <mention/id>"],
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