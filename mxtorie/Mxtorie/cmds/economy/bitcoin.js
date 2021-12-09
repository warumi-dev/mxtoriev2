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
let a
let go = false
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



                    let go = false
                    const author = message.author.id
                    a = await message.channel.send('Veuillez patienté...')
                    await UpdateEmbed(message, database3, author, prefix).then(async () => {
                        if (!a) return
                        await database3.query("SELECT * FROM bitcoin WHERE serverid = ? AND userid = ?", [message.guild.id, author], async (error, result, fields) => {
                            if (error) return message.reply(error)
                            if (!result[0]) return
                            a.react("🖥️")
                            a.react("📟")
                            a.react("⚡")
                            a.react("💰")
                            a.react("❌")


                            await Promise.all(['🖥️', '📟', '⚡', '💰', '❌'].map(r => a.react(r)))
                            dureefiltrer = response => { return response.author.id === message.author.id };
                            const filterReaction = (reaction, user) => user.id === message.author.id && !user.bot
                            const filterMessage = (m) => m.author.id === message.author.id && !m.author.bot
                            const collectorReaction = await new Discord.ReactionCollector(a, filterReaction)
                            collectorReaction.on('collect', async reaction => {

                                switch (reaction.emoji.name) {
                                    case '🖥️':
                                        reaction.users.remove(author);
                                        await database3.query("SELECT * FROM bitcoin WHERE serverid = ? AND userid = ?", [message.guild.id, author], async (error, result, fields) => {
                                            if (error) return message.reply(error)
                                            var proc = result[0].processid
                                            var allproc = ["CPU Intel Pentium G620", "Processeur Intel Core i3-3220F", "Intel Core i5 4440F"]
                                            var allprocid = [2, 3, 4]
                                            var procprice = [250, 500, 1000]
                                            message.channel.send('Quel processeur voulez-vous acheté ? \n**2** : ```Processeur CPU Intel Pentium G620``` (250€)\n**3** : ```Processeur Intel Core i3-3220F``` (500€)\n**4** : ```Intel Core i5 4440F``` (1000€)').then(mp => {
                                                mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                                    .then(async cld => {
                                                        var msg = cld.first();
                                                        var msgc = msg.content
                                                        if (isNaN(msgc)) return message.reply("Cette id de processeur est invalide.")
                                                        var select = parseInt(msgc)
                                                        if (select != 2 && select != 3 && select != 4) return message.reply("Cette id de processeur est invalide.")
                                                        await database3.query("SELECT * FROM coins WHERE serverid = ? AND userid = ?", [message.guild.id, author], async (error, result) => {
                                                            if (error) return console.log(error)
                                                            var coins = result[0].usercoins
                                                            if (coins < procprice[select - 2]) return message.reply("Vous n'avez pas assez de coin pour prendre ce processeur.")
                                                            await database3.query("SELECT * FROM bitcoin WHERE serverid = ? AND userid = ?", [message.guild.id, author], async (error, result) => {
                                                                if (error) return console.log(error)

                                                                if (result[0].processid == select) return message.reply("Vous possédez déjà ce processeur.")
                                                                await database3.query("UPDATE bitcoin SET process = ? , processid = ? WHERE serverid = ? AND userid = ?", [allproc[select - 2], allprocid[select - 2], message.guild.id, author], async (error, result) => {
                                                                    if (error) return console.log(error)
                                                                    var price = coins - procprice[select - 2]
                                                                    await database3.query("UPDATE coins SET usercoins = ? WHERE serverid = ? AND userid = ?", [price, message.guild.id, author], async (error, result) => {
                                                                        if (error) return console.log(error)
                                                                        message.reply("Vous venez d'acheté le processeur : " + allproc[select - 2])
                                                                        return UpdateEmbed(message, database3, author, prefix)
                                                                    })
                                                                })
                                                            })
                                                        })

                                                    }).catch(e => { return message.reply("Le temps est écoulé.") })
                                            })
                                        })


                                        break;
                                    case '📟':
                                        reaction.users.remove(author);
                                        await database3.query("SELECT * FROM bitcoin WHERE serverid = ? AND userid = ?", [message.guild.id, author], async (error, result, fields) => {
                                            if (error) return message.reply(error)
                                            var proc = result[0].cgid
                                            var allproc = ["GeForce FX 6200 256MB", "ASUS nVidia GeForce GT 430", "evga gtx 570"]
                                            var allprocid = [2, 3, 4]
                                            var procprice = [250, 500, 1000]
                                            message.channel.send('Quel processeur voulez-vous acheté ? \n**2** : ```GeForce FX 6200 256MB``` (250€)\n**3** : ```ASUS nVidia GeForce GT 430F``` (500€)\n**4** : ```evga gtx 570F``` (1000€)').then(mp => {
                                                mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                                    .then(async cld => {
                                                        var msg = cld.first();
                                                        var msgc = msg.content
                                                        if (isNaN(msgc)) return message.reply("Cette id de carte graphique est invalide.")
                                                        var select = parseInt(msgc)
                                                        if (select != 2 && select != 3 && select != 4) return message.reply("Cette id de carte graphique est invalide.")
                                                        await database3.query("SELECT * FROM coins WHERE serverid = ? AND userid = ?", [message.guild.id, author], async (error, result) => {
                                                            if (error) return console.log(error)
                                                            var coins = result[0].usercoins
                                                            if (coins < procprice[select - 2]) return message.reply("Vous n'avez pas assez de coin pour prendre cette carte graphique.")
                                                            await database3.query("SELECT * FROM bitcoin WHERE serverid = ? AND userid = ?", [message.guild.id, author], async (error, result) => {
                                                                if (error) return console.log(error)

                                                                if (result[0].cgid == select) return message.reply("Vous possédez déjà cette carte graphique.")
                                                                await database3.query("UPDATE bitcoin SET cg = ? , cgid = ? WHERE serverid = ? AND userid = ?", [allproc[select - 2], allprocid[select - 2], message.guild.id, author], async (error, result) => {
                                                                    if (error) return console.log(error)
                                                                    var price = coins - procprice[select - 2]
                                                                    await database3.query("UPDATE coins SET usercoins = ? WHERE serverid = ? AND userid = ?", [price, message.guild.id, author], async (error, result) => {
                                                                        if (error) return console.log(error)
                                                                        message.reply("Vous venez d'acheté la carte graphique : " + allproc[select - 2])
                                                                        return UpdateEmbed(message, database3, author, prefix)
                                                                    })
                                                                })
                                                            })
                                                        })
                                                    }).catch(e => { return message.reply("Le temps est écoulé.") })
                                            })
                                        })

                                        break;
                                    case '⚡':
                                        reaction.users.remove(author);

                                        database3.query("SELECT * FROM coins WHERE userid = ? AND serverid = ?", [author, message.guild.id], async function (err, rows) {
                                            let userFixedCoins = parseFloat(rows[0].usercoins).toFixed(2)
                                            await database3.query("SELECT * FROM bitcoin WHERE serverid = ? AND userid = ?", [message.guild.id, author], async (error, result, fields) => {
                                                if (error) return message.reply(error)
                                                if (result.length < 1) {
                                                    CreateBit(message.guild.id, author, database3)
                                                } else {
                                                    if (result[0].volt == 20) return message.reply('Vos volts sont déjà au maximum.')
                                                    let newcoin = userFixedCoins - 350
                                                    if (newcoin < 0) return message.reply("Vous n'avez pas assez de coin pour effectuer cette transaction.")
                                                    await database3.query("UPDATE bitcoin SET volt = 20 WHERE serverid = " + message.guild.id + " AND userid = " + author, async (error, result, fields) => {
                                                        if (error) return message.reply(error)
                                                        if (result.length < 1) return message.reply('Une erreur est survenue ré-essayé plus-tard.')
                                                    })
                                                    await database3.query("UPDATE coins SET usercoins = " + newcoin + " WHERE serverid = " + message.guild.id + " AND userid = " + author, async (error, result, fields) => {
                                                        if (error) return message.reply(error)
                                                        if (result.length < 1) return message.reply('Une erreur est survenue ré-essayé plus-tard.')
                                                    })
                                                    message.reply("L'achat a bien été effectué.")
                                                    UpdateEmbed(message, database3, author, prefix)
                                                }
                                            })
                                        })
                                        break;

                                    case '💰':
                                        reaction.users.remove(author);
										database3.query("SELECT * FROM bitcoin WHERE serverid = ? AND userid = ?", [message.guild.id, author], async(error, result) => {
                if(error) return message.channel.send(lang.error+error)
                if(parseInt(result[0].money)<1) return message.channel.send("Vous n'avez pas de BTC.")
                let currentm = parseInt(result[0].money)
                database3.query("SELECT * FROM coins WHERE serverid = ? AND userid = ?", [message.guild.id, author], async(error, result) => {
                    if(error) return message.channel.send(lang.error+error)
                await database3.query("UPDATE coins SET usercoins = ? WHERE serverid = ? AND userid = ?", [currentm+parseInt(result[0].usercoins), message.guild.id, author], async(error, result) => {
                    if(error) return message.channel.send(lang.error+error)
                    await database3.query("UPDATE bitcoin SET money = ? WHERE serverid = ? AND userid = ?", [0, message.guild.id, author], async(error, result) => {
                        if(error) return message.channel.send(lang.error+error)
                        message.channel.send("La conversion a bien été effectué.")
                        UpdateEmbed(message, database3, author, prefix)
                    })
                })
                })
            })  
                                        break;

                                    case '❌':
                                        try {
                                            message.delete().catch(e => { return })

                                            a.delete().catch(e => { return })
                                        } catch (err) { return console.log(err) }

                                        break;
                                }
                            })
                        })
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
    name: "bitcoin",
    aliases: [`bitcoins`, `btc`],
    desc: ["Permet de gérer sa mine à bitcoin", "Manage your bitcoin"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["bitcoin"],
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

async function UpdateEmbed(message, database, author, prefix) {
    var process
    var cg
    var money
    await database.query("SELECT * FROM bitcoin WHERE serverid = ? AND userid = ?", [message.guild.id, author], async (error, result, fields) => {
        if (error) return message.reply(error)
        if (!result[0]) {
            go = false
            return a.edit("Vous n'avez pas acheté de printer ! \`" + prefix + "shop\`")

        } else {
            go = true
            var proc = result[0].process
            var cg = result[0].cg
            var money = result[0].money
            var volt = result[0].volt
        }
        let embed2 = new Discord.MessageEmbed()
        embed2.setTitle(`Mine à bitcoin de ${message.member.user.username}#${message.member.user.discriminator}`)
        embed2.setDescription(`💰 **Argent actuelle :** \`${money}BTC\`\n🖥️ **Processeur :** \`${proc}\`\n📟 **Carte Graphique** \`${cg}\`\n⚡ **Volt** \`${volt}/20\`\n\n----------------\n\n 🖥️ : Améliorer le processeur\n 📟 : Améliorer la carte graphique\n ⚡ : Charger les volt (350)\n 💰 : Convertir les BTC en coins`)
        embed2.setThumbnail("https://www.labeilledecompagnie.fr/wp-content/uploads/2021/02/bitcoin-btc-logo.png", { size: 512 })
        embed2.setColor(color.yellow)
        embed2.setFooter("Si les réactions ne font rien, retiré la simplement et interagissez à nouveau avec.")
        await a.edit(embed2)
        return a
    })
}