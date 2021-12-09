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

                    if (!args[0] || args[0] != 'add' && args[0] != 'remove') return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    let massrole = db.fetch(`massrole`)
                    if (massrole == true) return embed.simple(client, message, 'Massrole', message.guild.iconURL({ dynamic: true }), lang.by == 'by' ? "❌ - I already doing a massrole, please wait the end." : "❌ - Je suis déjà entrain d'effectué un massrole, merci d'attendre la fin.", color.red, message.channel)
                    let mention = message.mentions.roles.first()
                    if (mention) mention = mention.id
                    if (!mention) mention = args[1]
                    if (!mention || isNaN(mention) || mention.length != 18) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    if (!message.guild.roles.cache.has(mention)) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    let membern
                    switch (args[0]) {
                        case 'add':
                            let cani = db.fetch(`massrole`)
                            if (cani) return message.channel.send("Un massrole est déjà en cours.")
                            db.set(`massrole`, true)
                            membern = await message.guild.members.cache.filter(m => !m.roles.cache.has(mention)).size
                            if (membern == 0) return db.set(`massrole`, false)
                            let statadded = membern
                            logs.sanctions(client, message, database, 'Massrole', lang.massrolestartedadded, message.guild.name, false, color.darkorange, lang, message.author, 'roles', false, false, mention)
                            embed.simple(client, message, 'Massrole', message.guild.iconURL({ dynamic: true }), lang.by == 'by' ? `Addind <@&${mention}> to **${statadded} members**.` : `Ajout de <@&${mention}> à **${statadded} membres.**`, color.green, message.channel)
                            /*if (membern == 0) {
                                db.set(`massrole`, false)
                                return embed.simple(client, message, 'Massrole', message.guild.iconURL({ dynamic: true }), lang.by == 'by' ? `Addind <@&${mention}> to **${statadded} members** __finish__.` : `Ajout de <@&${mention}> à **${statadded} membres.** __terminé__`, color.green, message.channel)
                            }*/
                            message.guild.members.cache.filter(m => !m.roles.cache.has(mention)).forEach(m => {
                                membern = membern - 1
                                if (m) m.roles.add(mention).catch(e => { })
                                if (membern == 2) {
                                    try {
                                        db.set(`massrole`, false)
                                        return embed.simple(client, message, 'Massrole', message.guild.iconURL({ dynamic: true }), lang.by == 'by' ? `Addind <@&${mention}> to **${statadded} members** __finish__.` : `Ajout de <@&${mention}> à **${statadded} membres.** __terminé__`, color.green, message.channel)
                                    } catch (err) { return }
                                }
                            })
                            break;
                        case 'remove':
                            let cani2 = db.fetch(`massrole`)
                            if (cani2) return message.channel.send("Un massrole est déjà en cours.")
                            db.set(`massrole`, true)
                            membern = await message.guild.members.cache.filter(m => m.roles.cache.has(mention)).size
                            if (membern < 3) return db.set(`massrole`, false)
                            let statremove = membern
                            logs.sanctions(client, message, database, 'Massrole', lang.massrolestartedremoved, message.guild.name, false, color.darkorange, lang, message.author, 'roles', false, false, mention)
                            embed.simple(client, message, 'Massrole', message.guild.iconURL({ dynamic: true }), lang.by == 'by' ? `Removing <@&${mention}> to **${membern} members**.` : `Retrait de <@&${mention}> à **${membern} membres.**`, color.green, message.channel)
                            /*if (membern == 0) {
                                db.set(`massrole`, false)
                                return embed.simple(client, message, 'Massrole', message.guild.iconURL({ dynamic: true }), lang.by == 'by' ? `Removing <@&${mention}> to **${statremove} members** __finish__.` : `Retrait de <@&${mention}> à **${statremove} membres.** __terminé__`, color.green, message.channel)
                            }*/
                            message.guild.members.cache.filter(m => m.roles.cache.has(mention)).forEach(m => {
                                membern = membern - 1
                                if (m) m.roles.remove(mention).catch(e => { })
                                if (membern == 2) {
                                    try {
                                        db.set(`massrole`, false)
                                        return embed.simple(client, message, 'Massrole', message.guild.iconURL({ dynamic: true }), lang.by == 'by' ? `Removing <@&${mention}> to **${statremove} members** __finish__.` : `Retrait de <@&${mention}> à **${statremove} membres.** __terminé__`, color.green, message.channel)
                                    } catch (err) { return }
                                }
                            })
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
    name: "massrole",
    aliases: [`mass`],
    desc: ["Ajoute/retire un rôle à tout le monde", "Add/remove a role to everyone"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_ROLES"],
    usage: ["massrole add <rôle/id>", "massrole remove <rôle/id>"],
    type: ["Modération ++", "Moderation ++"],
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