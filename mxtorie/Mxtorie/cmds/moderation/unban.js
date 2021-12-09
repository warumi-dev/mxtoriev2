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
const { sanctions } = require("../../functions/logs/main")
const logs = require('../../functions/logs/main')
const { sleep } = require('ultrax')
getNow = () => { return { time: new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }), }; };
module.exports.run = async (client, message, args, prefix, perm, whitelisted, database, database2, lang) => {
    try {
        await CmdExist(database, message, this.help.name).then(async () => {
            await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, this.help.name], async (error, result) => {
                var canaccess = false
                var perm = result[0].perm
                try {
                    if (!result[0]) canaccess = true

                    await database.query("SELECT * FROM roles WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
                        if (error || result < 1) return message.reply(lang.undefinederror)
                        let myrole = result[0].ban
                        if (!message.guild.roles.cache.has(myrole)) return embed.simple(client, message, 'Perm kick/ban', message.guild.iconURL({ dynamic: true }), language[lang].rolebanproblem, color.orangered, message.channel)
                        let pban = message.guild.roles.cache.get(myrole).name
                        if (message.member.roles.cache.has(myrole)) canaccess = true
                        if (!canaccess) return message.channel.send(language[lang].permissionmissing + `**\`perm ${perm} minimum\`**`)
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

                        if (!args[0] || isNaN(args[0]) || args[0].length != 18) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        message.guild.fetchBans().then(bans => {
                            let member = bans.get(args[0])
                            if (!member) return embed.simple(client, message, false, false, `<@${args[0]}> ${lang.notbanned}`, color.red, message.channel)
                            message.guild.members.unban(args[0])
                            var unban = lang.unban
                            unban = unban.replace('[member]', `<@${args[0]}>`)
                            embed.simple(client, message, false, false, unban, color.green, message.channel)
                            logs.sanctions(client, message, database, 'Unban', lang.unbanlogs, args[0], null, color.orange, lang, message.author, 'sanctions')
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
    name: "unban",
    aliases: [`free`],
    desc: ["Révoque le bannissement d'un utilisateur", "Unban a membre from the server"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "BAN_MEMBERS"],
    usage: ["unban <id>"],
    type: ["Modération", "Moderation"],
    perm: "kick/ban"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, 'kick/ban']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}