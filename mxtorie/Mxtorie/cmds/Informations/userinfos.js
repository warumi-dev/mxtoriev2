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

                    let member = message.mentions.members.first() || message.member
        let status;
        let sanc
        if (member.presence.status == "dnd") {
            status = "Do not distribut";
        } else if (member.presence.status == "idle") {
            status = "Absent";
        } else if (member.presence.status == "online") {
            status = "Online";
        } else {
            status = "Offline";
        }
        await database.query("SELECT * FROM sanctions WHERE serverid = ? AND userid = ?", [message.guild.id, member.id], async function(error, result, fields) {
            if (error || result < 1) {
                sanc = []
            } else {
                sanc = result
            }
            var buyer = false
            var owner = false
            var creator = false
            if (config.buyer == member.id) buyer = true
            if (config.owners.includes(member.id)) owner = true
            if (config.creator == member.id) creator = true
            if (lang.by == 'by') {
                message.channel.send(new Discord.MessageEmbed()
                    .setDescription(creator ? '**CREATOR**' : (buyer ? '**BUYER**' : (owner ? '**OWNER**' : 'Simple member')))
                    .addField('Member', member, true)
                    .addField('Tag', member.user.tag, true)
                    .addField('Account creation date', moment(member.user.createdAt).format('[The] DD/MM/YYYY [at] HH:mm:ss'), true)
                    .addField('Join date', moment(member.joinedAt).format('[The] DD/MM/YYYY [at] HH:mm:ss'), true)
                    .addField('Booster', member.premiumSince ? moment(member.premiumSince).format('[The] DD/MM/YYYY [at] HH:mm:ss') : 'Is not boosting', true)
                    .addField('Sanction(s)', sanc ? sanc.length : 'Nothing', true)
                    .addField('Role(s) : ' + member.roles.cache.size, member.roles.cache.map(r => `${r}`).join(' | '), true)
                    .addField('Status :', status, true)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .setFooter(`ID : ${member.id} || ${member.guild.name}`)
                    .setTitle("Informations about " + member.displayName)
                    .setColor(color.goldenrod))
            } else {
                message.channel.send(new Discord.MessageEmbed()
                    .setDescription(creator ? '**CRÉATEUR**' : (buyer ? '**ACHETEUR**' : (owner ? '**PROPRIETAIRE**' : 'Simple membre')))
                    .addField('Membre', member, true)
                    .addField('Tag', member.user.tag, true)
                    .addField('Date de création', moment(member.user.createdAt).format('[Le] DD/MM/YYYY [à] HH:mm:ss'), true)
                    .addField('Rejoins le', moment(member.joinedAt).format('[Le] DD/MM/YYYY [à] HH:mm:ss'), true)
                    .addField('Booster', member.premiumSince ? moment(member.premiumSince).format('[Le] DD/MM/YYYY [à] HH:mm:ss') : 'Ne boost pas', true)
                    .addField('Sanction(s)', sanc ? sanc.length : 'Aucune', true)
                    .addField('Rôle(s) : ' + member.roles.cache.size, member.roles.cache.map(r => `${r}`).join(' | '), true)
                    .addField('Statut :', status, true)
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                    .setFooter(`ID : ${member.id} || ${member.guild.name}`)
                    .setTitle("Informations sur " + member.displayName)
                    .setColor(color.goldenrod))
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
    name: "userinfos",
    aliases: [`info`, `infos`, `userinfo`],
    desc: ["Montre des informations sur un membre", "Show some information about a member"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["userinfos [mention]"],
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