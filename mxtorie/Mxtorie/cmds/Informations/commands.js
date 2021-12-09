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
getNow = () => { return { time: new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }), }; };

/** 
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 * @param {string[]} args
 * @param {string} prefix
 * @param {boolean[]} perm
 * @param {boolean} whitelisted
 * @param {import("mysql").Connection} database
 * @param {import("mysql").Connection} database2
 * @param {import("../../lang.json")} lang
 * @param {import("mysql").Connection} database3
*/

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

                    if (!args[0]) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    let arg = ["public", "1", "2", "3", "everyone", "giveaway", "whitelist", "owner", "buyer"]
                    if (!arg.includes(args[0].toLowerCase())) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                     filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && user.id === message.author.id
                    dureefiltrer = response => { return response.author.id === message.author.id }
                    switch (args[0].toLowerCase()) {
                        case 'public':
                            database.query("SELECT * FROM commands WHERE serverid = ? AND perm = ?", [message.guild.id, "0"], async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                let embed0 = new Discord.MessageEmbed()
                                var desc = ""
                                var desc2
                                let mypage = []
                                let page = 0
                                let current = 0
                                var test = 0
                                if (result.length < 1) {
                                    embed0.setDescription("Aucune commande n'est assigner à la permission 0 (publique).")
                                } else {
                                    result.map((i, n) => {
                                        ++current
                                        desc += `**${client.commands.get(i.name).help.type[0]} -** \`${i.name}\`\n`
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
                                }
                                embed0.setDescription(mypage[0])
                                embed0.setColor(color.cyan)
                                embed0.setFooter(`${'Résultat(s) : ' + test + '\nPage(s) : ' + mypage.length}`)
                                message.channel.send(embed0).then(async m => {
                                    const collector = m.createReactionCollector(filter);
                                    collector.on('collect', async r => {
                                        try {
                                            if (r.emoji.name === "⬅️") {
                                                if (page == 0) {
                                                    page = mypage.length - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                }
                                                r.users.remove(message.author.id)
                                            }
                                            if (r.emoji.name === "➡️") {
                                                if (page == mypage.length - 1) {
                                                    page = 0
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page + 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
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
                            })
                            break;
                        case '1':
                            database.query("SELECT * FROM commands WHERE serverid = ? AND perm = ?", [message.guild.id, "1"], async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                let embed0 = new Discord.MessageEmbed()
                                var desc = ""
                                var desc2
                                let mypage = []
                                let page = 0
                                let current = 0
                                var test = 0
                                if (result.length < 1) {
                                    embed0.setDescription("Aucune commande n'est assigner à la permission 1.")
                                } else {
                                    result.map((i, n) => {
                                        ++current
                                        desc += `**${client.commands.get(i.name).help.type[0]} -** \`${i.name}\`\n`
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
                                }
                                embed0.setDescription(mypage[0])
                                embed0.setColor(color.cyan)
                                embed0.setFooter(`${'Résultat(s) : ' + test + '\nPage(s) : ' + mypage.length}`)
                                message.channel.send(embed0).then(async m => {
                                    const collector = m.createReactionCollector(filter);
                                    collector.on('collect', async r => {
                                        try {
                                            if (r.emoji.name === "⬅️") {
                                                if (page == 0) {
                                                    page = mypage.length - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                }
                                                r.users.remove(message.author.id)
                                            }
                                            if (r.emoji.name === "➡️") {
                                                if (page == mypage.length - 1) {
                                                    page = 0
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page + 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
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
                            })
                            break;
                        case '2':
                            database.query("SELECT * FROM commands WHERE serverid = ? AND perm = ?", [message.guild.id, "2"], async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                let embed0 = new Discord.MessageEmbed()
                                var desc = ""
                                var desc2
                                let mypage = []
                                let page = 0
                                let current = 0
                                var test = 0
                                if (result.length < 1) {
                                    embed0.setDescription("Aucune commande n'est assigner à la permission 2.")
                                } else {
                                    result.map((i, n) => {
                                        ++current
                                        desc += `**${client.commands.get(i.name).help.type[0]} -** \`${i.name}\`\n`
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
                                }
                                embed0.setDescription(mypage[0])
                                embed0.setColor(color.cyan)
                                embed0.setFooter(`${'Résultat(s) : ' + test + '\nPage(s) : ' + mypage.length}`)
                                message.channel.send(embed0).then(async m => {
                                    const collector = m.createReactionCollector(filter);
                                    collector.on('collect', async r => {
                                        try {
                                            if (r.emoji.name === "⬅️") {
                                                if (page == 0) {
                                                    page = mypage.length - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                }
                                                r.users.remove(message.author.id)
                                            }
                                            if (r.emoji.name === "➡️") {
                                                if (page == mypage.length - 1) {
                                                    page = 0
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page + 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
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
                            })
                            break;
                        case '3':
                            database.query("SELECT * FROM commands WHERE serverid = ? AND perm = ?", [message.guild.id, "3"], async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                let embed0 = new Discord.MessageEmbed()
                                var desc = ""
                                var desc2
                                let mypage = []
                                let page = 0
                                let current = 0
                                var test = 0
                                if (result.length < 1) {
                                    embed0.setDescription("Aucune commande n'est assigner à la permission 3.")
                                } else {
                                    result.map((i, n) => {
                                        ++current
                                        desc += `**${client.commands.get(i.name).help.type[0]} -** \`${i.name}\`\n`
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
                                }
                                embed0.setDescription(mypage[0])
                                embed0.setColor(color.cyan)
                                embed0.setFooter(`${'Résultat(s) : ' + test + '\nPage(s) : ' + mypage.length}`)
                                message.channel.send(embed0).then(async m => {
                                    const collector = m.createReactionCollector(filter);
                                    collector.on('collect', async r => {
                                        try {
                                            if (r.emoji.name === "⬅️") {
                                                if (page == 0) {
                                                    page = mypage.length - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                }
                                                r.users.remove(message.author.id)
                                            }
                                            if (r.emoji.name === "➡️") {
                                                if (page == mypage.length - 1) {
                                                    page = 0
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page + 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
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
                            })
                            break;
                        case 'everyone':
                            database.query("SELECT * FROM commands WHERE serverid = ? AND perm = ?", [message.guild.id, "mention everyone"], async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                let embed0 = new Discord.MessageEmbed()
                                var desc = ""
                                var desc2
                                let mypage = []
                                let page = 0
                                let current = 0
                                var test = 0
                                if (result.length < 1) {
                                    embed0.setDescription("Aucune commande n'est assigner à la permission mention everyone.")
                                } else {
                                    result.map((i, n) => {
                                        ++current
                                        desc += `**${client.commands.get(i.name).help.type[0]} -** \`${i.name}\`\n`
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
                                }
                                embed0.setDescription(mypage[0])
                                embed0.setColor(color.cyan)
                                embed0.setFooter(`${'Résultat(s) : ' + test + '\nPage(s) : ' + mypage.length}`)
                                message.channel.send(embed0).then(async m => {
                                    const collector = m.createReactionCollector(filter);
                                    collector.on('collect', async r => {
                                        try {
                                            if (r.emoji.name === "⬅️") {
                                                if (page == 0) {
                                                    page = mypage.length - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                }
                                                r.users.remove(message.author.id)
                                            }
                                            if (r.emoji.name === "➡️") {
                                                if (page == mypage.length - 1) {
                                                    page = 0
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page + 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
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
                            })
                            break;
                        case 'giveaway':
                            database.query("SELECT * FROM commands WHERE serverid = ? AND perm = ?", [message.guild.id, "giveaway"], async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                let embed0 = new Discord.MessageEmbed()
                                var desc = ""
                                var desc2
                                let mypage = []
                                let page = 0
                                let current = 0
                                var test = 0
                                if (result.length < 1) {
                                    embed0.setDescription("Aucune commande n'est assigner à la permission giveaway.")
                                } else {
                                    result.map((i, n) => {
                                        ++current
                                        desc += `**${client.commands.get(i.name).help.type[0]} -** \`${i.name}\`\n`
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
                                }
                                embed0.setDescription(mypage[0])
                                embed0.setColor(color.cyan)
                                embed0.setFooter(`${'Résultat(s) : ' + test + '\nPage(s) : ' + mypage.length}`)
                                message.channel.send(embed0).then(async m => {
                                    const collector = m.createReactionCollector(filter);
                                    collector.on('collect', async r => {
                                        try {
                                            if (r.emoji.name === "⬅️") {
                                                if (page == 0) {
                                                    page = mypage.length - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                }
                                                r.users.remove(message.author.id)
                                            }
                                            if (r.emoji.name === "➡️") {
                                                if (page == mypage.length - 1) {
                                                    page = 0
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page + 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
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
                            })
                            break;
                        case 'whitelist':
                            database.query("SELECT * FROM commands WHERE serverid = ? AND perm = ?", [message.guild.id, "whitelist"], async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                let embed0 = new Discord.MessageEmbed()
                                var desc = ""
                                var desc2
                                let mypage = []
                                let page = 0
                                let current = 0
                                var test = 0
                                if (result.length < 1) {
                                    embed0.setDescription("Aucune commande n'est assigner à la permission whitelist.")
                                } else {
                                    result.map((i, n) => {
                                        ++current
                                        desc += `**${client.commands.get(i.name).help.type[0]} -** \`${i.name}\`\n`
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
                                }
                                embed0.setDescription(mypage[0])
                                embed0.setColor(color.cyan)
                                embed0.setFooter(`${'Résultat(s) : ' + test + '\nPage(s) : ' + mypage.length}`)
                                message.channel.send(embed0).then(async m => {
                                    const collector = m.createReactionCollector(filter);
                                    collector.on('collect', async r => {
                                        try {
                                            if (r.emoji.name === "⬅️") {
                                                if (page == 0) {
                                                    page = mypage.length - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                }
                                                r.users.remove(message.author.id)
                                            }
                                            if (r.emoji.name === "➡️") {
                                                if (page == mypage.length - 1) {
                                                    page = 0
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page + 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
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
                            })
                            break;
                        case 'owner':
                            database.query("SELECT * FROM commands WHERE serverid = ? AND perm = ?", [message.guild.id, "owner"], async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                let embed0 = new Discord.MessageEmbed()
                                var desc = ""
                                var desc2
                                let mypage = []
                                let page = 0
                                let current = 0
                                var test = 0
                                if (result.length < 1) {
                                    embed0.setDescription("Aucune commande n'est assigner à la permission propriétaire.")
                                } else {
                                    result.map((i, n) => {
                                        ++current
                                        desc += `**${client.commands.get(i.name).help.type[0]} -** \`${i.name}\`\n`
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
                                }
                                embed0.setDescription(mypage[0])
                                embed0.setColor(color.cyan)
                                embed0.setFooter(`${'Résultat(s) : ' + test + '\nPage(s) : ' + mypage.length}`)
                                message.channel.send(embed0).then(async m => {
                                    const collector = m.createReactionCollector(filter);
                                    collector.on('collect', async r => {
                                        try {
                                            if (r.emoji.name === "⬅️") {
                                                if (page == 0) {
                                                    page = mypage.length - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                }
                                                r.users.remove(message.author.id)
                                            }
                                            if (r.emoji.name === "➡️") {
                                                if (page == mypage.length - 1) {
                                                    page = 0
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page + 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
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
                            })
                            break;
                        case 'buyer':
                            database.query("SELECT * FROM commands WHERE serverid = ? AND perm = ?", [message.guild.id, "buyer"], async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                let embed0 = new Discord.MessageEmbed()
                                var desc = ""
                                var desc2
                                let mypage = []
                                let page = 0
                                let current = 0
                                var test = 0
                                if (result.length < 1) {
                                    embed0.setDescription("Aucune commande n'est assigner à la permission acheteur.")
                                } else {
                                    result.map((i, n) => {
                                        ++current
                                        desc += `**${client.commands.get(i.name).help.type[0]} -** \`${i.name}\`\n`
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
                                }
                                embed0.setDescription(mypage[0])
                                embed0.setColor(color.cyan)
                                embed0.setFooter(`${'Résultat(s) : ' + test + '\nPage(s) : ' + mypage.length}`)
                                message.channel.send(embed0).then(async m => {
                                    const collector = m.createReactionCollector(filter);
                                    collector.on('collect', async r => {
                                        try {
                                            if (r.emoji.name === "⬅️") {
                                                if (page == 0) {
                                                    page = mypage.length - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page - 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                }
                                                r.users.remove(message.author.id)
                                            }
                                            if (r.emoji.name === "➡️") {
                                                if (page == mypage.length - 1) {
                                                    page = 0
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
                                                } else {
                                                    page = page + 1
                                                    embed0.setDescription(mypage[page])
                                                    m.edit(embed0)
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
                            })
                            break;
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
    name: "commands",
    aliases: [`command`],
    desc: ["Montre les commandes au niveau de permission choisi", "description en"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["commands public", "commands 1", "commands 2", "commands 3", "commands everyone", "commands giveaway", "commands whitelist", "commands owner", "commands buyer"],
    type: ["Information"],
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