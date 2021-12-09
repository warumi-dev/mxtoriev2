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

                    if (!args[0] || isNaN(args[0])) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    database3.query("SELECT * FROM coins WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async (error, result) => {
                        if (error) return message.channel.send(lang.error + error)
                        let miser = parseInt(args[0])
                        if (parseInt(result[0].usercoins) - miser < 0) return message.channel.send("Vous n'avez pas assez d'argent pour miser **" + miser + "**.")

                        let cani = db.fetch(`slot_${message.guild.id}`)
                        if (cani) return message.channel.send("Une partie est en cours attendez votre tour.")
                        db.set(`slot_${message.guild.id}`, true)

                        let slotemoji = ":money_mouth:";
                        let customemoji = "<a:760753334054551572:862716519254196244>";
                        slotemoji = customemoji;

                        /* ITEMS (SLOTS) */

                        let items = ['<:708002242107801631:862716517979258921>', '<:756572987699757107:862716518458720266>', '<:837391840382025808:862716518185566237>'];

                        /* RANDOM */
                        let $ = items[Math.floor(items.length * Math.random())];
                        let $$ = items[Math.floor(items.length * Math.random())];
                        let $$$ = items[Math.floor(items.length * Math.random())];

                        /* EMBEDS */

                        const play = new Discord.MessageEmbed()
                            .setTitle("Slot Machine")
                            .setDescription("• " + slotemoji + "  " + slotemoji + "  " + slotemoji + " •")
                            .setColor('RANDOM')
                            .setFooter("As-tu de la chance ?")

                        const $1 = new Discord.MessageEmbed()
                            .setTitle("Slot Machine")
                            .setDescription("• " + $ + "  " + slotemoji + "  " + slotemoji + " •")
                            .setColor('RANDOM')
                            .setFooter("As-tu de la chance ?")

                        const $2 = new Discord.MessageEmbed()
                            .setTitle("Slot Machine")
                            .setDescription("• " + $ + "  " + $$ + "  " + slotemoji + " •")
                            .setColor('RANDOM')
                            .setFooter("As-tu de la chance ?")


                        const $3 = new Discord.MessageEmbed()
                            .setTitle("Slot Machine")
                            .setDescription("• " + $ + "  " + $$ + "  " + $$$ + " •")
                            .setColor('RANDOM')
                            .setFooter("As-tu de la chance ?")

                        /* SPIN THE SLOTS */

                        spinner = await message.channel.send(play)
                        setTimeout(() => {
                            spinner.edit($1);
                        }, 600);
                        setTimeout(() => {
                            spinner.edit($2);
                        }, 1200);
                        setTimeout(() => {
                            spinner.edit($3);
                        }, 1800);

                        /* DEDUCT RESULTS */
                        // You can add/remove user balance in respective result (if using some currency system)

                        if ($$ !== $ && $$ !== $$$) {
                            let items2 = ['<a:838740444183527454:862718764343361557>', '<:656671820455477260:862718781141811260>']
                            let react = items2[Math.floor(items2.length * Math.random())];
                            setTimeout(() => {
                                message.channel.send("Ta perdu ! Miskine... " + react)
                                db.set(`slot_${message.guild.id}`, false)
                                database3.query("SELECT * FROM coins WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async (error, result) => {
                                    if (error) return message.channel.send(lang.error + error)
                                    database3.query("UPDATE coins SET usercoins = ? WHERE serverid = ? AND userid = ?", [result[0].usercoins - miser, message.guild.id, message.author.id])
                                })
                            }, 2000);
                        } else if ($ === $$ && $ === $$$) {
                            setTimeout(() => {
                                let items3 = ['Tu as gagné !', 'Bah gg !', 'Hehe ta perd...Attend quoi ?', 'Genre ta gagné,']
                                let react2 = items3[Math.floor(items3.length * Math.random())];
                                message.channel.send(react2 + " <:598975658651025420:862718800046718986>")
                                db.set(`slot_${message.guild.id}`, false)
                                database3.query("SELECT * FROM coins WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async (error, result) => {
                                    if (error) return message.channel.send(lang.error + error)
                                    database3.query("UPDATE coins SET usercoins = ? WHERE serverid = ? AND userid = ?", [result[0].usercoins + miser, message.guild.id, message.author.id])
                                })
                            }, 2000);
                        } else {
                            setTimeout(() => {
                                message.channel.send("2 slots égal... Pas de chance.")
                                db.set(`slot_${message.guild.id}`, false)
                                database3.query("SELECT * FROM coins WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async (error, result) => {
                                    if (error) return message.channel.send(lang.error + error)
                                    database3.query("UPDATE coins SET usercoins = ? WHERE serverid = ? AND userid = ?", [result[0].usercoins - miser, message.guild.id, message.author.id])
                                })
                            }, 2000)
                        }
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
    name: "slot",
    aliases: [`slotmachine`, `slot-machine`, `slots`],
    desc: ["Obtenez les 3 mêmes icônes", "How many coins you have"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["slot <montant>"],
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