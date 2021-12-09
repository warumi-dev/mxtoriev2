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



                    filter = (reaction, user) => ['🕙', '🏷️', '🕵️', '🎁', '✅'].includes(reaction.emoji.name) && user.id === message.author.id,
                        dureefiltrer = response => { return response.author.id === message.author.id };
                    if (args[0] == 'create') {
                        var pref
                        var name
                        var exact
                        var answer


                        message.channel.send(`\`${getNow().time}\` 🕵️ Votre commande doit être utilisé avec le prefix ? \`oui\` ou \`non\``).then(mp => {
                            mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                .then(async cld => {
                                    var msg = cld.first();
                                    if (msg.content.toLowerCase() == 'oui') pref = 'yes'
                                    else pref = 'no'
                                    message.channel.send(`\`${getNow().time}\` 🕵️ Quel sera le nom de votre commande ?`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                name = msg.content
                                                message.channel.send(`\`${getNow().time}\` 🕵️ Pour être executer la commande doit être inclus dans le message, ou le message doit être parfaitement égal au nom ? \`inclus\` ou \`égal\``).then(mp => {
                                                    mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                                        .then(async cld => {
                                                            var msg = cld.first();
                                                            if (msg.content.toLowerCase() == 'inclus') exact = 'no'
                                                            else exact = 'yes'
                                                            message.channel.send(`\`${getNow().time}\` 🕵️ Quel sera la réponse à votre commande ?`).then(mp => {
                                                                mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 60000, errors: ['time'] })
                                                                    .then(async cld => {
                                                                        var msg = cld.first();
                                                                        answer = msg.content
                                                                        message.channel.send(`\`${getNow().time}\` 🕵️ Prefix : ${pref}\nNom : ${name}\nDoit être exact : ${exact}\nRéponse : ${answer}\n\n**Si tout est bon, envoyez \`valider\`**`).then(mp => {
                                                                            mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                                                                .then(async cld => {
                                                                                    var msg = cld.first();
                                                                                    if (msg.content.toLowerCase() == 'valider') {
                                                                                        var val = [
                                                                                            [message.guild.id, pref, name, exact, answer]
                                                                                        ]
                                                                                        await database.query("INSERT INTO customcmds (serverid, prefix, name, exact, answer) VALUES ?", [val])
                                                                                        return message.channel.send("La commande a bien été créé !")
                                                                                    } else {
                                                                                        return message.channel.send("La commande a bien été annuler.")
                                                                                    }
                                                                                }).catch(e => { return message.reply('Temps écoulée.') })
                                                                        })
                                                                    }).catch(e => { return message.reply('Temps écoulée.') })
                                                            })
                                                        }).catch(e => { return message.reply('Temps écoulée.') })
                                                })
                                            }).catch(e => { return message.reply('Temps écoulée.') })
                                    })
                                }).catch(e => { return message.reply('Temps écoulée.') })
                        })
                    } else if (args[0] == 'delete') {
                        message.channel.send(`\`${getNow().time}\` 🕵️ Quel est le nom de la commande à supprimée ?`).then(mp => {
                            mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                .then(async cld => {
                                    var msg = cld.first();
                                    await database.query("SELECT * FROM customcmds WHERE serverid = ? AND name = ?", [message.guild.id, msg.content], async (error, result) => {
                                        if (error) return message.channel.send("Une erreur est survenue, contacter mon créateur. " + error)
                                        if (!result[0]) return message.channel.send("Cette commande n'existe pas.")
                                        await database.query("DELETE FROM customcmds WHERE serverid = " + message.guild.id + " AND name = '" + msg.content + "'", async (error, result) => {
                                            if (error) return message.channel.send("Une erreur est survenue, contacter mon créateur. " + error)
                                            return message.channel.send("La commande a bien été supprimée.")
                                        })
                                    })
                                }).catch(e => { return message.reply('Temps écoulée.') })
                        })
                    } else if (args[0] == 'list') {
                        await database.query("SELECT * FROM customcmds WHERE serverid = ?", message.guild.id, async (error, result) => {
                            if (error) return message.channel.send("Une erreur est survenue, contacter mon créateur. " + error)
                            let embed2 = new Discord.MessageEmbed()
                            embed2.setTitle("Liste des commandes " + message.guild.name)
                            if (result.length < 1) {
                                embed2.setDescription("Il n'existe aucune commande custom sur ce serveur.")
                            } else {
                                result.map((i, n) => {
                                    embed2.addField("Commande n°" + (n + 1), `Besoin du prefix : ${i.prefix}\nNom : ${i.name}\nDoit être exact : ${i.exact}\nRéponse : ${i.answer}`, false)
                                })
                            }
                            embed2.setColor(color.magenta)
                            embed2.setTimestamp()
                            return message.channel.send(embed2)
                        })
                    } else return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)



                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

// return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

module.exports.help = {
    name: "custom-cmd",
    aliases: [`cc`, `c-cmd`],
    desc: ["Créé des commandes personnaliser", "Create custom commands"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["custom-cmd create", "custom-cmd delete", "custom-cmd list"],
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