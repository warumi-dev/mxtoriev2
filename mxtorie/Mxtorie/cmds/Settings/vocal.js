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
*/

module.exports.run = async (client, message, args, prefix, perm, whitelisted, database, database2, lang) => {
    try {
        await CmdExist(database, message, this.help.name)
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
                if (!args[0] || args[0] != "join" && args[0] != "leave" && args[0] != "autoconnect") return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                switch (args[0]) {
                    case 'join':
                        try {
                            let channel = args[1]
                            if (!channel || isNaN(channel) || channel.length != 18) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                            channel = message.guild.channels.cache.find(c => c.id === channel)
                            if (!channel) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                            if (channel.type != 'voice') return embed.simple(client, message, 'Vocal', message.guild.iconURL({ dynamic: true }), "Le salon doit être de type **vocal**.", color.red, message.channel)
                            channel.join().then(async () => {
                                return embed.simple(client, message, "Vocal", message.guild.iconURL({ dynamic: true }), "Je viens de rejoindre le salon vocal !", color.green, message.channel)
                            }).catch(e => {
                                return message.channel.send("Erreur : " + e)
                            })
                        } catch (err) { return }
                        break;
                    case 'leave':
                        try {
                            if (!message.guild.me.voice.channel) return embed.simple(client, message, "Vocal", message.guild.iconURL({ dynamic: true }), "Je ne suis pas dans un salon vocal !", color.red, message.channel)
                            message.guild.me.voice.channel.leave()
                            return embed.simple(client, message, "Vocal", message.guild.iconURL({ dynamic: true }), "Je viens de quitté le salon vocal !", color.cyan, message.channel)
                        } catch (err) { return }
                        break;
                    case 'autoconnect':
                        try {
                            if (!message.guild.me.voice.channel) return embed.simple(client, message, "Vocal", message.guild.iconURL({ dynamic: true }), "Je ne suis pas dans un salon vocal !", color.red, message.channel)
                            if (!args[1] || args[1] != 'on' && args[1] != 'off') return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                            switch (args[1]) {
                                case "on":
                                    try {
                                        db.set(`autoconnect_${message.guild.id}`, message.guild.me.voice.channelID)
                                        return embed.simple(client, message, "Vocal", message.guild.iconURL({ dynamic: true }), "Après un redémarrage je me connecterai toujours à ce vocal.", color.green, message.channel)
                                    } catch (err) { return }
                                    break;
                                case 'off':
                                    try {
                                        db.set(`autoconnect_${message.guild.id}`, false)
                                        return embed.simple(client, message, "Vocal", message.guild.iconURL({ dynamic: true }), "La connexion automatique à un vocal a été désactiver.", color.orange, message.channel)
                                    } catch (err) { return }
                                    break;
                            }
                        } catch (err) { return }
                        break;
                }
            } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

module.exports.help = {
    name: "vc",
    aliases: [`voc`, `connect`],
    desc: ["Permet de connecter le bot à un salon vocal", "Connect the bot to a voice channel"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "CONNECT"],
    usage: ["vc join <id d'un salon>", "vc leave", "vc autoconnect <on/off>"],
    type: ["Paramètres", "Settings"],
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