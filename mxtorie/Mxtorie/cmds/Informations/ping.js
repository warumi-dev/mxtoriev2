const Discord = require("discord.js")
const config = require("../../config.json")
const data = require("../../database.json")
const color = require("../../color.json")
const permissions = require("../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")
const embed = require("../../functions/embed/main.js")
const language = require("../../lang.json")

module.exports.run = async (client, message, args, prefix, perm, whitelisted, database, database2, lang) => {
    try {
        await CmdExist(database, message, this.help.name).then(async() => {
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
                if (result[0].perm == 'whitelist') if(whitelisted) canaccess = true
                if (result[0].perm == 'owner') if(config.owners.includes(message.author.id) || config.buyer==message.author.id || config.creator==message.author.id) canaccess = true
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
            } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            try {
                let msg = await message.channel.send(lang.search + "...")
                let ping = client.ws.ping - 85
                let api = msg.createdAt - message.createdAt - 140
                return await embed.ping(client, message, ping, api, lang, msg).catch(e => console.log(this.help.name.toUpperCase() + " : " + e))
            } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
        })
    })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

module.exports.help = {
    name: "ping",
    aliases: [`speed`],
    desc: ["Obtenir le temps de réaction du bot et de l'api", "Get the reaction time of the bot and the api"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["ping"],
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