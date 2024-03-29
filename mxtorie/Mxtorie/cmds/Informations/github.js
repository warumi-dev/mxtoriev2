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
const fetch = require('node-fetch')
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

                    if (!args[0]) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    fetch(`https://api.github.com/users/${args.join('-')}`)
                        .then(res => res.json()).then(body => {
                            if (body.message) return message.channel.send(lang.by == 'by' ? `User not found | Please give me a valid username !` : `Utilisateur inconnu | Merci de me donner un nom d'utilisateur valide !`);
                            let { login, avatar_url, name, id, html_url, public_repos, followers, following, location, created_at, bio } = body;

                            const embed2 = new Discord.MessageEmbed()
                            if (lang.by == 'by') {
                                embed2.setAuthor(`${login} Informations !`, avatar_url)
                                embed2.setColor(color.cyan)
                                embed2.setThumbnail(`${avatar_url}`)
                                embed2.addField(`Username`, `${login}`)
                                embed2.addField(`ID`, `${id}`)
                                embed2.addField(`Bio`, `${bio || "No Bio"}`)
                                embed2.addField(`Public Repositories`, `${public_repos || "None"}`, true)
                                embed2.addField(`Followers`, `${followers}`, true)
                                embed2.addField(`Following`, `${following}`, true)
                                embed2.addField(`Location`, `${location || "No Location"}`)
                                embed2.addField(`Account Created`, moment.utc(created_at).format("dddd, MMMM, Do YYYY"))
                            } else {
                                embed2.setAuthor(`${login} Informations !`, avatar_url)
                                embed2.setColor(color.cyan)
                                embed2.setThumbnail(`${avatar_url}`)
                                embed2.addField(`Pseudo`, `${login}`)
                                embed2.addField(`ID`, `${id}`)
                                embed2.addField(`Bio`, `${bio || "No Bio"}`)
                                embed2.addField(`Répertoires publique`, `${public_repos || "Aucun"}`, true)
                                embed2.addField(`Abonnés`, `${followers}`, true)
                                embed2.addField(`Abonnés à`, `${following}`, true)
                                embed2.addField(`Location`, `${location || "Pas de location"}`)
                                embed2.addField(`Date de création`, moment.utc(created_at).format("dddd, MMMM, YYYY"))
                            }
                            embed2.setFooter(`${message.author.username}`)
                            embed2.setTimestamp()

                            return message.channel.send(embed2)

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
    name: "github",
    aliases: [`git`],
    desc: ["Obtiens des informations sur un compte github", "Get some informations on a github account"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["github <nom d'un compte>"],
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