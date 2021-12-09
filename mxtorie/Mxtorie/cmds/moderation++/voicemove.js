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

                    if (!args[0]) {
                        const channel = message.member.voice.channel;
                        if (!channel) return message.channel.send("Vous n'avez déclarer ni salon de départ, ni salon de destination, vous devez donc être vous aussi dans un salon vocal.")
                        if (message.guild.members.cache.filter(member => member.voice.channel).size > 1) {
                            message.guild.members.cache.forEach(member => {
                                //guard clause, early return
                                if (member.id === message.member.id || !member.voice.channel) return;
                                member.voice.setChannel(channel).catch(e => { return })
                            });
                            message.channel.send("Tout les membres ont été déplacé dans votre vocal.")
                        } else {
                            message.channel.send("Seul vous êtes actuellement dans un salon vocal.")
                        }
                    } else if (args[0] && !args[1]) {
                        if (!message.guild.channels.cache.has(args[0])) return message.channel.send("Ce salon est introuvable.")
                        if (message.guild.channels.cache.get(args[0]).type != 'voice') return message.channel.send("Le salon doit être de type vocal !")
                        const channel = message.guild.channels.cache.get(args[0])
                        if (message.guild.members.cache.filter(member => member.voice.channel).size > 0) {
                            message.guild.members.cache.forEach(member => {
                                //guard clause, early return
                                if (member.id === message.member.id || !member.voice.channel) return;
                                member.voice.setChannel(channel).catch(e => { return })
                            });
                            message.channel.send("Tout les membres ont été déplacé dans le vocal **\`" + channel.name + "\`** (" + channel.id + ").")
                        } else {
                            message.channel.send("Aucun membre ne ce trouve dans un vocal.")
                        }
                    } else if (args[0] && args[1]) {
                        if (!message.guild.channels.cache.has(args[0])) return message.channel.send("Ce salon de départ est introuvable.")
                        if (message.guild.channels.cache.get(args[0]).type != 'voice') return message.channel.send("Le salon de départ doit être de type vocal !")
                        if (!message.guild.channels.cache.has(args[1])) return message.channel.send("Ce salon de destination est introuvable.")
                        if (message.guild.channels.cache.get(args[1]).type != 'voice') return message.channel.send("Le salon de destination doit être de type vocal !")
                        const channel = message.guild.channels.cache.get(args[0])
                        const channel2 = message.guild.channels.cache.get(args[1])
                        if (message.guild.members.cache.filter(member => member.voice.channel ? member.voice.channel.id == channel.id : member.id == "dfgdfgd").size > 0) {
                            message.guild.members.cache.forEach(member => {
                                //guard clause, early return
                                if (member.id === message.member.id || !member.voice.channel || member.voice.channel.id != channel.id) return;
                                member.voice.setChannel(channel2).catch(e => { return })
                            });
                            message.channel.send("Tout les membres ont été déplacé du vocal **\`" + channel.name + "\`** (" + channel.id + ") à **\`" + channel2.name + "\`** (" + channel2.id + ").")
                        } else {
                            message.channel.send("Aucun membre n'est présent dans le salon de départ.")
                        }
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
    name: "voicemove",
    aliases: [`vm`],
    desc: ["Si seul le salon de destination est déclarer alors tout le monde sera déplacer dedans, si celui de départ est déclarer aussi alors seul ceux qui été dedans seront déplacer. Si aucun salon n'est déclarer, tout le monde sera déplacer dans le votre.", "description en"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "MOVE_MEMBERS"],
    usage: ["voicemove", "voicemove <salon d'arriver>", "voicemove <salon de départ> <salon d'arriver>"],
    type: ["Modération ++", "Moderation ++"],
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