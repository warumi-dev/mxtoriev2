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

                    filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && user.id === message.author.id
                    dureefiltrer = response => { return response.author.id === message.author.id }
                    let mention = message.mentions.members.first()
                    if (mention) mention = mention.id
                    if (!mention) mention = args[0]
                    if (!mention || isNaN(mention) || mention.length != 18) mention = message.author.id
                    await database2.query("SELECT * FROM prevname WHERE userid = ?", mention, async (error, result, fields) => {
                        if (error) return message.reply(lang.error + error)
                        let embed2 = new Discord.MessageEmbed()
                        var desc = ""
                        var desc2
                        let mypage = []
                        let page = 0
                        if (!result[0]) {
                            embed2.setDescription(`${lang.by == 'by' ? 'I don\'t have any username registred for <@' + mention + '>' : 'Je n\'ai aucun pseudo enregistré pour <@' + mention + '>'}`)
                            embed2.setColor(color.red)
                            message.channel.send(embed2)
                        } else {
                            let current = 0
                            var test = 0
                            let hu = []
                            result.map((i, n) => {
                                let hm = `** \`${i.old} => ${i.new}\` | ${i.date}\n`
                                if (hu.includes(hm)) return
                                desc += `\`${i.old}\` **=>** \`${i.new}\` | ${i.date}\n`
                                hu.push(hm)                      
                                ++current
                                ++test
                                if (current == 15) {
                                    current = 0
                                    mypage.push(desc)
                                    desc = ""
                                } else if ((n + 1) == result.length) {
                                    current = 0
                                    mypage.push(desc)
                                    desc = ""
                                }
                            })
                            embed2.setDescription(`<@${mention}> : \n` + mypage[0])
                            embed2.setColor(color.cyan)
                            embed2.setFooter(`${'Résultat(s) : ' + test + '\nPage(s) : ' + mypage.length}`)
                            message.channel.send(embed2).then(async m => {
                                const collector = m.createReactionCollector(filter);
                                collector.on('collect', async r => {
                                    try {
                                        if (r.emoji.name === "⬅️") {
                                            if (page == 0) {
                                                page = mypage.length - 1
                                                embed2.setDescription(`<@${mention}> : \n` + mypage[page])
                                                m.edit(embed2)
                                            } else {
                                                page = page - 1
                                                embed2.setDescription(`<@${mention}> : \n` + mypage[page])
                                                m.edit(embed2)
                                            }
                                            r.users.remove(message.author.id)
                                        }
                                        if (r.emoji.name === "➡️") {
                                            if (page == mypage.length - 1) {
                                                page = 0
                                                embed2.setDescription(`<@${mention}> : \n` + mypage[page])
                                                m.edit(embed2)
                                            } else {
                                                page = page + 1
                                                embed2.setDescription(`<@${mention}> : \n` + mypage[page])
                                                m.edit(embed2)
                                            }
                                            r.users.remove(message.author.id)
                                        }
                                        if (r.emoji.name === "❌") {
                                            r.users.remove(message.author.id)
                                            if (message) message.delete().catch(e => { })
                                            if (m) m.delete().catch(e => { })
                                        }
                                    } catch (err) { }
                                })
                                if (mypage.length < 2) return
                                await m.react("⬅️")
                                await m.react("➡️")
                                await m.react("❌")
                            })
                        }
                    })
                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

// return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

module.exports.help = {
    name: "prevname",
    aliases: [`name`, `oldname`, `username`],
    desc: ["Affiche les anciens pseudo d'un membre, seulement si ils sont enregistrés dans la base de données", "Show you old registred username of a member"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["prevname [mention/id]"],
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