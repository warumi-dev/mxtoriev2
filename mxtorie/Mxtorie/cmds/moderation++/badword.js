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

                    if (!args[0] || args[0] != 'add' && args[0] != 'remove' && args[0] != 'list') return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    let sentence
                    switch (args[0]) {
                        case 'add':
                            sentence = args.splice(1).join(' ')
                            if (!sentence) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                            await database.query("SELECT * FROM badwords WHERE serverid = ? AND word = ?", [message.guild.id, sentence], async (error, result) => {
                                if (result.length > 0) return message.channel.send("Ce mot ou cette phrase est déjà interdit.")
                                let val = [[message.guild.id, sentence]]
                                await database.query("INSERT INTO badwords (serverid, word) VALUES ?", [val], async (error, result) => {
                                    if (error) return message.channel.send(lang.error + error)
                                    return message.channel.send(`\`${sentence}\` est maintenant dans la liste des mots/phrases interdit.`)
                                })
                            })
                            break;
                        case 'remove':
                            sentence = args.splice(1).join(' ')
                            if (!sentence) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                            await database.query("SELECT * FROM badwords WHERE serverid = ? AND word = ?", [message.guild.id, sentence], async (error, result) => {
                                if (result.length < 0) return message.channel.send("Ce mot ou cette phrase n'est pas interdit.")
                                let val = [[message.guild.id, sentence]]
                                await database.query("DELETE FROM badwords WHERE serverid = " + message.guild.id + " AND word = '" + sentence + "'", async (error, result) => {
                                    if (error) return message.channel.send(lang.error + error)
                                    return message.channel.send(`\`${sentence}\` n'est plus dans la liste des mots/phrases interdit.`)
                                })
                            })
                            break;
                        case 'list':
                            await database.query("SELECT * FROM badwords WHERE serverid = ?", message.guild.id, async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                let embed2 = new Discord.MessageEmbed()
                                embed2.setAuthor("Mot(s)/Phrase(s) interdit", message.guild.iconURL({ dynamic: true }))
                                if (result.length < 1) {
                                    embed2.setDescription("Ce serveur n'a aucun mot/phrase interdit.")
                                    embed2.setColor('RED')
                                } else {
                                    embed2.setDescription(result.map(i => `**${i.word}**`))
                                    embed2.setColor('RANDOM')
                                }
                                embed2.setFooter("Mxtorie", 'https://cdn.discordapp.com/attachments/856863306605920267/859431033044336670/Sans_titre-1.png')
                                return message.channel.send(embed2)
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
    name: "badword",
    aliases: [`badsentence`, `badwords`],
    desc: ["Permet d'interdire des mots, cela est bypassable à partir de la whitelist", "description en"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["badword add <mot/phrase>", "badword remove <mot/phrase>", "badword list"],
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