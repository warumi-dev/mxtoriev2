const Discord = require("discord.js")
const config = require("../../config.json")
const data = require("../../database.json")
const color = require("../../color.json")
const permissions = require("../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")
const embed2 = require("../../functions/embed/main")
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
                            if (!message.guild.roles.cache.has(myrole)) return embed2.simple(client, message, 'Perm kick/ban', message.guild.iconURL({ dynamic: true }), lang.rolebanproblem, color.orangered, message.channel)
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
                        if (!botaccess) return embed2.permissionMissing(client, message, botperm, lang.botpermissionmissing)
                    }
                    lang = language[`${lang2}`]

                    if (!args[0] || args[0] != "list" && args[0] != "add" && args[0] != "remove") return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    switch (args[0]) {
                        case 'list':
                            try {
                                filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && user.id === message.author.id
                                dureefiltrer = response => { return response.author.id === message.author.id }
                                if (!args[1] || args[1] != "invite" && args[1] != "level") return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                await database.query("SELECT * FROM rewards WHERE serverid = ? AND type = ?", [message.guild.id, args[1]], async (error, result) => {
                                    if (error) return message.reply("Une erreur est survenue, contacter mon créateur. " + error)
                                    let type = args[1] == 'invite' ? 'invites' : 'level'
                                    let embed = new Discord.MessageEmbed()
                                    embed.setTitle(lang.by == 'by' ? "Rewards" : "Récompenses")
                                    let desc = ""
                                    let mypage = []
                                    let page = 0
                                    var count = 0
                                    if (result.length < 1) {
                                        desc = lang.by == 'by' ? "The server have no reward for this type : " + type : "Le serveur n'as aucune récompense pour ce type : " + type
                                        embed.setTimestamp()
                                        embed.setDescription(desc)
                                        embed.setColor(color.skyblue)
                                        embed.setFooter(message.guild.name + `\n'Résultat(s) : 0\nPage(s) : 0`)
                                        message.channel.send(embed)
                                    } else {
                                        let current = 0
                                        result.map((i, n) => {
                                            ++current
                                            desc += `**${i.count} ${type}** : <@&${i.role}>\n`
                                            ++count
                                            if (current == 10) {
                                                current = 0
                                                mypage.push(desc)
                                                desc = ""
                                            } else if ((n + 1) == result.length) {
                                                current = 0
                                                mypage.push(desc)
                                                desc = ""
                                            }
                                        })
                                        embed.setTimestamp()
                                        embed.setDescription(mypage[page])
                                        embed.setColor(color.skyblue)
                                        embed.setFooter(message.guild.name + `\n${'Résultat(s) : ' + count + '\nPage(s) : ' + mypage.length}`)
                                        message.channel.send(embed).then(async m => {
                                            const collector = m.createReactionCollector(filter);
                                            collector.on('collect', async r => {
                                                try {
                                                    if (r.emoji.name === "⬅️") {
                                                        if (page == 0) {
                                                            page = mypage.length - 1
                                                            embed.setDescription(mypage[page])
                                                            m.edit(embed)
                                                        } else {
                                                            page = page - 1
                                                            embed.setDescription(+mypage[page])
                                                            m.edit(embed)
                                                        }
                                                        r.users.remove(message.author.id)
                                                    }
                                                    if (r.emoji.name === "➡️") {
                                                        if (page == mypage.length - 1) {
                                                            page = 0
                                                            embed.setDescription(mypage[page])
                                                            m.edit(embed)
                                                        } else {
                                                            page = page + 1
                                                            embed.setDescription(mypage[page])
                                                            m.edit(embed)
                                                        }
                                                        r.users.remove(message.author.id)
                                                    }
                                                    if (r.emoji.name === "❌") {
                                                        r.users.remove(message.author.id)
                                                        if (message) message.delete().catch(e => { })
                                                        if (m) m.delete().catch(e => { })
                                                    }
                                                } catch (err) { }
                                            })
                                            if (mypage.length < 2) return
                                            await m.react("⬅️")
                                            await m.react("➡️")
                                            await m.react("❌")
                                        })
                                    }
                                })


                            } catch (err) { return console.log(this.help.name + ' error : ' + err) }
                            break;

                        case 'add':
                            try {
                                if (!config.owners.includes(message.author.id) && config.buyer != message.author.id && config.creator != message.author.id) return message.channel.send(language[lang].permissionmissing + `**\`perm owner minimum\`**`)
                                if (!args[1] || args[1] != "invite" && args[1] != "level") return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                switch (args[1]) {
                                    case 'invite':
                                        try {
                                            if (!args[2] || isNaN(args[2])) return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                            let many = parseInt(args[2])
                                            if (!args[2] && args[2] != 0) return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                            let mention = message.mentions.roles.first()
                                            if (mention) mention = mention.id
                                            if (!mention) mention = args[3]
                                            if (!mention || isNaN(mention) || mention.length != 18) return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                            if (!message.guild.roles.cache.has(mention)) return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                            await database.query("SELECT * FROM rewards WHERE serverid = ? AND type = ? AND role = ?", [message.guild.id, args[1], mention], async (error, result) => {
                                                if (error) return message.reply("Une erreur est survenue, contacter mon créateur. " + error)
                                                if (result[0]) return message.channel.send('Ce rôle est déjà utilisé pour ce type : ' + args[1])
                                                var val = [[message.guild.id, "invite", many, mention]]
                                                await database.query("INSERT INTO rewards (serverid, type, count, role) VALUES ?", [val], async (error, result) => {
                                                    if (error) return message.reply("Une erreur est survenue, contacter mon créateur. " + error)
                                                    return message.channel.send("Le rôle \`" + message.guild.roles.cache.get(mention).name + "\` sera donner lorsque quelqu'un atteindra " + many + " invite(s).")
                                                })
                                            })
                                        } catch (err) { return }
                                        break;

                                    case 'level':
                                        try {
                                            if (!args[2] || isNaN(args[2])) return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                            let many = parseInt(args[2])
                                            if (!args[2] && args[2] != 0) return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                            let mention = message.mentions.roles.first()
                                            if (mention) mention = mention.id
                                            if (!mention) mention = args[3]
                                            if (!mention || isNaN(mention) || mention.length != 18) return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                            if (!message.guild.roles.cache.has(mention)) return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                            await database.query("SELECT * FROM rewards WHERE serverid = ? AND type = ? AND role = ?", [message.guild.id, args[1], mention], async (error, result) => {
                                                if (error) return message.reply("Une erreur est survenue, contacter mon créateur. " + error)
                                                if (result[0]) return message.channel.send('Ce rôle est déjà utilisé pour ce type : ' + args[1])
                                                var val = [[message.guild.id, "level", many, mention]]
                                                await database.query("INSERT INTO rewards (serverid, type, count, role) VALUES ?", [val], async (error, result) => {
                                                    if (error) return message.reply("Une erreur est survenue, contacter mon créateur. " + error)
                                                    return message.channel.send("Le rôle \`" + message.guild.roles.cache.get(mention).name + "\` sera donner lorsque quelqu'un atteindra " + many + " level")
                                                })
                                            })
                                        } catch (err) { return }
                                        break;
                                }
                            } catch (err) { return }
                            break;

                        case 'remove':
                            try {
                                if (!config.owners.includes(message.author.id) && config.buyer != message.author.id && config.creator != message.author.id) return message.channel.send(language[lang].permissionmissing + `**\`perm owner minimum\`**`)
                                if (!args[1] || args[1] != "invite" && args[1] != "level") return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                try {
                                    let mention = message.mentions.roles.first()
                                    if (mention) mention = mention.id
                                    if (!mention) mention = args[2]
                                    if (!mention || isNaN(mention) || mention.length != 18) return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                    if (!message.guild.roles.cache.has(mention)) return embed2.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                                    await database.query("SELECT * FROM rewards WHERE serverid = ? AND type = ? AND role = ?", [message.guild.id, args[1], mention], async (error, result) => {
                                        if (error) return message.reply("Une erreur est survenue, contacter mon créateur. " + error)
                                        if (!result[0]) return message.channel.send('Ce rôle n\'est pas utilisé pour ce type : ' + args[1])
                                        await database.query("DELETE FROM rewards WHERE serverid = '" + message.guild.id + "' AND type = '" + args[1] + "' AND role = '" + mention + "'", async (error, result) => {
                                            if (error) return message.reply("Une erreur est survenue, contacter mon créateur. " + error)
                                            return message.channel.send("Le rôle \`" + message.guild.roles.cache.get(mention).name + "\` ne sera plus donner.")
                                        })
                                    })
                                } catch (err) { return }
                            } catch (err) { return }
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
    name: "rewards",
    aliases: [`reward`, `recompense`, `recompenses`, `récompense`, `récompenses`],
    desc: ["Ajoute/Retire des récompenses lorqu'un member atteint un certain niveau/nombre d'invites", "Add/Remove a reward when a member hit a level/invitations count"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["rewards list invite", "rewards list level", "rewards add/remove <invite/level> <nombre> <role/id>", "rewards remove <invite/level> <nombre>"],
    type: ["Fun", "Fun"],
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