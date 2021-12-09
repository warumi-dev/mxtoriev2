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
                    if (!args[0] || args[0] != "enable" && args[0] != "disable" && args[0] != "list") return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
        let embed = new Discord.MessageEmbed()
        switch (args[0]) {
            case 'enable':
                await database.query("SELECT * FROM spamchan WHERE serverid = ? AND channel = ?", [message.guild.id, message.channel.id], async function (error, result, fields) {
                    if (error) return message.reply(lang.error+error)
                    if (result.length != 0) return message.reply(lang.by == "by" ? 'The spam is already allowed in this channel.' : 'Le spam est déjà autorisé dans ce salon.')
                    var val = [[message.guild.id, message.channel.id]]
                    await database.query("INSERT INTO spamchan (serverid, channel) VALUES ?", [val], async function (error, result, fields) {
                        if (error || result < 1) return message.reply(lang.undefinederror)
                        message.channel.send(lang.by == 'by' ? 'The spam is now allowed in this channel.' : 'Le spam est maintenant autorisé dans ce salon.')
                        logs.sanctions(client, message, database, 'Spam', lang.spamallowed, message.guild.name, false, color.orangered, lang, message.author, 'channel', false, message.channel.id)
                    })
                })
                break;
            case 'disable':
                await database.query("SELECT * FROM spamchan WHERE serverid = ? AND channel = ?", [message.guild.id, message.channel.id], async function (error, result, fields) {
                    if (error) return message.reply(lang.error+error)
                    if (result < 1) return message.reply(lang.by == "by" ? 'The spam is already not allow in this channel.' : 'Le spam est déjà non-autorisé dans ce salon.')
                    var val = [[message.guild.id, message.channel.id]]
                    await database.query("DELETE FROM spamchan WHERE serverid = " + message.guild.id + " AND channel = " + message.channel.id, async function (error, result, fields) {
                        if (error || result < 1) return message.reply(lang.undefinederror)
                        message.channel.send(lang.by == 'by' ? 'The spam is now not allowed in this channel.' : 'Le spam est maintenant interdit dans ce salon.')
                        logs.sanctions(client, message, database, 'Spam', lang.spamnotallowed, message.guild.name, false, color.palegreen, lang, message.author, 'channel', false, message.channel.id)
                    })
                })
                break;
            case 'list':
                await database.query("SELECT * FROM spamchan WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
                    if (result < 1) {
                        embed.setTitle(lang.by == 'by' ? "__Spam channel__" : "__Salon de spam__")
                        embed.setDescription(lang.by == 'by' ? 'The anti-spam is enable in all channels.' : 'L\'anti-spam est activé dans tout les salons.')
                        embed.setColor(color.gold)
                        embed.setFooter(message.guild.name)
                        embed.setTimestamp()
                        message.channel.send(embed)
                    } else {
                        let desc = result.map((i, n) => `${n + 1} - <#${i.channel}>`)
                        embed.setTitle(lang.by == 'by' ? "__Spam channel__" : "__Salon de spam__")
                        embed.setDescription(desc)
                        embed.setColor(color.red)
                        embed.setFooter(message.guild.name)
                        embed.setTimestamp()
                        message.channel.send(embed)
                    }
                })
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
    name: "spam",
    aliases: [`spamchannel`],
    desc: ["Autorise le spam dans le salon", "Allow the spam in the channel"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_CHANNELS"],
    usage: ["spam list", "spam enable", "spam disable"],
    type: ["Modération ++", "Moderation ++"],
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