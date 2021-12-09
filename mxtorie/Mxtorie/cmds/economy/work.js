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

                    let user = message.author;

                    let author = await db.fetch(`work_${message.guild.id}_${user.id}`)

                    let timeout = 600000;

                    if (author !== null && timeout - (Date.now() - author) > 0) {
                        let time = ms(timeout - (Date.now() - author));

                        let timeEmbed = new Discord.MessageEmbed()
                            .setColor("#FFFFFF")
                            .setDescription(`❌ Tu as déjà travailler récement.\n\nRé-essayer dans : ${pretty(ms(time))} `);
                        message.channel.send(timeEmbed)
                    } else {

                        let replies = ['Programmeur', 'Maçon', 'Plombier', 'Pompier', 'Cuisinier', 'Professeur']

                        let result = Math.floor((Math.random() * replies.length));
                        let amounta = Math.floor(Math.random() * 80) + 1;
                        let multiplier = await db.fetch(`multiplierwork_${message.guild.id}`);
                        if (!multiplier) multiplier = 1;
                        let amount = amounta * multiplier;

                        let embed1 = new Discord.MessageEmbed()
                            .setColor("#FFFFFF")
                            .setDescription(`✅ - Tu as travaillé en tant que ${replies[result]} pour gagné ${amount} coins`);
                        message.channel.send(embed1)

                        await database3.query("SELECT * FROM coins WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async function (err, rows) {
                            if (!rows[0]) {

                                await database3.query("INSERT INTO coins (serverid, userid) VALUES ?", [val], async (error, result, fields) => {
                                    if (error) return message.reply(error)
                                    //if(!result) return message.reply('Une erreur est survenue.')
                                })
                            }
                            await database3.query("UPDATE coins SET usercoins = ? WHERE serverid = ? AND userid = ?", [rows[0].usercoins + amount, message.guild.id, user.id])
                        })
                        //await client.db.add(`money_${message.guild.id}_${user.id}.pocket`, amount)
                        await db.set(`work_${message.guild.id}_${user.id}`, Date.now())
                    };


                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

// return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

module.exports.help = {
    name: "work",
    aliases: [`wk`],
    desc: ["Travail pour gagner des coins", "Work for win coins"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["work"],
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