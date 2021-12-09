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
const malScraper = require('mal-scraper');
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

                    const search = `${args}`;
                    if (!search)
                        return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    malScraper.getInfoFromName(search)
                        .then((data) => {
                            const malEmbed = new Discord.MessageEmbed()
                            if (lang.by == 'by') {
                                malEmbed.setAuthor(`Result for [ ${args} ]`.split(',').join(' '))
                                malEmbed.setThumbnail(data.picture)
                                malEmbed.setColor(color.gold) //What ever u want color!
                                malEmbed.addField('Premiered', `\`${data.premiered}\``, true)
                                malEmbed.addField('Broadcast', `\`${data.broadcast}\``, true)
                                malEmbed.addField('Genres', `\`${data.genres}\``, true)
                                malEmbed.addField('English Title', `\`${data.englishTitle}\``, true)
                                malEmbed.addField('Japanese Title', `\`${data.japaneseTitle}\``, true)
                                malEmbed.addField('Type', `\`${data.type}\``, true)
                                malEmbed.addField('Episodes', `\`${data.episodes}\``, true)
                                malEmbed.addField('Rating', `\`${data.rating}\``, true)
                                malEmbed.addField('Aired', `\`${data.aired}\``, true)
                                malEmbed.addField('Score', `\`${data.score}\``, true)
                                malEmbed.addField('Favorite', `\`${data.favorites}\``, true)
                                malEmbed.addField('Ranked', `\`${data.ranked}\``, true)
                                malEmbed.addField('Duration', `\`${data.duration}\``, true)
                                malEmbed.addField('Studios', `\`${data.studios}\``, true)
                                malEmbed.addField('Popularity', `\`${data.popularity}\``, true)
                                malEmbed.addField('Members', `\`${data.members}\``, true)
                                malEmbed.addField('Score Stats', `\`${data.scoreStats}\``, true)
                                malEmbed.addField('Source', `\`${data.source}\``, true)
                                malEmbed.addField('Synonyms', `\`${data.synonyms}\``, true)
                                malEmbed.addField('Status', `\`${data.status}\``, true)
                                malEmbed.addField('Identifier', `\`${data.id}\``, true)
                            } else {
                                malEmbed.setAuthor(`Résultat pour [ ${args} ]`.split(',').join(' '))
                                malEmbed.setThumbnail(data.picture)
                                malEmbed.setColor(color.gold) //What ever u want color!
                                malEmbed.addField('Première', `\`${data.premiered}\``, true)
                                malEmbed.addField('Diffusion', `\`${data.broadcast}\``, true)
                                malEmbed.addField('Genres', `\`${data.genres}\``, true)
                                malEmbed.addField('Titre anglais', `\`${data.englishTitle}\``, true)
                                malEmbed.addField('Titre japonais', `\`${data.japaneseTitle}\``, true)
                                malEmbed.addField('Type', `\`${data.type}\``, true)
                                malEmbed.addField('Épisodes', `\`${data.episodes}\``, true)
                                malEmbed.addField('Notation', `\`${data.rating}\``, true)
                                malEmbed.addField('Diffusé', `\`${data.aired}\``, true)
                                malEmbed.addField('Score', `\`${data.score}\``, true)
                                malEmbed.addField('Favorite', `\`${data.favorites}\``, true)
                                malEmbed.addField('Classé', `\`${data.ranked}\``, true)
                                malEmbed.addField('Durée', `\`${data.duration}\``, true)
                                malEmbed.addField('Studio', `\`${data.studios}\``, true)
                                malEmbed.addField('Popularité', `\`${data.popularity}\``, true)
                                malEmbed.addField('Membres', `\`${data.members}\``, true)
                                malEmbed.addField('Statistiques de score', `\`${data.scoreStats}\``, true)
                                malEmbed.addField('Source', `\`${data.source}\``, true)
                                malEmbed.addField('Synonymes', `\`${data.synonyms}\``, true)
                                malEmbed.addField('Statut', `\`${data.status}\``, true)
                                malEmbed.addField('Identifiant', `\`${data.id}\``, true)
                            }
                            //.addField('Link', data.url, true)
                            malEmbed.setTimestamp()
                            malEmbed.setFooter(`${client.user.username}`, message.author.displayAvatarURL({ dynamic: true }))

                            message.channel.send(malEmbed);

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
    name: "anime",
    aliases: [`anim`],
    desc: ["Obtiens des informations sur un animé", "Show some informations on a anime"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["anime <nom d'un animé>"],
    type: ["Fun", "Fun"],
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