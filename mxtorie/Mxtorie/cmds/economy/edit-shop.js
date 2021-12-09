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

                    var arg = ["name", "desc", "price", "type", "role"]

                    let name = args[0]
                    if (!name) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    if (!args[1]) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    let val = args[1].toLowerCase()
                    if (!arg.includes(val)) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

                    switch (val) {
                        case 'name':
                            if(name == 'printer') return message.channel.send("Vous ne pouvez pas modifier le nom du printer.")
                            await database3.query("SELECT * FROM shop WHERE serverid = ? AND item = ?", [message.guild.id, name], async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                if (result.length < 1) return message.channel.send(`L'item **\`${name}\`** n'existe pas.`)
                                if (!args[2]) return message.channel.send("Le nouveau nom est invalide.")
                                await database3.query("SELECT * FROM shop WHERE serverid = ? AND item = ?", [message.guild.id, args[2]], async (error, result) => {
                                    if (error) return message.channel.send(lang.error + error)
                                    if (result.length > 0) return message.channel.send(`L'item **\`${args[2]}\`** existe déjà.`)
                                    database3.query("UPDATE shop SET item = ? WHERE serverid = ? AND item = ?", [args[2], message.guild.id, name], async (error, result) => {
                                        if (error) return message.channel.send(lang.error + error)
                                        return message.channel.send(`L'item **\`${name}\`** a bien été renomé en **\`${args[2]}\`**.`)
                                    })
                                })
                            })
                            break;
                        case 'desc':
                            await database3.query("SELECT * FROM shop WHERE serverid = ? AND item = ?", [message.guild.id, name], async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                if (result.length < 1) return message.channel.send(`L'item **\`${name}\`** n'existe pas.`)
                                let currentdesc = result[0].descr
                                let newdesc = args.splice(2).join(' ')
                                if (!newdesc) return message.channel.send("La nouvelle description est invalide.")
                                database3.query("UPDATE shop SET descr = ? WHERE serverid = ? AND item = ?", [newdesc, message.guild.id, name], async (error, result) => {
                                    if (error) return message.channel.send(lang.error + error)
                                    return message.channel.send(`La description de l'item **\`${name}\`** a bien été changé.\nAncienne : **\`${currentdesc}\`**\nNouvelle : **\`${newdesc}\`**`)
                                })
                            })
                            break;
                        case 'price':
                            await database3.query("SELECT * FROM shop WHERE serverid = ? AND item = ?", [message.guild.id, name], async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                if (result.length < 1) return message.channel.send(`L'item **\`${name}\`** n'existe pas.`)
                                let currentprice = result[0].price
                                let newprice = args[2]
                                if(!newprice || isNaN(newprice)) return message.channel.send("Le nouveau prix est invalide.")
                                database3.query("UPDATE shop SET price = ? WHERE serverid = ? AND item = ?", [newprice, message.guild.id, name], async (error, result) => {
                                    if (error) return message.channel.send(lang.error + error)
                                    return message.channel.send(`Le prix de l'item **\`${name}\`** est bien passé de **\`${currentprice}\`** à **\`${newprice}\`**.`)
                                })
                            })
                        break;
                        case 'type':
                            if(name=='printer') return message.channel.send(`Le type de payement du printer ne peut pas être changer.`)
                            await database3.query("SELECT * FROM shop WHERE serverid = ? AND item = ?", [message.guild.id, name], async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                if (result.length < 1) return message.channel.send(`L'item **\`${name}\`** n'existe pas.`)
                                let newtype = args[2].toLowerCase()
                                if(!newtype || newtype!='btc'&&newtype!='coin') return message.channel.send(`Le type doit être **\`btc\`** ou \`coin\`.`)
                                let currenttype = result[0].coin
                                database3.query("UPDATE shop SET coin = ? WHERE serverid = ? AND item = ?", [newtype=='btc'?'0':'1', message.guild.id, name], async (error, result) => {
                                    if (error) return message.channel.send(lang.error + error)
                                    return message.channel.send(`Le type de payement de l'item **\`${name}\`** est bien passé de **\`${currenttype}\`** à **\`${newtype}\`**.`)
                                })
                            })
                        break;
                        case 'role':
                            await database3.query("SELECT * FROM shop WHERE serverid = ? AND item = ?", [message.guild.id, name], async (error, result) => {
                                if (error) return message.channel.send(lang.error + error)
                                if (result.length < 1) return message.channel.send(`L'item **\`${name}\`** n'existe pas.`)
                                let newrole = message.mentions.roles.first()
                                if(newrole) newrole = newrole.id
                                if(!newrole) newrole = args[2]
                                if(!newrole || isNaN(newrole) || newrole.length!=18) return message.channel.send("Le nouveau rôle n'est pas valide.")
                                database3.query("UPDATE shop SET role = ? WHERE serverid = ? AND item = ?", [newrole, message.guild.id, name], async (error, result) => {
                                    if (error) return message.channel.send(lang.error + error)
                                    let mention = message.guild.roles.cache.get(newrole)
                                    return message.channel.send(`Le rôle donner après l'achat de l'item **\`${name}\`** sera **\`${mention.name} (${mention.id})\`**.`)
                                })
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
    name: "edit-shop",
    aliases: [`editshop`, `edititem`, `edit-item`],
    desc: ["Modifie un item de la boutique", "Edit an item from the shop"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["edit-shop <nom de l'item> name <nouveau nom>", "edit-shop <nom de l'item> desc <nouvelle description>", "edit-shop <nom de l'item> price <nouveau prix>", "edit-shop <nom de l'item> type <btc/coins>", "edit-shop <nom de l'item> role <mention/id>"],
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