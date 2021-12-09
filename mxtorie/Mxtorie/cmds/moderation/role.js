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
                    var botperm = this.help.access_bot.map(i => ` \`${permissions[lang].i}\` |`)
                    if (this.help.access_bot.length > 0) {
                        await this.help.access_bot.map(i => {
                            if (!message.guild.me.hasPermission(i)) return botaccess = false
                        })
                        lang = language[`${lang}`]
                        if (!botaccess) return embed.permissionMissing(client, message, botperm, lang.botpermissionmissing)
                    }
                    lang = language[`${lang2}`]
                    let mention = message.mentions.roles.first()
                        if (mention) mention = mention.id
                        if (!mention) mention = args[2]
                        if (!mention) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        let role = message.guild.roles.cache.find(r => r.id === mention)
                        if (!role) message.guild.roles.cache.map(i => {if(i.name.includes(mention)) role = i})
                        if(!role) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        mention = message.mentions.members.first()
                        if (!mention) return message.reply(lang.by == "by" ? 'Invalid member mention.' : 'Mention du membre invalide.')
                        if (message.member.roles.highest.position < role.position && !config.owners.includes(message.author.id) && config.buyer != message.author.id && config.creator!=message.author.id) return message.reply(lang.by == "by" ? "This role is above you." : "Ce rôle est au dessus de toi.")
                        if (!args[0] || args[0] != 'add' && args[0] != 'remove') return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        switch (args[0]) {
                            case 'add':
                                mention.roles.add(role).catch(e => { return message.reply(e) })
                                message.channel.send(lang.by == 'by' ? 'Role given.' : 'Rôle donné.')
                                logs.sanctions(client, message, database, lang.by=='by'?'Role given':'Rôle donné', lang.roleadded, mention, false, color.mediumblue, lang, message.author, 'roles', false, false, role.id)
                                break;
                            case 'remove':
                                mention.roles.remove(role).catch(e => { return message.reply(e) })
                                message.channel.send(lang.by == 'by' ? 'Role removed.' : 'Rôle retiré.')
                                logs.sanctions(client, message, database, lang.by=='by'?'Role removed':'Rôle retiré', lang.roleremoved, mention, false, color.mediumorchid, lang, message.author, 'roles', false, false, role.id)
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
    name: "role",
    aliases: [`r`],
    desc: ["Ajoute ou retire un rôle", "Add or remove a role"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_ROLES"],
    usage: ["role add <mention> <role/id>", "role remove <mention> <role/id>"],
    type: ["Modération ++", "Moderation ++"],
    perm: "whitelist"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, 'whitelist']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}