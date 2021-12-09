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

                    if (!args[0]) {
                        await database.query("SELECT * FROM roles WHERE serverid = ?", message.guild.id, async (error, result) => {
                            if (error) return message.channel.send(lang.error + error)
                            let role = result[0].ban
                            if (role == "-") role = false
                            else if (!message.guild.roles.cache.find(r => r.id === role)) role = false
                            let msgperm = lang.banperm
                            msgperm = msgperm.replace('[role]', `<@&${role}>`)
                            embed.simple(client, message, "Perm kick/ban", message.guild.iconURL({ dynamic: true }), role ? msgperm : lang.rolebanproblem, role ? color.yellow : color.red, message.channel)
                        })
                    } else {
                        let argument = args[0]
                        if (!argument) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        argument = argument.toLowerCase()
                        if (argument == 'off') {
                            await database.query("SELECT * FROM roles WHERE serverid = ?", message.guild.id, async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                if (result[0].ban == '-') return embed.simple(client, message, "Perm kick/ban", message.guild.iconURL({ dynamic: true }), lang.banpermaloff, color.red, message.channel)
                                await database.query(`UPDATE roles SET ban = "-" WHERE serverid = ${message.guild.id}`, async (error, result) => {
                                    if (error) return message.channel.send(lang.error + error)
                                    return embed.simple(client, message, "Perm kick/ban", message.guild.iconURL({ dynamic: true }), lang.permbandeleted, color.green, message.channel)
                                })
                            })
                        } else {
                            let mention = message.mentions.roles.first()
                            if (mention) mention = mention.id
                            if (!mention) mention = args[0]
                            if (!mention || isNaN(mention) || mention.length != 18) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                            if (!message.guild.roles.cache.has(mention)) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                            await database.query("UPDATE roles SET ban = " + mention + " WHERE serverid = " + message.guild.id, async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                let msgperm = lang.banperm
                                msgperm = msgperm.replace('[role]', `<@&${mention}>`)
                                return embed.simple(client, message, "Perm kick/ban", message.guild.iconURL({ dynamic: true }), msgperm, color.green, message.channel)
                            })
                        }
                    }
                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

module.exports.help = {
    name: "permban",
    aliases: [`banrole`, `roleban`],
    desc: ["Assigner un rôle pour la perm ban", "Assign a role for the ban perm"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["permban", "permban <rôle/id>", "permban off"],
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