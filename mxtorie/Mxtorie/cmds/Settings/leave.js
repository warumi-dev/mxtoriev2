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

                let guild = args[0]
                if (!guild && !message.guild) return embed.simple(client, message, "Serveur introuvable", client.user.displayAvatarURL({ dynamic: true }), "Je ne suis pas sur ce serveur. Merci de préciser un ID valable.", color.red, message.channel)
                if (!guild) guild = message.guild.id
                if (!client.guilds.cache.has(guild)) return embed.simple(client, message, "Serveur introuvable", client.user.displayAvatarURL({ dynamic: true }), "Je ne suis pas sur ce serveur. Merci de préciser un ID valable.", color.red, message.channel)
                const myguild = client.guilds.cache.get(guild)
                filter = (reaction, user) => ['🕙', '🏷️', '🕵️', '🎁', '✅'].includes(reaction.emoji.name) && user.id === message.author.id,
                    dureefiltrer = response => { return response.author.id === message.author.id };
                message.channel.send(`\`${getNow().time}\` ⚠️ Voulez-vous vraiment que je quitte **${myguild.name}** ? \`oui\` ou \`non\``).then(mp => {
                    mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                        .then(async cld => {
                            var msg = cld.first();
                            msg = msg.content.toLowerCase()
                            if (msg != 'oui') return mp.delete().catch(e => { return })
                            message.channel.send("Je quitte **" + myguild.name + "**").catch(e => { })
                            client.users.cache.get(config.buyer).send(`Je viens de quitté **${myguild.name}** sous l'ordre de ${message.author}(${message.author.tag} / ${message.author.id}).`).catch(e => { })
                            myguild.leave().catch(e => { return client.users.cache.get(config.buyer).send(`Une erreur est survenue lorsque j'ai voulu quitté **${myguild.name}** : \`${e}\``) })
                        }).catch(e => { return message.channel.send("Vous avez mis trop de temps à répondre.").then(m => m.delete({ timeout: 3000 }).catch(e => { return })) })
                })
            } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

module.exports.help = {
    name: "leave",
    aliases: [`quit`],
    desc: ["Fait quitter le bot d'un serveur", "The bot leave the server"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["leave", "leave <id d'un serveur>"],
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