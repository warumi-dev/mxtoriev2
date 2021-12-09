const Discord = require("discord.js")
const config = require("../../config.json")
const data = require("../../database.json")
const color = require("../../color.json")
const permissions = require("../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")
const embed2 = require("../../functions/embed/main")
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
                            if (!message.guild.roles.cache.has(myrole)) return embed2.simple(client, message, 'Perm kick/ban', message.guild.iconURL({ dynamic: true }), lang.rolebanproblem, color.orangered, message.channel)
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
                        if (!botaccess) return embed2.permissionMissing(client, message, botperm, lang.botpermissionmissing)
                    }
                    lang = language[`${lang2}`]

                    let role = message.mentions.roles.first()
                    if (!role) {
                        role = args[0]
                        if (!role) return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        if (!role || role.length != 18 || isNaN(role)) return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        role = message.guild.roles.cache.find(r => r.id === role)
                        if (!role) return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    }
                    let embed = new Discord.MessageEmbed()
                    if (lang.by == 'by') {
                        embed.addField('Role', role, false)
                        embed.addField('Member(s) with this role', role.members.size, false)
                        embed.addField('Color', role.hexColor, false)
                        embed.addField('Creation date', moment(role.createdAt).format('[The] DD/MM/YYYY [at] HH:mm:ss'), false)
                        embed.addField('Display separately', role.hoist ? 'Yes' : 'No', false)
                        embed.addField('Mentionnable', role.mentionable ? 'Yes' : 'No', false)
                        embed.setFooter(`ID : ${role.id}`)
                        embed.setColor(role.hexColor)
                        embed.setTitle("Informations about " + role.name)
                    } else {
                        embed.addField('Rôle', role, false)
                        embed.addField('Membre(s) avec ce rôle', role.members.size, false)
                        embed.addField('Couleur', role.hexColor, false)
                        embed.addField('Date de création', moment(role.createdAt).format('[Le] DD/MM/YYYY [à] HH:mm:ss'), false)
                        embed.addField('Affiché séparement', role.hoist ? 'Oui' : 'Non', false)
                        embed.addField('Mentionnable', role.mentionable ? 'Oui' : 'Non', false)
                        embed.setFooter(`ID : ${role.id}`)
                        embed.setColor(role.hexColor)
                        embed.setTitle("Informations sur " + role.name)
                    }
                    message.channel.send(embed)

                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

// return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

module.exports.help = {
    name: "roleinfos",
    aliases: [`roleinfos`, `roleinfo`, `inforole`, `infosrole`, `Rinfo`, `Rinfos`, `rinfo`, `rinfos`],
    desc: ["Montre des informations sur un rôle", "Show some informations on a role"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["roleinfos [mention/id]"],
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