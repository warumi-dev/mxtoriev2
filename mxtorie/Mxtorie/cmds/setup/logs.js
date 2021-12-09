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

var msgwait
var sanctionlogs
var channelslogs
var rolelogs
var ticketlogs
var welcomelogs
var protectionslogs
var vocallogs
var msglogs

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

                    filter = (reaction, user) => ['📥', '🔊', '👤', '⚔️', '💭', '🛡️', '📃', '🎫'].includes(reaction.emoji.name) && user.id === message.author.id,
                        dureefiltrer = response => { return response.author.id === message.author.id };
                    msgwait = await message.channel.send(lang.by == 'by' ? 'Please wait the time to add all reactions.' : 'Veuillez attendre la fin de l\'ajout des réactions.')

                    await Promise.all(['📥', '🔊', '👤', '⚔️', '💭', '🛡️', '📃', '🎫'].map(r => msgwait.react(r)))
                    await updateEmbed(message, database)
                    const filterReaction = (reaction, user) => user.id === message.author.id && !user.bot
                    const filterMessage = (m) => m.author.id === message.author.id && !m.author.bot
                    const collectorReaction = await new Discord.ReactionCollector(msgwait, filterReaction)
                    collectorReaction.on('collect', async reaction => {
                        try {
                            switch (reaction.emoji.name) {
                                case '📥':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 📥 Quel sera le salon pour les logs des nouveaux arrivant/départs ? \`false\` = désactiver`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (msg.content != 'false') {
                                                    let mention = message.mentions.channels.first()
                                                    if (mention) mention = mention.id
                                                    if (!mention) if (message.guild.channels.cache.has(msg.content)) mention = msg.content
                                                    msg.delete().catch(e => { return })
                                                    if (!message.guild.channels.cache.has(mention)) return message.channel.send("❌ - Salon invalide").then(m => { m.delete({ timeout: 3000 }); msg.delete().catch(e => { return }) })
                                                    database.query("UPDATE channels SET welcomelogs = ? WHERE serverid = ?", [mention, message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les nouveaux arrivant/départs est : <#" + mention + ">.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                    
                                                } else {
                                                    msg.delete().catch(e => { return })
                                                    database.query("UPDATE channels SET welcomelogs = ? WHERE serverid = ?", ["-", message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les nouveaux arrivant/départs a bien été désactiver.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                }
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre.") })
                                    })
                                    break;
                                case '🔊':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 🔊 Quel sera le salon pour les logs des vocaux ? \`false\` = désactiver`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (msg.content != 'false') {
                                                    let mention = msg.mentions.channels.first()
                                                    if (mention) mention = mention.id
                                                    if (!mention) if (message.guild.channels.cache.has(msg.content)) mention = msg.content
                                                    msg.delete().catch(e => { return })
                                                    if (!message.guild.channels.cache.has(mention)) return message.channel.send("❌ - Salon invalide").then(m => { m.delete({ timeout: 3000 }); msg.delete().catch(e => { return }) })
                                                    database.query("UPDATE channels SET vocal = ? WHERE serverid = ?", [mention, message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les vocaux est : <#" + mention + ">.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                   
                                                } else {
                                                    msg.delete().catch(e => { return })
                                                    database.query("UPDATE channels SET vocal = ? WHERE serverid = ?", ["-", message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les vocaux a bien été désactiver.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                }
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre."+err) })
                                    })
                                    break;
                                case '👤':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 👤 Quel sera le salon pour les logs des rôles ? \`false\` = désactiver`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (msg.content != 'false') {
                                                    let mention = message.mentions.channels.first()
                                                    if (mention) mention = mention.id
                                                    if (!mention) if (message.guild.channels.cache.has(msg.content)) mention = msg.content
                                                    msg.delete().catch(e => { return })
                                                    if (!message.guild.channels.cache.has(mention)) return message.channel.send("❌ - Salon invalide").then(m => { m.delete({ timeout: 3000 }); msg.delete().catch(e => { return }) })
                                                    database.query("UPDATE channels SET roles = ? WHERE serverid = ?", [mention, message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les rôles est : <#" + mention + ">.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                    //msg.delete().catch(e => { return })
                                                } else {
                                                    msg.delete().catch(e => { return })
                                                    database.query("UPDATE channels SET roles = ? WHERE serverid = ?", ["-", message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les rôles a bien été désactiver.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                }
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre.") })
                                    })
                                    break;
                                case '⚔️':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` ⚔️ Quel sera le salon pour les logs des sanctions ? \`false\` = désactiver`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (msg.content != 'false') {
                                                    let mention = message.mentions.channels.first()
                                                    if (mention) mention = mention.id
                                                    if (!mention) if (message.guild.channels.cache.has(msg.content)) mention = msg.content
                                                    msg.delete().catch(e => { return })
                                                    if (!message.guild.channels.cache.has(mention)) return message.channel.send("❌ - Salon invalide").then(m => { m.delete({ timeout: 3000 }); msg.delete().catch(e => { return }) })
                                                    database.query("UPDATE channels SET sanctions = ? WHERE serverid = ?", [mention, message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les sanctions est : <#" + mention + ">.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                    //msg.delete().catch(e => { return })
                                                } else {
                                                    msg.delete().catch(e => { return })
                                                    database.query("UPDATE channels SET sanctions = ? WHERE serverid = ?", ["-", message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les sanctions a bien été désactiver.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                }
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre.") })
                                    })
                                    break;
                                case '💭':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 💭 Quel sera le salon pour les logs des messages ? \`false\` = désactiver`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (msg.content != 'false') {
                                                    let mention = message.mentions.channels.first()
                                                    if (mention) mention = mention.id
                                                    if (!mention) if (message.guild.channels.cache.has(msg.content)) mention = msg.content
                                                    msg.delete().catch(e => { return })
                                                    if (!message.guild.channels.cache.has(mention)) return message.channel.send("❌ - Salon invalide").then(m => { m.delete({ timeout: 3000 }); msg.delete().catch(e => { return }) })
                                                    database.query("UPDATE channels SET messages = ? WHERE serverid = ?", [mention, message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les messages est : <#" + mention + ">.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                    msg.delete().catch(e => { return })
                                                } else {
                                                    msg.delete().catch(e => { return })
                                                    database.query("UPDATE channels SET messages = ? WHERE serverid = ?", ["-", message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les messages a bien été désactiver.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                }
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre.") })
                                    })
                                    break;
                                case '🛡️':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 🛡️ Quel sera le salon pour les logs des protections ? \`false\` = désactiver`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (msg.content != 'false') {
                                                    let mention = message.mentions.channels.first()
                                                    if (mention) mention = mention.id
                                                    if (!mention) if (message.guild.channels.cache.has(msg.content)) mention = msg.content
                                                    msg.delete().catch(e => { return })
                                                    if (!message.guild.channels.cache.has(mention)) return message.channel.send("❌ - Salon invalide").then(m => { m.delete({ timeout: 3000 }); msg.delete().catch(e => { return }) })
                                                    database.query("UPDATE channels SET protections = ? WHERE serverid = ?", [mention, message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les protections est : <#" + mention + ">.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                    //msg.delete().catch(e => { return })
                                                } else {
                                                    msg.delete().catch(e => { return })
                                                    database.query("UPDATE channels SET protections = ? WHERE serverid = ?", ["-", message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les protections a bien été désactiver.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                }
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre.") })
                                    })
                                    break;
                                case '📃':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 📃 Quel sera le salon pour les logs des salons ? \`false\` = désactiver`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (msg.content != 'false') {
                                                    let mention = message.mentions.channels.first()
                                                    if (mention) mention = mention.id
                                                    if (!mention) if (message.guild.channels.cache.has(msg.content)) mention = msg.content
                                                    msg.delete().catch(e => { return })
                                                    if (!message.guild.channels.cache.has(mention)) return message.channel.send("❌ - Salon invalide").then(m => { m.delete({ timeout: 3000 }); msg.delete().catch(e => { return }) })
                                                    database.query("UPDATE channels SET channel = ? WHERE serverid = ?", [mention, message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les salons est : <#" + mention + ">.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                    //msg.delete().catch(e => { return })
                                                } else {
                                                    msg.delete().catch(e => { return })
                                                    database.query("UPDATE channels SET channel = ? WHERE serverid = ?", ["-", message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les salons a bien été désactiver.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                }
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre.") })
                                    })
                                    break;
                                case '🎫':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 🎫 Quel sera le salon pour les logs des tickets ? \`false\` = désactiver`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (msg.content != 'false') {
                                                    let mention = message.mentions.channels.first()
                                                    if (mention) mention = mention.id
                                                    if (!mention) if (message.guild.channels.cache.has(msg.content)) mention = msg.content
                                                    msg.delete().catch(e => { return })
                                                    if (!message.guild.channels.cache.has(mention)) return message.channel.send("❌ - Salon invalide").then(m => { m.delete({ timeout: 3000 }); msg.delete().catch(e => { return }) })
                                                    database.query("UPDATE channels SET ticketslogs = ? WHERE serverid = ?", [mention, message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les tickets est : <#" + mention + ">.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                    //msg.delete().catch(e => { return })
                                                } else {
                                                    msg.delete().catch(e => { return })
                                                    database.query("UPDATE channels SET ticketslogs = ? WHERE serverid = ?", ["-", message.guild.id])
                                                    message.channel.send("✅ - Le salon des logs pour les tickets a bien été désactiver.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    updateEmbed(message, database)
                                                }
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre.") })
                                    })
                                    break;
                                    
                            }
                        } catch (err) { return }
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
    name: "logs",
    aliases: [`log`],
    desc: ["Assigne les salons des logs", "Assign channels for logs"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["logs"],
    type: ["Configuration", "Setup"],
    perm: "owner"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, 'owner']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}

async function updateEmbed(message, database) {
    database.query("SELECT * FROM channels WHERE serverid = ?", message.guild.id, async (error, result) => {
        sanctionlogs = result[0].sanctions
        welcomelogs = result[0].welcomelogs
        vocallogs = result[0].vocal
        rolelogs = result[0].roles
        channelslogs = result[0].channel
        msglogs = result[0].messages
        protectionslogs = result[0].protections
        ticketlogs = result[0].ticketslogs
        if (!message.guild.channels.cache.find(c => c.id === sanctionlogs)) sanctionlogs = false
        if (!message.guild.channels.cache.find(c => c.id === welcomelogs)) welcomelogs = false
        if (!message.guild.channels.cache.find(c => c.id === vocallogs)) vocallogs = false
        if (!message.guild.channels.cache.find(c => c.id === rolelogs)) rolelogs = false
        if (!message.guild.channels.cache.find(c => c.id === channelslogs)) channelslogs = false
        if (!message.guild.channels.cache.find(c => c.id === msglogs)) msglogs = false
        if (!message.guild.channels.cache.find(c => c.id === protectionslogs)) protectionslogs = false
        if (!message.guild.channels.cache.find(c => c.id === ticketlogs)) ticketlogs = false
        let embed2 = new Discord.MessageEmbed()
            .setTitle("📚 Salon des logs")
            .addField("`📥` Logs des entrée/sortie", welcomelogs ? `<#${welcomelogs}>` : "-", true)
            .addField("`🔊` Logs vocaux", vocallogs ? `<#${vocallogs}>` : "-", true)
            .addField("`👤` Logs des rôles", rolelogs ? `<#${rolelogs}>` : "-", true)
            .addField("`⚔️` Logs des sanctions", sanctionlogs ? `<#${sanctionlogs}>` : "-", true)
            .addField("`💭` Logs messages", msglogs ? `<#${msglogs}>` : "-", true)
            .addField("`🛡️` Logs protections", protectionslogs ? `<#${protectionslogs}>` : "-", true)
            .addField("`📃` Logs des salons", channelslogs ? `<#${channelslogs}>` : "-", true)
            .addField("`🎫` Logs des tickets", ticketlogs ? `<#${ticketlogs}>` : "-", true)
            .setColor('RANDOM')
            .setFooter(message.guild.name + ' - ' + 'Mxtorie')
        return msgwait.edit(embed2)
    })
}