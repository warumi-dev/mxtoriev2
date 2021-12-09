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
const { white } = require("chalk")
const cards = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const cardsValue = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]
const AsValue = [1, 11]
const cardsType = ['♣️', '♦️', '♥️', '♠️']
const start = [1, 2]

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



                    var miser = 0
                    var msgwait
                    var currentPlayerDeck = []
                    var currentPlayerType = []
                    var currentBotDeck = []
                    var currentBotType = []
                    var playervalue = 0
                    var botvalue = 0
                    async function UpdateEmbed(type, client, message, cards, cardstype, cardsvalue, cardsbot, cardstypebot, cardsvaluebot, database) {
                        let desc = ""
                        let desc2 = ""
                        //console.log(cards)
                        if (type == 'player' || type == 'start') {
                            if (currentPlayerDeck.length < 1) {
                                await cards.map((i, n) => {
                                    currentPlayerDeck.push(i)
                                    currentPlayerType.push(cardstype[n])
                                    //currentPlayerType.push(cardstype[n])
                                    desc += i + currentPlayerType[n]
                                })
                                /*await currentPlayerType.map(i => {
                                    currentPlayerType.push(i)
                                })*/
                            } else {
                                /*await currentPlayerDeck.map((i, n) => {
                                    desc += i + currentPlayerType[n]
                                })*/
                                currentPlayerDeck.push(cards)
                                currentPlayerType.push(cardstype[0])
                                // desc += i + currentPlayerType[0]
                                /*await currentPlayerType.map(i => {
                                    currentPlayerType.push(i)
                                })*/
                            }
                        }
                        if (type == 'bot' || type == 'start') {
                            if (currentBotDeck.length < 1) {
                                await cardsbot.map((i, n) => {
                                    currentBotDeck.push(i)
                                    //currentBotType.push(cardstypebot[n])
                                    desc2 += i + currentBotType[cardstypebot[n]]
                                    currentBotType.push(cardstypebot[n])
                                })
                                /*await currentBotType.map(i => {
                                    currentBotType.push(i)
                                })*/
                            } else {
                                /*await currentBotDeck.map((i, n) => {
                                    desc2 += i + currentBotType[n]
                                })*/
                                /**await cardsbot.map((i, n) => {
                                    currentBotDeck.push(i)
                                    currentBotType.push(cardstypebot[n])
                                    desc2 += i + currentBotType[n]
                                })*/
                                /*await currentBotType.map(i => {
                                    currentBotType.push(i)
                                })*/
                                cardsbot.map(i => {
                                    currentBotDeck.push(i)
                                    currentBotType.push(cardstypebot[0])
                                })
                            }
                        }
                        if (cardsvalue) {
                            playervalue = playervalue + cardsvalue
                        }
                        if (cardsvaluebot) {
                            botvalue = botvalue + cardsvaluebot
                        }
                        let lose = false
                        let win = false
                        let finish = false
                        if (type == 'player' || type == 'start') {
                            if (playervalue > 21) {
                                lose = true
                                win = false
                                finish = true
                            } else if (playervalue == 21) {
                                lose = false
                                win = true
                                finish = true
                            } else {
                                lose = false
                                win = false
                                finish = false
                            }
                        }
                        if (type == 'bot') {
                            if (botvalue > 21) {
                                lose = false
                                win = true
                                finish = true
                            } else if (botvalue == 21) {
                                lose = true
                                win = false
                                finish = true
                            } else if (botvalue < playervalue) {
                                lose = false
                                win = true
                                finish = true
                            } else {
                                lose = true
                                win = false
                                finish = true
                            }
                        }
                        let embed = new Discord.MessageEmbed()
                        embed.setTitle("Blackjack")
                        //console.log(currentPlayerDeck)
                        //console.log(currentBotType)
                        embed.setDescription(`${currentPlayerDeck.map((i, n) => `${i}`)}      |       ${currentBotDeck.map((i, n) => `${i}`)}`)
                        embed.addField('Votre main', `Valeur : ${playervalue}`, true)
                        embed.addField('Croupier', `Valeur : ${botvalue}`, true)
                        embed.setFooter(finish ? `Fini - ${win ? 'Gagné' : 'Perdu'}` : `En cours`)
                        embed.setColor(finish ? win ? color.green : color.red : color.cyan)
                        await msgwait.edit(embed)
                        if (finish) {
                            msgwait.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                            db.set(`game_${message.guild.id}_${message.author.id}`, false)
                            currentPlayerDeck = []
                            currentPlayerType = []
                            currentBotDeck = []
                            currentBotType = []
                            playervalue = 0
                            botvalue = 0
                            await database3.query("SELECT * FROM coins WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async (error, result) => {
                                await database3.query("UPDATE coins SET usercoins = ? WHERE serverid = ? AND userid = ?", [win ? result[0].usercoins + miser : result[0].usercoins - miser, message.guild.id, message.author.id], async (error, result) => {
                                    if (error) return message.reply("Une erreur est survenue, contacter mon créateur. " + error)
                                })
                            })
                        }
                    }
                    try {
                        let alreadyPlay = db.fetch(`game_${message.guild.id}_${message.author.id}`)
                        if (alreadyPlay) return message.reply("Vous avez déjà une partie en cours...")
                        if (!args[0] || isNaN(args[0])) return message.reply("La somme que vous souhaitez misé est invalide.")
                        await database3.query("SELECT * FROM coins WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async (error, result) => {
                            if (error) return message.reply("Une erreur est survenue, contacter mon créateur. " + error)
                            if (!result[0]) return message.reply("Vous n'avez pas créé de compte, faites \`$coins\` pour vous en créez un automatiquement.")
                            if (result[0].usercoins - parseInt(args[0]) < 0) return message.reply("Vous n'avez pas assez de coins.")
                            miser = parseInt(args[0])
                            if (miser < 1) return message.reply("La somme que vous souhaitez misé est invalide.")
                            db.set(`game_${message.guild.id}_${message.author.id}`, true)
                            filter = (reaction, user) => ['➕', '🛑'].includes(reaction.emoji.name) && user.id === message.author.id,
                                dureefiltrer = response => { return response.author.id === message.author.id };
                            msgwait = await message.channel.send('Veuillez attendre la fin de l\'ajout des réactions.')
                            let starting = []
                            await starting.push(start[Math.floor(Math.random() * start.length)])
                            let firstDeck = []
                            let firstValue = 0
                            let firstType = []
                            await starting.map(i => {
                                let take = Math.floor(Math.random() * cards.length)
                                firstDeck.push(cards[take])
                                firstValue = (firstValue + cardsValue[take])
                                firstType.push(cardsType[Math.floor(Math.random() * cardsType.length)])
                            })
                            let Botstarting = []
                            await Botstarting.push(start[Math.floor(Math.random() * start.length)])
                            let firstBotDeck = []
                            let firstBotValue = 0
                            let firstBotType = []
                            await Botstarting.map(i => {
                                let take = Math.floor(Math.random() * cards.length)
                                firstBotDeck.push(cards[take])
                                firstBotValue = (firstBotValue + cardsValue[take])
                                firstBotType.push(cardsType[Math.floor(Math.random() * cardsType.length)])
                            })
                            await Promise.all(['➕', '🛑'].map(r => msgwait.react(r)))
                            await UpdateEmbed('start', client, message, firstDeck, firstType, firstValue, firstBotDeck, firstBotType, firstBotValue, database)
                            const filterReaction = (reaction, user) => user.id === message.author.id && !user.bot
                            const filterMessage = (m) => m.author.id === message.author.id && !m.author.bot
                            const collectorReaction = await new Discord.ReactionCollector(msgwait, filterReaction)
                            collectorReaction.on('collect', async reaction => {
                                try {
                                    switch (reaction.emoji.name) {
                                        case '➕':

                                            //let t = start[Math.floor(Math.random() * start.length)]
                                            let take = Math.floor(Math.random() * cards.length)
                                            let f = []
                                            let val = 0
                                            let ft = []
                                            f = await cards[take]
                                            val = (val + cardsValue[take])
                                            await ft.push(cardsType[Math.floor(Math.random() * cardsType.length)])
                                            UpdateEmbed('player', client, message, f, ft, val, null, null, null, database)
                                            reaction.users.remove(message.author.id)
                                            break;
                                        case '🛑':

                                            let f2 = []
                                            let val2 = 0
                                            let ft2 = []
                                            let v = [1, 2]
                                            v.map(async v => {
                                                let take2 = Math.floor(Math.random() * cards.length)
                                                f2.push(cards[take2])
                                                val2 = (val2 + cardsValue[take2])
                                                await ft2.push(cardsType[Math.floor(Math.random() * cardsType.length)])
                                            })

                                            UpdateEmbed('bot', client, message, null, null, null, f2, ft2, val2, database)
                                            reaction.users.remove(message.author.id)
                                            break;

                                    }
                                } catch (err) { return }
                            })
                        })
                    } catch (err) {
                        console.log(this.help.name.toUpperCase() + " : " + err)
                    }
                } catch (err) {
                    console.log(this.help.name.toUpperCase() + " : " + err)
                }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

// return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

module.exports.help = {
    name: "bj",
    aliases: [`blackjack`],
    desc: ["Jouer des coins au blackjack", "Play coins to the blackjack"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["bj <montant>"],
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