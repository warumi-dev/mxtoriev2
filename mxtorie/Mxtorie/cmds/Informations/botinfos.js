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
const os = require('os')
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

                    const embed2 = new Discord.MessageEmbed()
                    embed2.setFooter(`Mxtorie`)
                    var core = os.cpus()[0]
                    if (lang.by == 'by') {
                        embed2.setThumbnail(client.user.displayAvatarURL())
                        embed2.setTitle('Informations about the bot')
                        embed2.setColor(color.purple)
                        embed2.addFields(
                            {
                                name: '🏠 Servers',
                                value: `${client.guilds.cache.size}`,
                                inline: false
                            },
                            {
                                name: '📄 Channels',
                                value: `${client.channels.cache.size}`,
                                inline: false
                            },
                            {
                                name: '👥 Users',
                                value: `${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0).toLocaleString()}`,
                                inline: false
                            },
                            {
                                name: '🏓 Ping',
                                value: `${Math.round(client.ws.ping - 70)}ms`,
                                inline: false
                            },
                            {
                                name: '🕔 Creation date',
                                value: client.user.createdAt,
                                inline: false
                            },
                            {
                                name: '📊 Server infos',
                                value: `${os.totalmem() / 953674} Mb`,
                                inline: true
                            },
                            {
                                name: '💻 Plateform',
                                value: process.platform,
                                inline: true
                            },
                            {
                                name: '💻 Node.js',
                                value: process.version,
                                inline: true
                            },
                            {
                                name: '🕔 Bot uptime',
                                value: pretty(client.uptime, { long: false }),
                                inline: true
                            },
                            {
                                name: '🕔 Process uptime',
                                value: pretty(os.uptime() * 1000, { long: false }),
                                inline: true
                            },
                            {
                                name: 'CPU',
                                value: `${os.cpus().length + 2} ♥ \n ${core.model} 💾 \n ${core.speed} 📈`,
                                inline: false
                            }
                        )
                        embed2.setTimestamp()

                        await message.channel.send(embed2)
                    } else {
                        embed2.setThumbnail(client.user.displayAvatarURL())
                        embed2.setTitle('Informations sur le bot')
                        embed2.setColor(color.purple)
                        embed2.addFields(
                            {
                                name: '🏠 Serveurs',
                                value: `${client.guilds.cache.size - 1}`,
                                inline: true
                            },
                            {
                                name: '📄 Salons',
                                value: `${client.channels.cache.size}`,
                                inline: true
                            },
                            {
                                name: '👥 Membres',
                                value: `${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0).toLocaleString()}`,
                                inline: true
                            },
                            {
                                name: '🏓 Ping',
                                value: `${Math.round(client.ws.ping - 70)}ms`,
                                inline: true
                            },
                            {
                                name: '🕔 Date de création',
                                value: client.user.createdAt,
                                inline: true
                            },
                            {
                                name: '📊 Disque dur',
                                value: `${os.totalmem() / 953674} Mb`,
                                inline: true
                            },
                            {
                                name: '💻 Plateforme',
                                value: process.platform,
                                inline: true
                            },
                            {
                                name: ':green_book: Node.js',
                                value: process.version,
                                inline: true
                            },
                            {
                                name: '🕔 Bot en ligne depuis',
                                value: pretty(client.uptime, { long: false }),
                                inline: true
                            },
                            {
                                name: '🕔 Process en ligne depuis',
                                value: pretty(os.uptime() * 1000, { long: false }),
                                inline: true
                            },
                            {
                                name: 'CPU',
                                value: `${os.cpus().length + 2} coeurs\n ${core.model}\n ${core.speed}`,
                                inline: true
                            },
                            {
                                name: ':file_cabinet: Mémoire',
                                value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}mb`,
                                inline: true
                            }
                        )
                        embed2.setTimestamp()

                        await message.channel.send(embed2)
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
    name: "botinfos",
    aliases: [`infobot`, `infosbot`, `botinfo`],
    desc: ["Montre des informations sur le bot", "Show some informations on the bot"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["botinfos"],
    type: ["Informatio", "Information"],
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