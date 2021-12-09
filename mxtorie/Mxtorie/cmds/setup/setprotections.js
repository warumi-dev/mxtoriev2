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

var antilink
var acceptgif
var antispam
var spamlevel
var antirole
var antichannel
var antibot
var prtcjoin
var prtcjointime
var antiwebhook
var antieditrole
var antiguild
var punish
var token
var msgwait

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


                    filter = (reaction, user) => ['💭', '📃', '👤', '⚔️', '🎭', '🛡️', '🤖', '🚆', '🕐', '🖥️', '✏️', '📝', '👥', '🔨'].includes(reaction.emoji.name) && user.id === message.author.id,
                        dureefiltrer = response => { return response.author.id === message.author.id };
                    msgwait = await message.channel.send(lang.by == 'by' ? 'Please wait the time to add all reactions.' : 'Veuillez attendre la fin de l\'ajout des réactions.')

                    await Promise.all(['💭', '📃', '👤', '⚔️', '🎭', '🛡️', '🤖', '🚆', '🕐', '🖥️', '✏️', '📝', '👥', '🔨'].map(r => msgwait.react(r)))
                    await updateEmbed(message, database, lang)
                    const filterReaction = (reaction, user) => user.id === message.author.id && !user.bot
                    const filterMessage = (m) => m.author.id === message.author.id && !m.author.bot
                    const collectorReaction = await new Discord.ReactionCollector(msgwait, filterReaction)
                    collectorReaction.on('collect', async reaction => {
                        try {
                            switch (reaction.emoji.name) {
                                case '💭':
                                    reaction.users.remove(message.author.id);
                                    await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async(error, result) => {
                                        if(error) return message.channel.send(lang.error+error)
                                        var myval = result[0].links
                                        await database.query("UPDATE protections SET links = ? WHERE serverid = ?", [myval=='off'?'on':'off', message.guild.id])
                                        await updateEmbed(message, database, lang)
                                    })
                                break;
                                case '📃':
                                    reaction.users.remove(message.author.id);
                                    await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async(error, result) => {
                                        if(error) return message.channel.send(lang.error+error)
                                        var myval = result[0].gif
                                        await database.query("UPDATE protections SET gif = ? WHERE serverid = ?", [myval=='off'?'on':'off', message.guild.id])
                                        await updateEmbed(message, database, lang)
                                    })
                                break;
                                case '👤':
                                    reaction.users.remove(message.author.id);
                                    await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async(error, result) => {
                                        if(error) return message.channel.send(lang.error+error)
                                        var myval = result[0].spam
                                        await database.query("UPDATE protections SET spam = ? WHERE serverid = ?", [myval=='off'?'on':'off', message.guild.id])
                                        await updateEmbed(message, database, lang)
                                    })
                                break;
                                case '⚔️':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` ⚔️ Quel sera l'agressivité de l'antispam ? \`low\` / \`medium\` / \`agressive\``).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                let argument = msg.content.toLowerCase()
                                                msg.delete().catch(e => {return})
                                                if(argument!='low'&&argument!='medium'&&argument!='agressive') return message.channel.send('Réponse invalide.').then(m => {msg.delete().catch(e => { }); m.delete({timeout: 3000}).catch(e => { })})
                                                await database.query("UPDATE protections SET spamlevel = ? WHERE serverid = ?", [argument, message.guild.id])
                                                await updateEmbed(message, database, lang)
                                            }).catch(e => {return message.channel.send("Vous avez mis trop de temps à répondre.").then(m => m.delete({timeout: 3000}).catch(e => {return}))})
                                        })
                                break;
                                case '🎭':
                                    reaction.users.remove(message.author.id);
                                    await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async(error, result) => {
                                        if(error) return message.channel.send(lang.error+error)
                                        var myval = result[0].role
                                        await database.query("UPDATE protections SET role = ? WHERE serverid = ?", [myval=='off'?'on':'off', message.guild.id])
                                        await updateEmbed(message, database, lang)
                                    })
                                break;
                                case '🛡️':
                                    reaction.users.remove(message.author.id);
                                    await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async(error, result) => {
                                        if(error) return message.channel.send(lang.error+error)
                                        var myval = result[0].channel
                                        await database.query("UPDATE protections SET channel = ? WHERE serverid = ?", [myval=='off'?'on':'off', message.guild.id])
                                        await updateEmbed(message, database, lang)
                                    })
                                break;
                                case '🤖':
                                    reaction.users.remove(message.author.id);
                                    await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async(error, result) => {
                                        if(error) return message.channel.send(lang.error+error)
                                        var myval = result[0].bot
                                        await database.query("UPDATE protections SET bot = ? WHERE serverid = ?", [myval=='off'?'on':'off', message.guild.id])
                                        await updateEmbed(message, database, lang)
                                    })
                                break;
                                case '🚆':
                                    reaction.users.remove(message.author.id);
                                    await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async(error, result) => {
                                        if(error) return message.channel.send(lang.error+error)
                                        var myval = result[0].prtcjoin
                                        await database.query("UPDATE protections SET prtcjoin = ? WHERE serverid = ?", [myval=='off'?'on':'off', message.guild.id])
                                        await updateEmbed(message, database, lang)
                                    })
                                break;
                                case '🕐':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 🕐 Quel est le temps de création minimum ? \`10s = 10secondes\` / \`10m = 10minutes\` / \`10h = 10heures\` / \`10d = 10jours\``).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                let argument = ms(msg.content)
                                                msg.delete().catch(e => {return})
                                                if(!argument) return message.channel.send('Réponse invalide.').then(m => {msg.delete().catch(e => { }); m.delete({timeout: 3000}).catch(e => { })})
                                                await database.query("UPDATE protections SET prtcjointime = ? WHERE serverid = ?", [argument, message.guild.id])
                                                await updateEmbed(message, database, lang)                                   
                                            }).catch(e => {return message.channel.send("Vous avez mis trop de temps à répondre.").then(m => m.delete({timeout: 3000}).catch(e => {return}))})
                                        })
                                break;
                                case '🖥️':
                                    reaction.users.remove(message.author.id);
                                    await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async(error, result) => {
                                        if(error) return message.channel.send(lang.error+error)
                                        var myval = result[0].webhook
                                        await database.query("UPDATE protections SET webhook = ? WHERE serverid = ?", [myval=='off'?'on':'off', message.guild.id])
                                        await updateEmbed(message, database, lang)
                                    })
                                break;
                                case '✏️':
                                    reaction.users.remove(message.author.id);
                                    await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async(error, result) => {
                                        if(error) return message.channel.send(lang.error+error)
                                        var myval = result[0].antieditrole
                                        await database.query("UPDATE protections SET antieditrole = ? WHERE serverid = ?", [myval=='off'?'on':'off', message.guild.id])
                                        await updateEmbed(message, database, lang)
                                    })
                                break;
                                case '📝':
                                    reaction.users.remove(message.author.id);
                                    await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async(error, result) => {
                                        if(error) return message.channel.send(lang.error+error)
                                        var myval = result[0].antiguild
                                        await database.query("UPDATE protections SET antiguild = ? WHERE serverid = ?", [myval=='off'?'on':'off', message.guild.id])
                                        await updateEmbed(message, database, lang)
                                    })
                                break;
                                case '👥':
                                    reaction.users.remove(message.author.id);
                                    await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async(error, result) => {
                                        if(error) return message.channel.send(lang.error+error)
                                        var myval = result[0].token
                                        await database.query("UPDATE protections SET token = ? WHERE serverid = ?", [myval=='off'?'on':'off', message.guild.id])
                                        await updateEmbed(message, database, lang)
                                    })
                                break;
                                case '🔨':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 🔨 Quel sera la sanction ? \`derank\` / \`kick\` / \`ban\``).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                let argument = msg.content.toLowerCase()
                                                msg.delete().catch(e => {return})
                                                if(argument!='derank'&&argument!='kick'&&argument!='ban') return message.channel.send('Réponse invalide.').then(m => {msg.delete().catch(e => { }); m.delete({timeout: 3000}).catch(e => { })})
                                                await database.query("UPDATE protections SET punish = ? WHERE serverid = ?", [argument, message.guild.id])
                                                await updateEmbed(message, database, lang)                                          
                                            }).catch(e => {return message.channel.send("Vous avez mis trop de temps à répondre.").then(m => m.delete({timeout: 3000}).catch(e => {return}))})
                                        })
                                break;
                            }
                        } catch (err) { }
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
    name: "setprotections",
    aliases: [`setprotect`, `setprotection`],
    desc: ["Permet d'activer ou désactiver les protections du bot", "Enable or disable the bot protections"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["setprotections"],
    type: ["Configuration", "Setup"],
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

async function updateEmbed(message, database, lang) {
    await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
        if (error) return message.reply(lang.error + error)
        if (!result[0]) return message.reply(lang.error)
        let r = result[0]
        var antilink = r.links
        var acceptgif = r.gif
        var antispam = r.spam
        var spamlevel = r.spamlevel
        var antirole = r.role
        var antichannel = r.channel
        var antibot = r.bot
        var prtcjoin = r.prtcjoin
        var prtcjointime = r.prtcjointime
        var antiwebhook = r.webhook
        var antieditrole = r.antieditrole
        var antiguild = r.antiguild
        var punish = r.punish
        var token = r.token
        var val1 = ["Anti-link", "Accept gif", "Anti-spam", "Spam level", "Anti-role", "Anti-channel", "Anti-bot", "Anti-new account", "Anti-new account time", "Anti-webhook", "Anti-edit role", "Anti-edit server", "Anti-token"]
        var val2 = [antilink, acceptgif, antispam, spamlevel, antirole, antichannel, antibot, prtcjoin, pretty(ms(prtcjointime)), antiwebhook, antieditrole, antiguild, token]
        var val3 = ['💭', '📃', '👤', '⚔️', '🎭', '🛡️', '🤖', '🚆', '🕐', '🖥️', '✏️', '📝', '👥', '🔨']
        let embed2 = new Discord.MessageEmbed()
        embed2.setTitle('Protections')
        embed2.setDescription(lang.by == 'by' ? '**Use this website to edit my settings : ' + config.web + '**' : '**Utilisez ce site pour modifier mes paramétres : ' + config.web + '**')
        await val1.map((i, n) => {
            embed2.addField(`\`${val3[n]}\` - ${i}`, val2[n] != 'on' && val2[n] != 'off' ? val2[n] : (val2[n] == 'on' ? '✅' : '❌'), true)
        })
        embed2.addField(lang.by == 'by' ? '**Punish**' : '**Punition**', '__' + punish + '__', false)
        embed2.setColor('RANDOM')
        msgwait.edit(embed2).catch(e => { })
    })

}