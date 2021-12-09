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
                    let cani = db.fetch(`help_${message.guild.id}`)
                    if (cani) return message.reply("Commande sous cooldown.")
                    db.set(`help_${message.guild.id}`, true)
                    setTimeout(async () => {
                        db.set(`help_${message.guild.id}`, false)
                    }, 6000)
                    if (!args[0]) {
                        var modo = ""
                        var modo2 = ""
                        var fun = ""
                        var info = ""
                        var settings = ""
                        var setup = ""
                        var music = ""
                        var economy = ""
                        var totalcmd = 0
                        var totalmodo = 0
                        var totalmodo2 = 0
                        var totalfun = 0
                        var totalinfo = 0
                        var totalsettings = 0
                        var totalsetup = 0
                        var totalmusic = 0
                        var totaleconomy = 0
                        client.commands.forEach(cmd => {
                            let cmdinfo = cmd.help
                            ++totalcmd
                            if (!cmdinfo.type) return
                            if (cmdinfo.type[0] == 'Modération') {
                                modo += `\n**\`${cmdinfo.name}\`** - **${cmdinfo.desc[0]}**${cmdinfo.usage.map(i => `\n${prefix}${i}`)}\n`
                                ++totalmodo
                            }
                            if (cmdinfo.type[0] == 'Modération ++') {
                                modo2 += `\n**\`${cmdinfo.name}\`** - **${cmdinfo.desc[0]}**${cmdinfo.usage.map(i => `\n${prefix}${i}`)}\n`
                                ++totalmodo2
                            }
                            if (cmdinfo.type[0] == 'Fun') {
                                fun += `\n**\`${cmdinfo.name}\`** - **${cmdinfo.desc[0]}**${cmdinfo.usage.map(i => `\n${prefix}${i}`)}\n`
                                ++totalfun
                            }
                            if (cmdinfo.type[0] == 'Information') {
                                info += `\n**\`${cmdinfo.name}\`** - **${cmdinfo.desc[0]}**${cmdinfo.usage.map(i => `\n${prefix}${i}`)}\n`
                                ++totalinfo
                            }
                            if (cmdinfo.type[0] == 'Paramètres') {
                                settings += `\n**\`${cmdinfo.name}\`** - **${cmdinfo.desc[0]}**${cmdinfo.usage.map(i => `\n${prefix}${i}`)}\n`
                                ++totalsettings
                            }
                            if (cmdinfo.type[0] == 'Configuration') {
                                setup += `\n**\`${cmdinfo.name}\`** - **${cmdinfo.desc[0]}**${cmdinfo.usage.map(i => `\n${prefix}${i}`)}\n`
                                ++totalsetup
                            }
                            if (cmdinfo.type[0] == 'Musique') {
                                music += `\n**\`${cmdinfo.name}\`** - **${cmdinfo.desc[0]}**${cmdinfo.usage.map(i => `\n${prefix}${i}`)}\n`
                                ++totalmusic
                            }
                            if (cmdinfo.type[0] == 'Economie') {
                                economy += `\n**\`${cmdinfo.name}\`** - **${cmdinfo.desc[0]}**${cmdinfo.usage.map(i => `\n${prefix}${i}`)}\n`
                                ++totaleconomy
                            }
                        })
                        let embed2 = new Discord.MessageEmbed()
                        embed2.setTitle("📚 - Menu d'aide - 📚")
                        var val3 = ['Menu', 'Modération', 'Modération ++', 'Information', 'Fun', 'Paramètres', 'Configuration', 'Musique', 'Economie', 'Supprimer le message']
                        var val = ['Menu (ici)', 'Modération', 'Modération ++', 'Information', 'Fun', 'Paramètres', 'Configuration', 'Musique', 'Economie', 'Supprimer le message']
                        var val2 = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '❌']
                        filter = (reaction, user) => ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '❌'].includes(reaction.emoji.name) && user.id === message.author.id
                        dureefiltrer = response => { return response.author.id === message.author.id }
                        embed2.setDescription(`**___${val3[0]} :___**\n` + val2.map((i, n) => `\n${i} - \`${val[n]}\``))
                        embed2.setColor(color.yellow)
                        embed2.setFooter('Mxtorie - Les variables entre les <...> sont des variables obligatoires à placer sous une commande, contrairement aux variables entre les [...] qui eux sont facultatives.\nCommandes total : '+totalcmd, 'https://cdn.discordapp.com/attachments/856863306605920267/859431033044336670/Sans_titre-1.png')
                        message.channel.send(embed2).then(async m => {
                            const collector = m.createReactionCollector(filter);
                            collector.on('collect', async r => {
                                switch (r.emoji.name) {
                                    case '0️⃣':
                                        r.users.remove(message.author.id)
                                        embed2.setDescription(`**___${val3[0]} :___**\n` + val2.map((i, n) => `\n${i} - \`${val[n]}\``))
                                        embed2.setColor(color.yellow)
                                        m.edit(embed2)
                                        break;
                                    case '1️⃣':
                                        r.users.remove(message.author.id)
                                        embed2.setDescription(`**___${val3[1]} :___**\n` + modo)
                                        embed2.setColor(color.cyan)
                                        m.edit(embed2)
                                        break;
                                    case '2️⃣':
                                        r.users.remove(message.author.id)
                                        embed2.setDescription(`**___${val3[2]} :___**\n` + modo2)
                                        embed2.setColor(color.red)
                                        m.edit(embed2)
                                        break;
                                    case '3️⃣':
                                        r.users.remove(message.author.id)
                                        embed2.setDescription(`**___${val3[3]} :___**\n` + info)
                                        embed2.setColor(color.green)
                                        m.edit(embed2)
                                        break;
                                    case '4️⃣':
                                        r.users.remove(message.author.id)
                                        embed2.setDescription(`**___${val3[4]} :___**\n` + fun)
                                        embed2.setColor(color.pink)
                                        m.edit(embed2)
                                        break;
                                    case '5️⃣':
                                        r.users.remove(message.author.id)
                                        embed2.setDescription(`**___${val3[5]} :___**\n` + settings)
                                        embed2.setColor(color.purple)
                                        m.edit(embed2)
                                        break;
                                    case '6️⃣':
                                        r.users.remove(message.author.id)
                                        embed2.setDescription(`**___${val3[6]} :___**\n` + setup)
                                        embed2.setColor(color.whitesmoke)
                                        m.edit(embed2)
                                        break;
                                    case '7️⃣':
                                        r.users.remove(message.author.id)
                                        embed2.setDescription(`**___${val3[7]} :___**\n` + music)
                                        embed2.setColor(color.lime)
                                        m.edit(embed2)
                                        break;
                                    case '8️⃣':
                                        r.users.remove(message.author.id)
                                        embed2.setDescription(`**___${val3[8]} :___**\n` + economy)
                                        embed2.setColor(color.lime)
                                        m.edit(embed2)
                                        break;
                                    case '❌':
                                        m.delete().catch(e => { return })
                                        message.delete().catch(e => { return })
                                        break;
                                }
                            })
                            await m.react("0️⃣")
                            await m.react("1️⃣")
                            await m.react("2️⃣")
                            await m.react("3️⃣")
                            await m.react("4️⃣")
                            await m.react("5️⃣")
                            await m.react("6️⃣")
                            await m.react("7️⃣")
                            await m.react("8️⃣")
                            await m.react("❌")
                        })
                    } else {
                        let cmd = client.commands.get(args[0])
                        if (!cmd) cmd = client.commands.find(x => x.help.aliases.includes(args[0]))
                        if (!cmd) return message.channel.send("Cette commande n'existe pas.")
                        let cmdinfo = cmd.help
                        await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdinfo.name], async (error, result) => {
                            if (error) return message.channel.send(lang.error + error)
                            if (result < 1) return message.channel.send(lang.error)
                            let embed3 = new Discord.MessageEmbed()
                            embed3.setAuthor(cmdinfo.name, 'https://cdn.discordapp.com/attachments/856863306605920267/859431033044336670/Sans_titre-1.png')
                            embed3.setDescription(`Alias : **"${cmdinfo.aliases.join("\" | \"")}"**\nDescription : **\`${cmdinfo.desc[0]}\`**\n\n__Utilisation(s)__ : ${cmdinfo.usage.map(i => `\n\`${prefix + i}\``)}\nPermissions bot : \`\`\`${cmdinfo.access_bot.map(i => `\n${i}`)}\`\`\`\nPermission requise : Permission **${result[0].perm}**`)
                            embed3.setColor('RANDOM')
                            embed3.setFooter('Mxtorie - Les variables entre les <...> sont des variables obligatoires à placer sous une commande, contrairement aux variables entre les [...] qui eux sont facultatives.', 'https://cdn.discordapp.com/attachments/856863306605920267/859431033044336670/Sans_titre-1.png')
                            return message.channel.send(embed3)
                        })
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
    name: "help",
    aliases: [`h`, `commands`, `command`, `commande`, `commandes`],
    desc: ["Affiche des aides pour les commandes", "Show you some tips for the commands"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["help [nom d'une commande]"],
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