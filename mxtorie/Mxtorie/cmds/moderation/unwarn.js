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
                    let myid = args[1]
                    if (!myid || isNaN(myid)) return message.reply(lang.invalidargs)
                    await database.query("SELECT * FROM sanctions WHERE serverid = ? AND userid = ? AND id = ?", [message.guild.id, mention, myid], async (error, result, fields) => {
                        if (error) return message.reply(lang.error + error)
                        if (!result[0]) return message.reply(lang.by == 'by' ? 'I can\'t find a sanction with this id : ' + myid : 'Je ne trouve pas de sanction avec cette id : ' + myid)
                        var reason = result[0].reason
                        var type = result[0].type
                        var date = result[0].date
                        var author = result[0].author
                        await database.query('DELETE FROM sanctions WHERE serverid = ' + message.guild.id + ' AND userid = ' + mention + ' AND id = ' + myid, async (error, result, fields) => {
                            if (error || result < 1) return message.reply(lang.error + error)
                            message.channel.send(lang.by == "by" ? 'The sanction assigned to the id \`' + myid + '\` has been deleted.' : 'La sanction assigné à l\'id \`' + myid + '\` a bien été supprimée.')
                            let embed = new Discord.MessageEmbed()
                            embed.setTitle(lang.by == 'by' ? 'Sanction deleted' : 'Sanction supprimée')
                            embed.setDescription(`${lang.by == 'by' ? 'Sanction deleted by : ' : 'Sanction supprimée par : '}<@${message.author.id}>\nType : ${type}\nDate : \`${date}\`\n${lang.by == "by" ? "Author :" : "Auteur :"} <@${author}>\n${lang.by == 'by' ? 'Reason :' : 'Raison :'} **${reason}**`)
                            embed.setColor(color.cyan)
                            embed.setTimestamp()
                            log(message, 'sanction', embed, database)
                        })
                    })

                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

module.exports.help = {
    name: "unwarn",
    aliases: [`uw`],
    desc: ["Supprime une sanction d'un utilisateur", "Remove a sanction of someone"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["unwarn <mention/id> <id de la sanction>"],
    type: ["Modération", "Moderation"],
    perm: "2"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, '2']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}

async function log(message, type, myembed, database) {
    if (!type) return
    var r
    await database.query("SELECT * FROM channels WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
        if (result < 1) return
        switch (type) {
            case 'sanction':
                r = result[0].sanctions
                break;
            case 'channel':
                r = result[0].channel
                break;
            case 'protections':
                r = result[0].protections
                break;
        }
        if (r == '-') return
        if (!message.guild.channels.cache.has(r)) return
        message.guild.channels.cache.find(c => c.id === r).send(myembed)
    })
}