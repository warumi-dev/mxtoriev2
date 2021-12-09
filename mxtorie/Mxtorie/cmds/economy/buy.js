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
const { isBuffer } = require("util")

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

                    let name = args[0]
                    if (!name) return message.channel.send("Le nom est invalide.")
                    if (name.toLowerCase() != 'printer') {
                        await database3.query("SELECT * FROM shop WHERE serverid = ? AND item = ?", [message.guild.id, name], async (error, result) => {
                            if (error) return message.channel.send(lang.error + error)
                            if (!result || result.length < 1) return message.channel.send(`L'item **\`${name}\`** n'existe pas.`)
                            let i_price = parseInt(result[0].price)
                            let rolegiven = result[0].role
                            if (result[0].coin == '1') {
                                database3.query("SELECT * FROM coins WHERE userid = ? AND serverid = ?", [message.author.id, message.guild.id], async function (err, rows) {
                                    let userFixedCoins = parseInt(rows[0].usercoins)
                                    if ((userFixedCoins - i_price) < 0) return message.channel.send(`Vous n'avez pas assez de coins pour acheter cette item.\nVous avez : **\`${userFixedCoins}coins\`**\nL'item coûte : **\`${i_price}coins\`**`)
                                    await database3.query("UPDATE coins SET usercoins = ? WHERE serverid = ? AND userid = ?", [(userFixedCoins - i_price), message.guild.id, message.author.id], async (error, result) => {
                                        if (error) return message.channel.send(lang.error + error)
                                        if (!message.guild.roles.cache.has(rolegiven)) return message.channel.send(`Vous avez acheté l'item **\`${name}\`, cependant le rôle que je suis sensé vous donnez est invalide.`)
                                        message.member.roles.add(rolegiven).catch(e => { message.channel.send("Je n'ai pas pu vous donnez le rôle pour la raison suivante : " + e) })
                                        return message.channel.send("Vous avez bien acheté l'item **\`" + name + "\`** !")
                                    })
                                })
                            } else {
                                database3.query("SELECT * FROM bitcoin WHERE userid = ? AND serverid = ?", [message.author.id, message.guild.id], async function (err, rows) {
                                    if(rows.length < 1) return message.channel.send("Vous n'avez même pas de mine à bitcoin.")
                                    let userFixedMoney = parseInt(rows[0].money)
                                    if ((userFixedMoney - i_price) < 0) return message.channel.send(`Vous n'avez pas assez de BTC pour acheter cette item.\nVous avez : **\`${userFixedMoney}BTC\`**\nL'item coûte : **\`${i_price}BTC\`**`)
                                    await database3.query("UPDATE bitcoin SET money = ? WHERE serverid = ? AND userid = ?", [(userFixedMoney - i_price), message.guild.id, message.author.id], async (error, result) => {
                                        if (error) return message.channel.send(lang.error + error)
                                        if (!message.guild.roles.cache.has(rolegiven)) return message.channel.send(`Vous avez acheté l'item **\`${name}\`, cependant le rôle que je suis sensé vous donnez est invalide.`)
                                        message.member.roles.add(rolegiven).catch(e => { message.channel.send("Je n'ai pas pu vous donnez le rôle pour la raison suivante : " + e) })
                                        return message.channel.send("Vous avez bien acheté l'item **\`" + name + "\`** !")
                                    })
                                })
                            }
                        })
                    } else {
                        await database3.query("SELECT * FROM bitcoin WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async (error, result, fields) => {
                            if (error) return message.reply(error)
                            if (result[0]) {
                                return message.reply("Vous possédez déjà une Mine à bitcoin.")
                            } else {
                                await database3.query("SELECT * FROM shop WHERE serverid = ? AND item = ?", [message.guild.id, 'printer'], async (error, result) => {
                                    if (error) return message.channel.send(lang.error + error)
                                    let currentprice = parseInt(result[0].price)
                                    await database3.query("SELECT * FROM coins WHERE userid = ? AND serverid = ?", [message.author.id, message.guild.id], async function (err, rows) {
                                        let userFixedCoins = parseInt(rows[0].usercoins)
                                        let newcoin = userFixedCoins - currentprice
                                        if (newcoin < 0) return message.reply("Vous n'avez pas assez de coins.")
                                        await database3.query("UPDATE coins SET usercoins = " + newcoin + " WHERE serverid = " + message.guild.id + " AND userid = " + message.author.id, async (error, result, fields) => {
                                            if (error) return message.reply(error)
                                            if (result < 1) return console.log('Bitcoin shop user insert error.')
                                            CreateBit(message.guild.id, message.author.id, database3)
                                            client.emit('buyPrinter', message.guild, message.member)
                                            return message.channel.send("Vous avez bien acheté l'item **\`printer\`** !")
                                        })
                                    })
                                })
                            }
                        })
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
    name: "buy",
    aliases: [`achete`],
    desc: ["Acheter un item de la boutique", "Show 10 first people in the economy leaderboard"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["buy <nom de l'item>"],
    type: ["Economie", "Economy"],
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

async function CreateBit(serverid, author, database) {
    var val = [[serverid, author]]
    await database.query("INSERT INTO bitcoin (serverid, userid) VALUES ?", [val], async (error, result, fields) => {
        if (error) return console.log(error)
        if (result.length < 1) return console.log('Create bitcoin in the database error.')
    })
}