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

                    await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async(error, result, fields) => {
                        if (error) return message.reply(lang.error+error)
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
                        let embed2 = new Discord.MessageEmbed()
                        embed2.setTitle('Protections')
                        embed2.setDescription(lang.by == 'by' ? '**Use this website to edit my settings : ' + config.web + '**' : '**Utilisez ce site pour modifier mes paramétres : ' + config.web + '**')
                        await val1.map((i, n) => {
                            embed2.addField(i, val2[n], true)
                        })
                        embed2.addField(lang.by=='by' ? '**Punish**' : '**Punition**', '__'+punish+'__', false)
                        embed2.setColor('RANDOM')
                        message.channel.send(embed2)
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
    name: "protections",
    aliases: [`protect`, `protection`],
    desc: ["Affiche les protections actuel", "Show current protection"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["protections"],
    type: ["Configuration", "Setup"],
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