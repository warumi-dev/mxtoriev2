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
module.exports.run = async (client, message, args, prefix, perm, whitelisted, database, database2, lang) => {
    try {
        await CmdExist(database, message, this.help.name)
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
                    embed.perm(client, message, database, lang)
                } else {
                    if (!config.owners.includes(message.author.id) && !config.buyer != message.author.id && config.creator != message.author.id) return message.channel.send(lang.permissionmissing + `**\`${lang.owner} minimum\`**`)
                    let argument = args[0].toLowerCase()
                    if (argument != 'add' && argument != 'remove') return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    switch (argument) {
                        case 'add':
                            var type
                            var mention = message.mentions.roles.first()
                            if (mention) mention = mention.id
                            if (!mention) mention = args[1]
                            if (message.guild.roles.cache.has(mention)) type = 'role'
                            else {
                                mention = message.mentions.members.first()
                                if (mention && type != 'role') mention = mention.id
                                if (!mention && type != 'role') mention = args[1]
                                if (message.guild.members.cache.has(mention)) type = 'member'
                                else {
                                    mention = args[1]
                                    let cmd = client.commands.get(args[1])
                                    if (!cmd) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                    mention = cmd.help
                                    type = 'command'
                                    if (mention.name == 'ban' || mention.name == 'kick' || mention.name == 'unban') return message.reply("Vous ne pouvez pas modifer le niveau de permission de cette fonction.")
                                }
                            }
                            if (!type) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                            if (!args[2]) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                            let level = args[2].toLowerCase()

                            if (type != 'command') {
                                if (level != '1' && level != '2' && level != '3' && level != 'giveaway' && level != 'everyone') return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                if (level == 'giveaway') level = 'g'
                                else if (level == 'everyone') level = 'eve'
                                await database.query(`SELECT * FROM perm${level} WHERE serverid = ? AND id = ?`, [message.guild.id, mention], async (error, result) => {
                                    if (result[0]) return embed.permassigned(client, message, mention, level, lang, type, true, color.red)
                                    let val = [
                                        [message.guild.id, mention, type]
                                    ]
                                    await database.query(`INSERT INTO perm${level} (serverid, id, type) VALUES ?`, [val], async (error, result, fields) => {
                                        if (error) return message.channel.send(lang.error + error)
                                        return embed.permassigned(client, message, mention, level, lang, type, false, color.green)
                                    })
                                })
                            } else {
                                if (level != '0' && level != '1' && level != '2' && level != '3' && level != 'giveaway' && level != 'everyone' && level != 'whitelist' && level != 'owner' && level != 'wl' && level != 'buyer') return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                if (level == 'everyone') level = 'mention everyone'
                                if (level == 'wl') level = 'whitelist'
                                await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, mention.name], async (error, result) => {
                                    if (result[0].perm == 'buyer') if (config.buyer != message.author.id && config.creator != message.author.id) return message.channel.send(lang.by == 'by' ? `This command is too high, only my buyer can change it.` : `Cette commande est trop haute, seul mon acheteur peut la modifier.`)
                                    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ? AND perm = ?", [message.guild.id, mention.name, level], async (error, result) => {
                                        if (result[0]) return embed.commandassigned(client, message, mention.name, level, lang, type, true, color.red)
                                        await database.query("UPDATE commands SET perm = ? WHERE serverid = ? AND name = ?", [level, message.guild.id, mention.name])
                                        return embed.commandassigned(client, message, mention.name, level, lang, type, false, color.green)
                                    })
                                })
                            }

                            break;

                        case 'remove':
                            var type
                            var mention = message.mentions.roles.first()
                            if (mention) mention = mention.id
                            if (!mention) mention = args[1]
                            if (message.guild.roles.cache.has(mention)) type = 'role'
                            else {
                                mention = message.mentions.members.first()
                                if (mention && type != 'role') mention = mention.id
                                if (!mention && type != 'role') mention = args[1]
                                if (message.guild.members.cache.has(mention)) type = 'member'
                                else {
                                    mention = args[1]
                                    let cmd = client.commands.get(args[1])
                                    if (!cmd) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                    mention = cmd.help
                                    type = 'command'
                                }
                            }
                            if (!type) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                            if (!args[2]) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                            let level2 = args[2].toLowerCase()
                            if (level2 != '1' && level2 != '2' && level2 != '3' && level2 != 'giveaway' && level2 != 'everyone' && level2 != 'whitelist' && level2 != 'owner') return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                            if (type != 'command') {
                                if (level2 == 'giveaway') level2 = 'g'
                                else if (level2 == 'everyone') level2 = 'eve'
                                await database.query(`SELECT * FROM perm${level2} WHERE serverid = ? AND id = ?`, [message.guild.id, mention], async (error, result) => {
                                    if (!result[0]) return embed.permunassigned(client, message, mention, level2, lang, type, true, color.red)
                                    let val = [
                                        [message.guild.id, mention, type]
                                    ]
                                    await database.query(`DELETE FROM perm${level2} WHERE serverid = ${message.guild.id} AND id = ${mention}`, async (error, result, fields) => {
                                        if (error) return message.channel.send(lang.error + error)
                                        return embed.permunassigned(client, message, mention, level2, lang, type, false, color.green)
                                    })
                                })
                            } else {
                                return embed.commandremove(client, message, lang, color.orangered, prefix)
                            }

                            break;
                    }
                }

            } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

module.exports.help = {
    name: "perm",
    aliases: [`permission`, `permissions`, `perms`],
    desc: ["Permet de modifier les différentes permissions du bot", "Change the permission system of the bot"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["perm", "perm add <rôle/membre/id/nom d'une commande> <level/giveaway/everyone>", "perm remove <rôle/membre/id/nom d'une commande> <level/giveaway/everyone>"],
    type: ["Configuration", "Setup"],
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