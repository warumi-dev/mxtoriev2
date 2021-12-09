const Discord = require("discord.js")
const config = require("../../config.json")
const data = require("../../database.json")
const color = require("../../color.json")
const permissions = require("../../permissions.json")
const ms = require("ms")
const prettyMilliseconds = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")
const embed3 = require("../../functions/embed/main")
const language = require("../../lang.json")
const logs = require('../../functions/logs/main')
const moment = require('moment')
getNow = () => { return { time: new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }), }; };
var time
var channel
var winner
var price
let msgwait
var lastmsg
//var needrole
var needvoice
const fetchAll = require('discord-fetch-all')
async function updateEmbed(msgwait, lang) {
    let embed = new Discord.MessageEmbed()
    if (lang.by == 'by') {
        embed.setTitle('Giveaway')
        embed.addField('Time', time, true)
        embed.addField('Channel', channel != '-' ? `<#${channel}>` : channel, true)
        embed.addField('Force winner', winner != 'false' ? `<@${winner}>` : winner, true)
        embed.addField('Need vocal', needvoice, true)
        //embed.addField('Need role', needrole != 'false' ? `<@&${needrole}>` : needrole, true)
        embed.addField('Price', price, true)
    } else {
        embed.setTitle('Giveaway')
        embed.addField('Temps', time, true)
        embed.addField('Salon', channel != '-' ? `<#${channel}>` : channel, true)
        embed.addField('Gagnant prédéfini', winner != 'false' ? `<@${winner}>` : winner, true)
        embed.addField('Présence en vocal', needvoice, true)
        //embed.addField('Rôle obligatoire', needrole != 'false' ? `<@&${needrole}>` : needrole, true)
        embed.addField('Prix', price, true)
    }
    await msgwait.edit(embed)
}

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
                            if (!message.guild.roles.cache.has(myrole)) return embed3.simple(client, message, 'Perm kick/ban', message.guild.iconURL({ dynamic: true }), lang.rolebanproblem, color.orangered, message.channel)
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
                        if (!botaccess) return embed3.permissionMissing(client, message, botperm, lang.botpermissionmissing)
                    }
                    lang = language[`${lang2}`]
                    let cani = db.fetch(`giveaway_${message.guild.id}`)
                    if (cani) return message.reply("Commande sous cooldown.")
                    db.set(`giveaway_${message.guild.id}`, true)
                    setTimeout(async () => {
                        db.set(`giveaway_${message.guild.id}`, false)
                    }, 6000)

                    /*await database.query("SELECT * FROM permg WHERE serverid = ? AND id = ?", [message.guild.id, message.author.id], async (error, result, fields) => {
                        if (error) return message.reply('Une erreur est survenue, contacter mon créateur. ' + error)
                        if (!result[0]) return message.reply("Vous n'avez pas la permission giveaway.")*/
                    if (!args[0]) {
                        await database.query("SELECT * FROM s_giveaway WHERE serverid = ?", message.guild.id, async function (error, result, fields) {
                            if (error || result < 1) return message.reply(lang.undefinederror)
                            time = await result[0].time
                            channel = await result[0].channel
                            winner = await result[0].winner
                            price = await result[0].price
                            needvoice = await result[0].needvoice
                            //needrole = await result[0].needrole
                            filter = (reaction, user) => ['🕙', '🏷️', '🕵️', '🔈', '🎁', '✅'].includes(reaction.emoji.name) && user.id === message.author.id,
                                dureefiltrer = response => { return response.author.id === message.author.id };
                            msgwait = await message.channel.send(lang.by == 'by' ? 'Please wait the time to add all reactions.' : 'Veuillez attendre la fin de l\'ajout des réactions.')

                            await Promise.all(['🕙', '🏷️', '🕵️', '🔈', '🎁', '✅'].map(r => msgwait.react(r)))
                            await updateEmbed(msgwait, lang)
                            const filterReaction = (reaction, user) => user.id === message.author.id && !user.bot
                            const filterMessage = (m) => m.author.id === message.author.id && !m.author.bot
                            const collectorReaction = await new Discord.ReactionCollector(msgwait, filterReaction)
                            collectorReaction.on('collect', async reaction => {
                                try {
                                    switch (reaction.emoji.name) {
                                        case '🕙':
                                            message.channel.send(`\`${getNow().time}\` 🕙 ${lang.by == 'by' ? 'How many time for the giveaway ?' : 'Combien de temps pour le giveaway ?'}`).then(mp => {
                                                mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                                    .then(async cld => {
                                                        var msg = cld.first();
                                                        if (!msg.content.endsWith("s") && !msg.content.endsWith("d") && !msg.content.endsWith("h") && !msg.content.endsWith("m")) return message.channel.send(`\`${getNow().time}\` 🕙 ${lang.by == 'by' ? 'Invalid time.' : 'Temps invalide.'}`)
                                                        time = msg.content
                                                        message.channel.send(`\`${getNow().time}\` 🕙 ${lang.by == 'by' ? 'Giveaway duration set to' : 'Temps du giveaway mis à'} **${time}**`)
                                                        await updateEmbed(msgwait, lang)
                                                    });
                                            })
                                            break;
                                        case '🏷️':
                                            message.channel.send(`\`${getNow().time}\` 🏷️ ${lang.by == 'by' ? 'Give me the channel id.' : 'Donne moi l\'id du salon.'}`).then(mp => {
                                                mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                                    .then(async cld => {
                                                        var msg = cld.first();
                                                        var channel2 = message.guild.channels.cache.get(msg.content)
                                                        if (!channel2) return message.channel.send(`\`${getNow().time}\` 🏷️ ${lang.by == 'by' ? 'Channel invalid.' : 'Salon invalide.'}`)
                                                        channel = channel2.id
                                                        message.channel.send(`\`${getNow().time}\` 🏷️ ${lang.by == 'by' ? 'You set the channel for the next giveaway at \`' + channel2.name + '\`' : 'Vous avez mis \`' + channel2.name + '\` pour le prochain giveaway'}`)
                                                        await updateEmbed(msgwait, lang)
                                                    });
                                            });
                                            break;
                                        case '🕵️':
                                            message.channel.send(`\`${getNow().time}\` 🕵️ ${lang.by == 'by' ? 'Give the member id. (or write \`false\` to disable)' : 'Donne l\'id du membre. (ou envoie \`false\` pour désactiver)'}`).then(mp => {
                                                mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                                    .then(async cld => {
                                                        var msg = cld.first();
                                                        if (msg.content === "false") {
                                                            winner = 'false'
                                                            message.channel.send(`\`${getNow().time}\` 🕵️ ${lang.by == 'by' ? 'Force winner disable' : 'Gagnant prédéfini désactiver'}`)
                                                            await updateEmbed(msgwait, lang)
                                                        } else {
                                                            var users = message.guild.members.cache.get(msg.content)
                                                            if (!users) return message.channel.send(`\`${getNow().time}\` 🕵️ ${lang.by == 'by' ? 'Invalid user.' : 'Member invalide.'}`)
                                                            winner = users.id
                                                            message.channel.send(`\`${getNow().time}\` 🕵️ ${lang.by == 'by' ? 'Force winner set on ' : 'Gagnant prédéfini sur '} \`${users.user.username}\``)
                                                            await updateEmbed(msgwait, lang)
                                                        }
                                                    });
                                            });
                                            break;
                                        case '🔈':
                                            message.channel.send(`\`${getNow().time}\` 🔈 ${lang.by == 'by' ? 'Write \`true\` or \`false\` to disable.' : 'Envoie \`true\` ou \`false\` pour désactiver.'}`).then(mp => {
                                                mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                                    .then(async cld => {
                                                        var msg = cld.first();
                                                        if (msg.content === "false") {
                                                            needvoice = 'false'
                                                            message.channel.send(`\`${getNow().time}\` 🔈 ${lang.by == 'by' ? 'Need to be in vocal disable.' : 'Besoin d\'être en vocal désactiver.'}`)
                                                            await updateEmbed(msgwait, lang)
                                                        } else {
                                                            if (msg.content != "true") return message.channel.send(`\`${getNow().time}\` 🔈 ${lang.by == 'by' ? 'Invalid answer.' : 'Réponse invalide.'}`)
                                                            needvoice = "true"
                                                            message.channel.send(`\`${getNow().time}\` 🔈 ${lang.by == 'by' ? 'Need to be in vocal activated.' : 'Besoin d\'être en vocal activer.'}`)
                                                            await updateEmbed(msgwait, lang)
                                                        }
                                                    });
                                            });
                                            break;
                                        /* case '🎭':
                                     message.channel.send(`\`${getNow().time}\` 🎭 ${lang.by == 'by' ? 'Give the role id. (or write \`false\` to disable)' : 'Donne l\'id du rôle. (ou envoie \`false\` pour désactiver)'}`).then(mp => {
                                         mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                             .then(async cld => {
                                                 var msg = cld.first();
                                                 if (msg.content === "false") {
                                                     needrole = 'false'
                                                     message.channel.send(`\`${getNow().time}\` 🎭 ${lang.by == 'by' ? 'Need role disable' : 'Rôle obligatoire désactiver'}`)
                                                     await updateEmbed(msgwait, lang)
                                                 } else {
                                                     var users = message.guild.roles.cache.get(msg.content)
                                                     if (!users) return message.channel.send(`\`${getNow().time}\` 🎭 ${lang.by == 'by' ? 'Invalid role.' : 'Rôle invalide.'}`)
                                                     needrole = users.id
                                                     message.channel.send(`\`${getNow().time}\` 🎭 ${lang.by == 'by' ? 'Role needed set on ' : 'Rôle obligatoire mis sur '} \`${users.name}\``)
                                                     await updateEmbed(msgwait, lang)
                                                 }
                                             });
                                     });
                                     break;*/
                                        case '🎁':
                                            message.channel.send(`\`${getNow().time}\` 🎁 ${lang.by == 'by' ? 'Tell me what\'s the price.' : 'Dites moi le prix.'}`).then(mp => {
                                                mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                                    .then(async cld => {
                                                        var msg = cld.first();
                                                        price = msg.content
                                                        message.channel.send(`\`${getNow().time}\` 🎁 ${lang.by == 'by' ? 'Now for the next giveaway the price will be' : 'Pour le prochain giveaway le prix sera'} \`${price}\`.`)
                                                        await updateEmbed(msgwait, lang)
                                                    });
                                            });
                                            break;
                                        case '✅':
                                            try {
                                                var channel3 = message.guild.channels.cache.get(channel)
                                                if (!channel3) return message.channel.send(`\`${getNow().time}\` :x: ${lang.by == 'by' ? '**Error**: set a new (or retry with this) channel.' : '**Erreur**: mettez un nouveau (ou réessayer avec celui-ci) salon.'}`)
                                                message.channel.send(`\`${getNow().time}\` ✅ ${lang.by == 'by' ? 'Giveaway started in' : 'Giveaway lancé dans'} ${channel3}.`)
                                                console.log(`Giveaway started in ${message.guild.name}\n${price}\n${winner}`)
                                                var finish = false
                                                console.log(time)
                                                let duree = ms(time)
                                                console.log(duree)
                                                let timestamp = Date.now() + duree
                                                let embed = new Discord.MessageEmbed()
                                                embed.setTitle(price)
                                                let timestamp2 = (timestamp - Date.now())
                                                embed.setDescription(`${lang.by == 'by' ? 'React with :tada: to participate !' : 'Réagit avec :tada: pour participer !'}\n${lang.by == 'by' ? `Time : ${prettyMilliseconds(duree, { compact: true })}` : `Temps : ${prettyMilliseconds(duree, { compact: true })}`}\n${lang.by == 'by' ? `Created by **${message.author}**` : `Créé par **${message.author}**`}`)
                                                embed.setColor(color.pink)
                                                embed.setFooter(lang.by == 'by' ? 'Giveaway end :' : 'Fin à :')
                                                embed.setTimestamp(timestamp)
                                                var msg = await channel3.send(embed)
                                                msg.react("🎉")
                                                var i = setInterval(async () => {
                                                    try {
                                                        if (finish != false) return clearInterval(i)
                                                        try {
                                                            timestamp2 = (timestamp - Date.now())
                                                            embed.setDescription(`${lang.by == 'by' ? 'React with :tada: to participate !' : 'Réagit avec :tada: pour participer !'}\n${lang.by == 'by' ? `Time : ${prettyMilliseconds(timestamp2)}` : `Temps : ${prettyMilliseconds(timestamp2)}`}\n${lang.by == 'by' ? `Created by **${message.author}**` : `Créé par **${message.author}**`}`)
                                                            msg.edit(embed).catch(e => { return })
                                                        } catch (err) { return }
                                                    } catch (err) { return }
                                                }, 9500);
                                                var ladate = new Date()
                                                var val = [[msg.guild.id, time, channel3.id, msg.id, price, winner, timestamp, message.author.id, '0', `${ladate.getDate() + "/" + (ladate.getMonth() + 1) + "/" + ladate.getFullYear() + "  " + ladate.getHours() + ":" + ladate.getMinutes() + ":" + ladate.getSeconds()}`, needvoice]]
                                                await database.query(`INSERT INTO giveaways (serverid, time, channel, message, price, winner, end, author, ended, date, needvoice) VALUES ?`, [val], async function (error, result, fields) {
                                                    if (error || result < 1) console.log('Giveaway insert function error : ' + error)
                                                })
                                                setTimeout(async () => {
                                                    try {
                                                        if (!msg) return
                                                        finish = true
                                                        lastmsg = msg.id
                                                        if (msg.reactions.cache.get("🎉").count <= 1) {
                                                            message.channel.send(`\`${getNow().time}\` :x: ${lang.by == 'by' ? '**Error**: no winner' : '**Erreur**: aucun gagnant'}`).catch(e => { return })
                                                        }
                                                        if (winner !== 'false') {
                                                            winner = message.guild.members.cache.get(winner)
                                                            if (!winner) return winner = msg.reactions.cache.get("🎉").users.cache.filter((u) => !u.bot).random();
                                                        } else if (needvoice !== 'false') {
                                                            //msg.reactions.cache.get("🎉").users.cache.filter((u) => console.log(u))                                                    
                                                            winner = msg.reactions.cache.get("🎉").users.cache.filter((u) => !u.voice).random()
                                                            // else winner = msg.reactions.cache.get("🎉").users.cache.filter((u) => !u.voice.channelID && u.roles.cache.has(needrole)).random()
                                                        } else winner = msg.reactions.cache.get("🎉").users.cache.filter((u) => !u.bot).random()
                                                        if (!winner) return message.channel.send(`\`${getNow().time}\` :x: ${lang.by == 'by' ? '**Error**: no winner' : '**Erreur**: aucun gagnant'}`).catch(e => { return })
                                                        try {
                                                            var embed2 = new Discord.MessageEmbed()
                                                                .setTitle(price)
                                                                .setDescription(`
        ${lang.by == "by" ? "Winner" : "Gagnant"} : ${winner}
        ${lang.by == "by" ? "Created by" : "Créé par"} : ${message.author}`)
                                                                .setColor(color.green)
                                                                .setFooter(`${lang.by == "by" ? "Giveaway ended at" : "Giveaway fini à"} :`)
                                                                .setTimestamp(Date.now())
                                                        } catch (err) { return }
                                                        msg.edit(embed2).catch(e => { return })
                                                        if (!msg) return
                                                        if (!msg.id) return
                                                        channel3.send(`${lang.by == 'by' ? `Well play <@${winner.id}> ! You won : **${price}**` : `Bien joué <@${winner.id}> ! Tu as gagné : **${price}**`}`).catch(e => { return })
                                                        console.log(`Giveaway ended on ${msg.guild.name}\n${price}\n${winner.tag}`)
                                                        await database.query(`UPDATE s_giveaway SET lastmsg = ${lastmsg} WHERE serverid = ${msg.guild.id}`, async function (error, result, fields) {
                                                            if (error || result < 1) return
                                                        })
                                                        await database.query(`UPDATE giveaways SET ended = "1" WHERE serverid = ${msg.guild.id} AND message = ${msg.id}`, async function (error, result, fields) {
                                                            if (error || result < 1) console.log('Giveaway delete function error : ' + error)
                                                        })
                                                    } catch (err) { return console.log(err) }
                                                }, ms(time))
                                                var val2 = [time, channel, winner, price, needvoice, msg.guild.id]
                                                await database.query(`UPDATE s_giveaway SET time = ? , channel = ? , winner = ? , price = ? , needvoice = ? WHERE serverid = ?`, val2, async function (error, result, fields) {
                                                    if (error || result < 1) console.log('Giveaway settings update error : ' + error)
                                                })
                                            } catch (err) { return console.log(err) }
                                            break;
                                    }
                                } catch (err) {
                                    return
                                }
                            })
                        })
                    } else {
                        if (!args[0] == "reroll") return embed3.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        if (!args[1]) {
                            await database.query("SELECT * FROM s_giveaway WHERE serverid = ?", message.guild.id, async function (error, result, fields) {
                                if (error) return embed3.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                if (result < 1) return message.reply(lang.by == "by" ? "I have no message registered, try : \`" + prefix + "giveaway reroll <message id>\`" : "Je n'ai aucun message enregistré, essaie : \`" + prefix + "giveaway reroll <message id>\`")
                                let a = result[0]
                                await database.query("SELECT * FROM giveaways WHERE serverid = ? AND message = ?", [message.guild.id, a.lastmsg], async function (error, result, fields) {
                                    if (error) return embed3.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                    if (result < 1) return message.reply(lang.by == "by" ? "I have no message registered, try : \`" + prefix + "giveaway reroll <message id>\`" : "Je n'ai aucun message enregistré, essaie : \`" + prefix + "giveaway reroll <message id>\`")
                                    let r = result[0]
                                    if (r.ended == '0') return message.reply(lang.by == 'by' ? 'The giveaway is not finish.' : 'Le giveaway n\'est pas terminé.')
                                    await message.guild.channels.cache.find(c => c.id === r.channel).messages.fetch({ around: r.message, limit: 1 })
                                        .then(async msg => {
                                            await message.guild.members.fetch()
                                            const fetchedMsg = msg.first();
                                            let lastmsg2 = fetchedMsg.id
                                            let winner2 = r.winner
                                            let price2 = r.price
                                            let needvoice2 = r.voice
                                            if (fetchedMsg.reactions.cache.filter(u => !u.bot).get("🎉").count <= 1) {
                                                fetchedMsg.channel.send(`\`${getNow().time}\` :x: ${lang.by == 'by' ? '**Error**: no winner' : '**Erreur**: aucun gagnant'}`).catch(e => { return })
                                            }
                                            const allMessages = await fetchAll.reactions(fetchedMsg, '🎉', {
                                                userOnly: true, // Only return users that have reacted to the message
                                                botOnly: false, // Only return bots that have reacted to the message
                                            });
                                            //console.log(allMessages)
                                            //console.log(allMessages.random())
                                            if (winner2 !== 'false') {
                                                winner2 = fetchedMsg.guild.members.cache.get(winner2)
                                                if (!winner2) return winner2 = allMessages.random()

                                                //if (!winner) return winner = fetchedMsg.reactions.cache.get("🎉").users.cache.filter((u) => !u.bot).random();
                                            } else {
                                                //winner = fetchedMsg.reactions.cache.get("🎉").users.cache.filter((u) => !u.bot).random()
                                                winner2 = allMessages.random()
                                            }
                                            if (!winner2) return fetchedMsg.channel.send(`\`${getNow().time}\` :x: ${lang.by == 'by' ? '**Error**: no winner' : '**Erreur**: aucun gagnant'}`).catch(e => { return })
                                            fetchedMsg.channel.send(`${lang.by == 'by' ? `Well play <@${winner2.id}> ! You won : **${price2}**` : `Bien joué <@${winner2.id}> ! Tu as gagné : **${price2}**`}`)
                                        }).catch(e => { return message.reply(lang.by == 'by' ? 'This message doesnt exist.' : "Je ne trouve pas ce message." + e) })
                                })
                            })
                        } else {
                            if (args[1].length != 18 || isNaN(args[1])) return embed3.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                            await database.query("SELECT * FROM giveaways WHERE serverid = ? AND message = ?", [message.guild.id, args[1]], async function (error, result, fields) {
                                if (error) return embed3.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                if (result < 1) return message.reply(lang.by == "by" ? "Unknow giveaway message." : "Message de giveaway inconnu.")
                                let r = result[0]
                                if (r.ended == '0') return message.reply(lang.by == 'by' ? 'The giveaway is not finish.' : 'Le giveaway n\'est pas terminé.')
                                await message.guild.channels.cache.find(c => c.id === r.channel).messages.fetch({ around: r.message, limit: 1 })
                                    .then(async msg => {
                                        await message.guild.members.fetch()
                                        const fetchedMsg = msg.first();
                                        let lastmsg2 = fetchedMsg.id
                                        let winner2 = r.winner
                                        let price2 = r.price
                                        if (fetchedMsg.reactions.cache.filter(u => !u.bot).get("🎉").count <= 1) {
                                            fetchedMsg.channel.send(`\`${getNow().time}\` :x: ${lang.by == 'by' ? '**Error**: no winner' : '**Erreur**: aucun gagnant'}`).catch(e => { return })
                                        }
                                        const allMessages = await fetchAll.reactions(fetchedMsg, '🎉', {
                                            userOnly: true, // Only return users that have reacted to the message
                                            botOnly: false, // Only return bots that have reacted to the message
                                        });
                                        //console.log(allMessages)
                                        //console.log(allMessages.random())
                                        if (winner2 !== 'false') {
                                            winner2 = fetchedMsg.guild.members.cache.get(winner2)
                                            if (!winner2) return winner2 = allMessages.random()

                                            //if (!winner) return winner = fetchedMsg.reactions.cache.get("🎉").users.cache.filter((u) => !u.bot).random();
                                        } else {
                                            //winner = fetchedMsg.reactions.cache.get("🎉").users.cache.filter((u) => !u.bot).random()
                                            winner2 = allMessages.random()
                                        }
                                        if (!winner2) return fetchedMsg.channel.send(`\`${getNow().time}\` :x: ${lang.by == 'by' ? '**Error**: no winner' : '**Erreur**: aucun gagnant'}`).catch(e => { return })
                                        fetchedMsg.channel.send(`${lang.by == 'by' ? `Well play <@${winner2.id}> ! You won : **${price2}**` : `Bien joué <@${winner2.id}> ! Tu as gagné : **${price2}**`}`)
                                    }).catch(e => { return message.reply(lang.by == 'by' ? 'This message doesnt exist.' : "Je ne trouve pas ce message.") })
                            })
                        }
                    }
                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

// return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
};

module.exports.help = {
    name: "giveaway",
    aliases: [`g`],
    desc: ["Crée un event et désigne un gagnant au hasard", "Create an event and choose a winner aleatory"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["giveaway", "giveaway reroll [id d'un message]"],
    type: ["Fun"],
    perm: "giveaway"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, 'giveaway']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}