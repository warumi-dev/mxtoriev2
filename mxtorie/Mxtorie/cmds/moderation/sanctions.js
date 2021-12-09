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
                    if (!mention || mention.length != 18) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    let val = [
                        [message.guild.id, mention]
                    ]
                    var desc = ""
                    let mypage = []
                    let page = 0
                    await database.query("SELECT * FROM sanctions WHERE serverid = " + message.guild.id + " AND userid = " + mention, async (error, result, fields) => {
                        var embed = new Discord.MessageEmbed()
                        if (error || result.length < 1) {
                            embed.setTitle("__Sanctions__")
                            embed.setDescription(lang.nosanction)
                            embed.setColor(color.green)
                            embed.setFooter(message.guild.name)
                            embed.setTimestamp()
                            message.channel.send(embed)
                        } else {
                            let current = 0
                            var test = 0
                            result.map((i, n) => {
                                ++current
                                desc += `**${n + 1} -** \`${i.type} | [${i.id}]\` | \`${i.date}\` | <@${i.author}> - ${i.reason}\n`
                                ++test
                                if (current == 10) {
                                    current = 0
                                    mypage.push(desc)
                                    desc = ""
                                } else if ((n + 1) == result.length) {
                                    current = 0
                                    mypage.push(desc)
                                    desc = ""
                                }
                            })
                            let name = client.users.cache.find(u => u.id === mention)
                            if (name) name = name.username + "#" + name.discriminator
                            if (!name) name = mention
                            embed.setTitle("__Sanctions of " + name + "__")
                            embed.setDescription(mypage[0])
                            embed.setColor(color.red)
                            embed.setFooter(message.guild.name + `\n${'Résultat(s) : ' + test + '\nPage(s) : ' + mypage.length}`)
                            embed.setTimestamp()
                            message.channel.send(embed).then(async m => {
                                const collector = m.createReactionCollector(filter);
                                collector.on('collect', async r => {
                                    try {
                                        if (r.emoji.name === "⬅️") {
                                            if (page == 0) {
                                                page = mypage.length - 1
                                                embed.setDescription(mypage[page])
                                                m.edit(embed)
                                            } else {
                                                page = page - 1
                                                embed.setDescription(mypage[page])
                                                m.edit(embed)
                                            }
                                            r.users.remove(message.author.id)
                                        }
                                        if (r.emoji.name === "➡️") {
                                            if (page == mypage.length - 1) {
                                                page = 0
                                                embed.setDescription(mypage[page])
                                                m.edit(embed)
                                            } else {
                                                page = page + 1
                                                embed.setDescription(mypage[page])
                                                m.edit(embed)
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

module.exports.help = {
    name: "sanction",
    aliases: [`sanctions`, `infraction`, `infractions`],
    desc: ["Affiche le tableau de sanctions d'un membre", "Show the sanctions of someone"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["sanction <mention/id>"],
    type: ["Modération", "Moderation"],
    perm: "3"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, '3']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}