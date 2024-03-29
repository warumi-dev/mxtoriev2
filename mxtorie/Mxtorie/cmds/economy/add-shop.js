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
const coins = require('../../coins.json')

/** 
 * @param {Discord.Client} client
 * @param {Discord.Message} message
 * @param {string[]} args
 * @param {string} prefix
 * @param {boolean[]} perm
 * @param {boolean} whitelisted
 * @param {import("mysql").Connection} database
 * @param {import("mysql").Connection} database2
 * @param {import("../../lang.json")} lang
 * @param {import("mysql").Connection} database3
*/

module.exports.run = async (client, message, args, prefix, perm, whitelisted, database, database2, lang, database3) => {
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

                    dureefiltrer = response => { return response.author.id === message.author.id };
                    const filterReaction = (reaction, user) => user.id === message.author.id && !user.bot
                    const filterMessage = (m) => m.author.id === message.author.id && !m.author.bot
                    var name
                    var desc
                    var cost
                    var roleid
                    var isCoin
                    message.channel.send('Quel est le nom de l\'item à rajouter dans la boutique ?').then(mp => {
                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                            .then(async cld => {
                                var msg = cld.first();
                                await database3.query("SELECT * FROM shop WHERE serverid = ? AND item = ?", [message.guild.id, msg.content], async (error, result) => {
                                    if (error) return message.reply("Une erreur est survenue, contacter mon créateur. " + error)
                                    if (result[0]) return message.reply("Impossible, un item du même nom existe déjà.")
                                    if (msg.content.includes(' ')) return message.channel.send("Le nom ne peut pas contenir d'espace.")
                                    name = msg.content
                                    message.channel.send('Mettez une description pour votre nouvel item, sinon marquer \`skip\` ?').then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 80000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                if (msg.content != 'skip') desc = msg.content
                                                else desc = 'Aucune description'
                                                message.channel.send('Quel est le prix de cette item ?').then(mp => {
                                                    mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                                        .then(async cld => {
                                                            var msg = cld.first();

                                                            if (!parseInt(msg.content)) {
                                                                cost = '100'
                                                                message.channel.send("Votre dernier message contenais des lettres, le prix a donc été fixé à 100. Vous pourrez le changer avec la commande \`edit-shop <nom de l'item>\`")
                                                            } else {
                                                                cost = msg.content
                                                            }
                                                            message.channel.send('Cette item doit être acheter avec des bitcoins ou des simples coins ? \`btc\` ou \`coins\`').then(mp => {
                                                                mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                                                    .then(async cld => {
                                                                        var msg = cld.first().content.toLowerCase();
                                                                        if (msg == 'btc' || msg == 'bitcoin' || msg == 'bitcoins') isCoin = '0'
                                                                        else isCoin = '1'
                                                                        message.channel.send('Quel rôle sera donner après l\'achat ? (Mentionner ou donner l\'id)').then(mp => {
                                                                            mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                                                                .then(async cld => {
                                                                                    var msg = cld.first();
                                                                                    let mention = msg.mentions.roles.first()
                                                                                    if (mention) mention = mention.id
                                                                                    if (!mention) mention = msg.content
                                                                                    if (!message.guild.roles.cache.has(mention)) mention = 'indéfini'
                                                                                    roleid = mention
                                                                                    //var val = [[message.guild.id, name, desc, cost, roleid]]
                                                                                    var val = [[message.guild.id, name, desc, cost, roleid, isCoin]]
                                                                                    await database3.query('INSERT INTO shop (serverid, item, descr, price, role, coin) VALUES ?', [val], async (error, result) => {
                                                                                        if (error) return message.reply("Une erreur est survenue, contacter mon créateur. " + error)
                                                                                        let embed2 = new Discord.MessageEmbed()
                                                                                        embed2.setTitle("Nouvel item")
                                                                                        embed2.addField("Nom", name, true)
                                                                                        embed2.addField("Prix", cost + `${isCoin == '0' ? 'BTC' : 'coins'}`, true)
                                                                                        embed2.addField("Rôle", roleid == 'indéfini' ? "indéfini" : `<@&${roleid}>`)
                                                                                        embed2.addField("Description", desc != null ? desc : 'Pas de description', false)
                                                                                        embed2.setColor(color.green)
                                                                                        embed2.setTimestamp()
                                                                                        return message.channel.send(embed2)
                                                                                    })
                                                                                }).catch(e => { return message.reply("Vous avez mis trop de temps à répondre.") })
                                                                        })
                                                                    }).catch(e => { return message.reply("Vous avez mis trop de temps à répondre.") })
                                                            })
                                                        }).catch(e => { return message.reply("Vous avez mis trop de temps à répondre.") })
                                                })
                                            })
                                    }).catch(e => { return message.reply("Vous avez mis trop de temps à répondre.") })
                                })
                            })
                    }).catch(e => { return message.reply("Vous avez mis trop de temps à répondre.") })

                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

// return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

module.exports.help = {
    name: "add-shop",
    aliases: [`addshop`, `additem`, `add-item`],
    desc: ["Ajoute un item dans la boutique", "Add an item in the shop"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["add-shop"],
    type: ["Economie", "Economy"],
    perm: "1"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, '1']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}