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
const { sanctions } = require("../../functions/db/main")
const logs = require('../../functions/logs/main')
getNow = () => { return { time: new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }), }; };
module.exports.run = async (client, message, args, prefix, perm, whitelisted, database, database2, lang) => {
    try {
        await CmdExist(database, message, this.help.name).then(async () => {
            await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, this.help.name], async (error, result) => {
                var canaccess = false
                var perm = result[0].perm
                try {
                    if (!result[0]) canaccess = true
                    await database.query("SELECT * FROM roles WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
                        if (error || result < 1) return message.reply(lang.undefinederror)
                        let myrole = result[0].ban
                        if (!message.guild.roles.cache.has(myrole)) return embed.simple(client, message, 'Perm kick/ban', message.guild.iconURL({ dynamic: true }), language[lang].rolebanproblem, color.orangered, message.channel)
                        if (message.member.roles.cache.has(myrole)) canaccess = true
                        if (!canaccess) return message.channel.send(language[lang].permissionmissing + `**\`perm ${perm} minimum\`**`)
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

                        let mention = message.mentions.members.first()
                        if (mention) mention = mention.id
                        if (!mention) mention = args[0]
                        if (!mention || isNaN(mention) || mention.length != 18) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        if (!message.guild.members.cache.has(mention)) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        let reason = args.splice(1).join(' ')
                        if (!reason) reason = 'aucune raison'
                        //sanctions(client, message, mention, 'kick', reason, message.author.id, database)
                        let member = message.guild.members.cache.find(m => m.id === mention)
                        if (member) member.send(lang.by == 'by' ? `You has been kicked from \`${message.guild.name}\` for the next reason : **${reason}**` : `Tu as été exclu de \`${message.guild.name}\` pour la raison suivante : **${reason}**`).catch(e => { })
                        if (!member) member = mention
                        let warnlogs = lang.sanctionned
                        warnlogs = warnlogs.replace('[member]', (member.id ? member.id : member) + '(' + mention + ')')
                        warnlogs = warnlogs.replace('[author]', message.author)
                        warnlogs = warnlogs.replace('[reason]', `\`${reason}\``)
                        warnlogs = warnlogs.replace('[sanction]', 'kick')
                        logs.sanctions(client, message, database, 'Kick', lang.kicklogs, member.id, reason, color.darkblue, lang, message.author, 'sanctions')
                        sanctions(client, message, member, 'kick', reason, message.author, database)
                        embed.warn(client, message, mention, 'kick', color.green, true, false, lang, reason)
                        member = message.guild.members.cache.find(m => m.id === mention)
                        member.kick({ reason: reason }).catch(e => { return message.reply(e) })
                    })
                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

module.exports.help = {
    name: "kick",
    aliases: [`exclure`],
    desc: ["Exclure un utilisateur", "Kick a member from the server"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "KICK_MEMBERS"],
    usage: ["kick <membre/id> [raison]"],
    type: ["Modération", "Moderation"],
    perm: "kick/ban"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, 'kick/ban']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}