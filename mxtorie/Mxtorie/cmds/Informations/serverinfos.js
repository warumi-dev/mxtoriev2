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

                    let botN = message.guild.members.cache.filter(member => member.user.bot).size;
        if (lang.by == 'by') {
            message.channel.send(new Discord.MessageEmbed()
                .addField('Name', message.guild.name, true)
                .addField('Region', message.guild.region, true)
                .addField('Members', `${message.guild.memberCount} members\n${message.guild.memberCount - botN} humans\n${message.guild.members.cache.filter(member => member.user.bot).size} bots`, true)
                .addField('Channels', `${message.guild.channels.cache.size} channels\n${message.guild.channels.cache.filter(channel => channel.type === 'text').size} text chat\n${message.guild.channels.cache.filter(channel => channel.type === 'voice').size} voice chat\n${message.guild.channels.cache.filter(channel => channel.type === 'category').size} categories`, true)
                .addField('Emojis', `${message.guild.emojis.cache.size} emojis\n${message.guild.emojis.cache.filter(emoji => !emoji.animated).size} static emojis\n${message.guild.emojis.cache.filter(emoji => emoji.animated).size} animated emojis`, true)
                .addField('Roles', message.guild.roles.cache.size, true)
                .addField('Owner', message.guild.owner, true)
                .addField('Creation date', moment(message.guild.createdAt).format('[The] DD/MM/YYYY [at] HH:mm:ss'), true)
                .addField('Nitro boost', `Level : ${message.guild.premiumTier}\nBoost(s) : ${message.guild.premiumSubscriptionCount}`, true)
                .setFooter(`ID : ${message.guild.id}`)
                .setThumbnail(message.guild.iconURL({ dynamic: true }))
                .setImage(message.guild.bannerURL())
                .setTitle("Informations about " + message.guild.name)
                .setColor(color.gold))
        } else {
            message.channel.send(new Discord.MessageEmbed()
                .addField('Nom', message.guild.name, true)
                .addField('Région', message.guild.region, true)
                .addField('Membres', `${message.guild.memberCount} membres\n${message.guild.memberCount - botN} humains\n${message.guild.members.cache.filter(member => member.user.bot).size} bots`, true)
                .addField('Salons', `${message.guild.channels.cache.size} salons\n${message.guild.channels.cache.filter(channel => channel.type === 'text').size} salons textuel\n${message.guild.channels.cache.filter(channel => channel.type === 'voice').size} salons vocaux\n${message.guild.channels.cache.filter(channel => channel.type === 'category').size} catégories`, true)
                .addField('Emojis', `${message.guild.emojis.cache.size} emojis\n${message.guild.emojis.cache.filter(emoji => !emoji.animated).size} emojis statique\n${message.guild.emojis.cache.filter(emoji => emoji.animated).size} emojis animé`, true)
                .addField('Rôles', message.guild.roles.cache.size, true)
                .addField('Créateur', message.guild.owner, true)
                .addField('Date de création', moment(message.guild.createdAt).format('[Le] DD/MM/YYYY [à] HH:mm:ss'), true)
                .addField('Nitro boost', `Niveau : ${message.guild.premiumTier}\nBoost(s) : ${message.guild.premiumSubscriptionCount}`, true)
                .setFooter(`ID : ${message.guild.id}`)
                .setThumbnail(message.guild.iconURL({ dynamic: true }))
                .setImage(message.guild.bannerURL())
                .setTitle("Informations sur " + message.guild.name)
                .setColor(color.gold))
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
    name: "serverinfos",
    aliases: [`Sinfo`, `sinfos`, `serverinfo`],
    desc: ["Montre des informations sur le serveur", "Show some informations on the server"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["serverinfos"],
    type: ["Information", "Information"],
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