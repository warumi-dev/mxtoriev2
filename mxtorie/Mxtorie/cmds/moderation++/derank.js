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
const { sanctions } = require("../../functions/db/main")
const { DEFAULT_MIN_VERSION } = require("tls")
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

                    let mention2 = message.mentions.members.first()
                    if (mention2) mention2 = mention2.id
                    if (!mention2) mention2 = args[0]
                    if (!mention2 || mention2.length != 18) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    let mention = message.guild.members.cache.find(m => m.id === mention2)
                    if (!mention) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    if (message.member.roles.highest.position <= mention.roles.highest.position && !config.owners.includes(message.author.id) && config.buyer != message.author.id && config.creator != message.author.id) return message.reply(lang.by == "by" ? 'You can\'t derank someone above you or at the same position.' : 'Vous ne pouvez pas dérank quelqu\'un au dessus de vous ou au même niveau.')
                    let roles = []
                    let role = await mention.roles.cache.map(role => roles.push(role.id))
                    role
                    let reason = args.splice(1).join(' ')
                    if (!reason) reason = 'aucune raison'
                    sanctions(client, message, mention, 'derank', reason, message.author, database)
                    logs.sanctions(client, message, database, 'Derank', lang.deranked, mention.id, reason, color.indigo, lang, message.author, 'sanctions', false, false)
                    let msg = lang.hasbeenderanked
                    msg = msg.replace('[member]', mention)
                    msg = msg.replace('[author]', message.author)
                    msg = msg.replace('[reason]', `\`${reason}\``)
                    embed.simple(client, message, 'Derank', mention.user.displayAvatarURL({ dynamic: true }), msg, color.lime, message.channel)
                    mention.send(lang.by != 'by' ? `Tu as été derank par ${message.author} sur **${message.guild.name}** pour la raison suivante : \`${reason}\`` : `You has been derank by ${message.author} on **${message.guild.name}** for the next reason : \`${reason}\``).catch(e => { })
                    await mention.roles.remove(roles, `Derank by ${message.member.user.tag}`).catch(e => message.reply(e))
                    await database.query("SELECT * FROM settings WHERE serverid = ?", message.guild.id, async function (error, result, fields) {
                        if (error || result < 1) return
                        if (result[0].defaultrole != 'on') return
                        await database.query("SELECT * FROM roles WHERE serverid = ?", message.guild.id, async function (error, result, fields) {
                            if (error || result < 1) return
                            if (!message.guild.roles.cache.has(result[0].defaultrole)) return
                            mention.roles.add(result[0].defaultrole).catch(e => { return })
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
    name: "derank",
    aliases: [``],
    desc: ["Retire tout les rôles d'un membre, rajoute ensuite si enregistrer le rôle par défaut", "Remove all roles of the mentionned member, add if registred the default role"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_ROLES"],
    usage: ["derank <mention/id> [raison]"],
    type: ["Modération ++", "Moderation"],
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
