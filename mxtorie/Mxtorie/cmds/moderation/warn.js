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
const { sanctions } = require("../../functions/db/main")
const logs = require('../../functions/logs/main')
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

                    let mention = message.mentions.members.first()
                    if (mention) mention = mention.id
                    if (!mention) mention = args[0]
                    if (!mention || isNaN(mention) || mention.length != 18) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    let reason = args.splice(1).join(' ')
                    if (!reason) reason = "aucune raison"
                    var ladate = new Date()
                    var myid = Number(1, 10000)
                    let values = [
                        [message.guild.id, mention, "warn", `${ladate.getDate() + "/" + (ladate.getMonth() + 1) + "/" + ladate.getFullYear() + "  " + ladate.getHours() + ":" + ladate.getMinutes() + ":" + ladate.getSeconds()}`, reason, message.author.id, myid]
                    ]
                    await database.query("INSERT INTO sanctions (serverid, userid, type, date, reason, author, id) VALUES ?", [values], async function (error, result, fields) {
                        if (error || result < 1) return message.reply(lang.undefinederror)
                        /*let embed = new Discord.MessageEmbed()
                        embed.setTitle("Warn")
                        embed.setDescription(`<@${mention}> ${lang.hasbeewarned} ${lang.nextreason} \`${reason}\` ${lang.by} ${message.member}`)
                        embed.setColor(config.color.red)
                        embed.setTimestamp()
                        log(message, 'sanction', embed, database)*/
                        //sanctions(client, message, mention, 'warn', reason, message.author.id, database)
                        let member = message.guild.members.cache.find(m => m.id === mention)
                        if (!member) member = mention
                        let warnlogs = lang.sanctionned
                        warnlogs = warnlogs.replace('[member]', '<@' + mention + '>' + '(' + mention + ')')
                        warnlogs = warnlogs.replace('[author]', message.author)
                        warnlogs = warnlogs.replace('[reason]', `\`${reason}\``)
                        warnlogs = warnlogs.replace('[sanction]', 'warn')
                        //embed.logs(client, message, 'Warn', warnlogs, member, color.orangered, 'sanctions')
                        //logs.sanctions(client, message, database, )
                        logs.sanctions(client, message, database, 'Warn', lang.sanctionned, mention, reason, color.pink, lang, message.author, 'sanctions')
                        embed.warn(client, message, mention, 'warn', color.green, true, false, lang, reason)

                        member.send(lang.by == 'by' ? `You has been warned from \`${message.guild.name}\` for the next reason : **${reason}**` : `Tu as été avertie de \`${message.guild.name}\` pour la raison suivante : **${reason}**`).catch(e => { })
                    })

                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

module.exports.help = {
    name: "warn",
    aliases: [`addwarn`],
    desc: ["Ajoute une sanction à un membre", "Add a sanction to a member"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["warn <mention/id> [raison]"],
    type: ["Modération", "Moderation"],
    perm: "3"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, '3']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}