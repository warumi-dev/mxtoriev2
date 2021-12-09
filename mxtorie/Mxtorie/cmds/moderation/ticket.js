const Discord = require("discord.js")
const config = require("../../config.json")
const data = require("../../database.json")
const color = require("../../color.json")
const permissions = require("../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")
const embed6 = require("../../functions/embed/main")
const language = require("../../lang.json")
const logs = require('../../functions/logs/main')
const moment = require('moment')
const axios = require('axios')
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
                            if (!message.guild.roles.cache.has(myrole)) return embed6.simple(client, message, 'Perm kick/ban', message.guild.iconURL({ dynamic: true }), lang.rolebanproblem, color.orangered, message.channel)
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
                        if (!botaccess) return embed6.permissionMissing(client, message, botperm, lang.botpermissionmissing)
                    }
                    lang = language[`${lang2}`]


                    var usage = this.help.usage
                    var name = this.help.name
                    let embed4 = new Discord.MessageEmbed()
                    var ticketopen = false;
                    await database.query("SELECT * FROM moderations WHERE serverid = ?", message.guild.id, async function (error, result, fields) {
                        if (error || result < 1) return
                        if (result[0].ticket == '0') return console.log('ticket disable')
                        await database.query("SELECT * FROM channels WHERE serverid = ?", message.guild.id, async function (error, result, fields) {
                            if (error || result < 1) return console.log("ticket channel error")
                            var ticketchan = result[0].tickets
                            var ticketlogs = result[0].ticketslogs
                            await database.query("SELECT * FROM roles WHERE serverid = ?", message.guild.id, async function (error, result, fields) {
                                if (error || result < 1) return console.log("ticket role error")
                                var ticketrole = result[0].ticket
                                await database.query("SELECT * FROM tickets WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async function (error, result, fields) {
                                    var ticketmember
                                    if (error || result < 1) { ticketopen = false }
                                    else { ticketopen = true; ticketmember = result[0].channel }
                                    if (!args[0]) return embed6.helpargs(client, message, name + " - " + lang.invalidargs, usage, prefix)
                                    switch (args[0]) {
                                        case 'create':
                                            try {
                                                //console.log('bite')
                                                if (message.channel.id != ticketchan) return
                                                if (ticketopen) {
                                                    let msg3 = new Discord.MessageEmbed()
                                                        .setDescription(`${message.member.user} ${lang.alreadyticket} <#${ticketmember}>`)
                                                        .setColor(color.red)
                                                        .setTimestamp()
                                                    message.channel.send(msg3).then(m => m.delete({ timeout: 3000 }))
                                                    message.delete()
                                                } else {
                                                    var entier = Number(1, 2000);
                                                    var ticketname
                                                    if (!args[1] || args[1] == ' ') { ticketname = `-${entier}` } else {
                                                        var hm = args.splice(1).join(' ')
                                                        if (!hm.includes(' ')) {
                                                            ticketname = hm
                                                        } else {
                                                            ticketname = hm.replace(' ', '-')
                                                        }
                                                    }
                                                    await message.member.guild.channels.create("ticket-" + ticketname, { type: 'text', parent: message.channel.parent.id }).then(async vc => {
                                                        var values = [[message.guild.id, message.author.id, vc.id]]
                                                        database.query("INSERT INTO tickets (serverid, userid, channel) VALUES ?", [values], async function (error, result, fields) {
                                                            if (error || result < 1) return message.reply(lang.undefinederror)
                                                            vc.updateOverwrite(message.guild.roles.everyone.id, {
                                                                SEND_MESSAGES: false,
                                                                VIEW_CHANNEL: false
                                                            }).catch(e => { message.channel.send('**Error cant assign everyone permission to <#' + vc.id + '>** : ' + e) })
                                                            setTimeout(async () => {
                                                                vc.updateOverwrite(message.author.id, {
                                                                    SEND_MESSAGES: true,
                                                                    VIEW_CHANNEL: true,
                                                                    ATTACH_FILES: true
                                                                }).catch(e => { message.channel.send('**Error cant assign the channel permission (for the user) to <#' + vc.id + '>** : ' + e) })
                                                                let mainrole = message.guild.roles.cache.find(r => r.id === ticketrole)
                                                                if (!mainrole) return
                                                                message.guild.roles.cache.filter(role => role.position > mainrole.position).map(m => {
                                                                    if (!m.id === '856857550955872266') return
                                                                    vc.updateOverwrite(m.id, {
                                                                        SEND_MESSAGES: true,
                                                                        VIEW_CHANNEL: true,
                                                                        ATTACH_FILES: true
                                                                    }).catch(e => { return })
                                                                })
                                                                vc.updateOverwrite(ticketrole, {
                                                                    SEND_MESSAGES: true,
                                                                    VIEW_CHANNEL: true,
                                                                    ATTACH_FILES: true
                                                                }).catch(e => { return })
                                                            }, 1000);
                                                            embed4.setDescription(lang.by == 'by' ? `\`${vc.name}\` create for ${message.author}` : `\`${vc.name}\` créé pour ${message.author}`)
                                                            embed4.setColor(color.cyan)
                                                            embed4.setTimestamp()
                                                            log(message, 'tickets', embed4, database)
                                                            let msg = new Discord.MessageEmbed()
                                                                .setDescription(`${message.member.user} ${lang.welcometicket} : ${vc}`)
                                                                .setColor(color.greenyellow)
                                                                .setTimestamp()
                                                            message.channel.send(msg).then(m => m.delete({ timeout: 3000 }))
                                                            /*setTimeout(() => {
                                                                msgs.delete()
                                                            }, 4000);*/
                                                            let embed = new Discord.MessageEmbed()
                                                                .setDescription(`${message.member.user} ${lang.ticketwelcome} !\n\`${prefix}ticket delete\` ${lang.closeticket}`)
                                                                .setColor(color.green)
                                                                .setTimestamp()
                                                                .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                                                            vc.send(embed)
                                                            message.delete()
                                                        })
                                                    })
                                                }
                                            } catch (err) {
                                                return console.log(err)
                                            }

                                            break;
                                        case 'delete':
                                            if (!ticketopen) return
                                            if (message.channel.id != ticketmember) return
                                            var values2 = [[message.guild.id, message.author.id]]

                                            message.channel.send(lang.deleteticket)
                                            ticketopen = false
                                            embed4.setDescription(lang.by == 'by' ? `\`${message.channel.name}\` ticket of ${message.author} deleted.` : `\`${message.channel.name}\` ticket de ${message.author} supprimé.`)
                                            embed4.setColor(color.cyan)
                                            embed4.setTimestamp()
                                            log(message, 'tickets', embed4, database)
                                            setTimeout(async () => {
                                                await database.query("DELETE FROM tickets WHERE serverid = " + message.guild.id + " AND userid = " + message.author.id, async function (error, result, fields) {
                                                    if (error || result < 1) return message.reply(lang.undefinederror + " " + error)
                                                    else return message.channel.delete()
                                                })
                                            }, 3000)
                                            break;
                                        case 'close':
                                            if (message.member.roles.highest.position < message.guild.roles.cache.find(r => r.id == ticketrole).position) return
                                            if (!args[1] || isNaN(args[1])) return message.reply(lang.invaliduserid)
                                            await database.query("SELECT * FROM tickets WHERE serverid = ? AND userid = ?", [message.guild.id, args[1]], async function (error, result, fields) {
                                                if (error || result < 1) return message.reply(lang.noticket)
                                                let v = result[0].channel
                                                let chan = message.guild.channels.cache.find(c => c.id == v)
                                                if (!chan) return message.reply(lang.errorticket)
                                                embed4.setDescription(lang.by == 'by' ? `\`${chan.name}\` ticket of <@${args[1]}> deleted by ${message.author}.` : `\`${chan.name}\` ticket de <@${args[1]}> supprimé par ${message.author}.`)
                                                embed4.setColor(color.cyan)
                                                embed4.setTimestamp()
                                                log(message, 'tickets', embed4, database)
                                                chan.delete().catch(e => { return message.reply(e) })
                                                var values3 = [[message.guild.id, args[1]]]
                                                await database.query("DELETE FROM tickets WHERE serverid = " + message.guild.id + " AND userid = " + args[1], async function (error, result, fields) {
                                                    if (error || result == undefined) return message.reply(lang.undefinederror + " " + error)
                                                    //else return chan.delete()
                                                })
                                                message.delete().catch(e => { return })
                                            })
                                            break;
                                        case 'reset':
                                            if (!message.member.roles.cache.find(r => r.id == ticketrole)) return
                                            if (!args[1] || isNaN(args[1])) return embed6.helpargs(client, message, name + " - " + lang.invalidargs, usage, prefix)
                                            await database.query("SELECT * FROM tickets WHERE serverid = ? AND userid = ?", [message.guild.id, args[1]], async function (error, result, fields) {
                                                if (error || result < 1) return message.reply(lang.noticket)
                                                await database.query("DELETE FROM tickets WHERE serverid = " + message.guild.id + " AND userid = " + args[1], async function (error, result, fields) {
                                                    if (error || result < 1) return message.reply(lang.undefinederror)
                                                    var msg = lang.ticketrest
                                                    msg = msg.replace('[member]', `<@${args[1]}>`)
                                                    message.reply(`${msg}`)
                                                })
                                            })
                                            break;
                                    }
                                })
                            })
                        })
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
    name: "ticket",
    aliases: [`tct`, `contact`],
    desc: ["Créé votre ticket afin de discuter personnellement avec une équipe d'un serveur", "Create a channel for talk with a moderators"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_CHANNELS"],
    usage: ["ticket create [nom]", "ticket delete", "ticket close <id du membre>", "ticket reset <id du membre>"],
    type: ["Modération", "Moderation"],
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

async function log(message, type, myembed, database) {
    if (!type) return
    var r
    await database.query("SELECT * FROM channels WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
        if (result < 1) return
        switch (type) {
            case 'sanction':
                r = result[0].sanctions
                break;
            case 'channel':
                r = result[0].channel
                break;
            case 'protections':
                r = result[0].protections
                break;
            case 'tickets':
                r = result[0].ticketslogs
                break;
        }
        if (r == '-') return
        if (!message.guild.channels.cache.has(r)) return
        message.guild.channels.cache.find(c => c.id === r).send(myembed)
    })
}

function Number(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}