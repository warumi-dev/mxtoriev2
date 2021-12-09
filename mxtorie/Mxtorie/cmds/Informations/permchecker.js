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
const yes = '🟢'
const no = '🔴'
const x = "```"
const s = '📬'
const c = '📧'

const permissions2 = [
    'CREATE_INSTANT_INVITE',
    'KICK_MEMBERS',
    'BAN_MEMBERS',
    'ADMINISTRATOR',
    'MANAGE_CHANNELS',
    'MANAGE_GUILD',
    'ADD_REACTIONS',
    'VIEW_AUDIT_LOG',
    'PRIORITY_SPEAKER',
    'STREAM',
    'VIEW_CHANNEL',
    'SEND_MESSAGES',
    'SEND_TTS_MESSAGES',
    'MANAGE_MESSAGES',
    'EMBED_LINKS',
    'ATTACH_FILES',
    'READ_MESSAGE_HISTORY',
    'MENTION_EVERYONE',
    'USE_EXTERNAL_EMOJIS',
    'VIEW_GUILD_INSIGHTS',
    'CONNECT',
    'SPEAK',
    'MUTE_MEMBERS',
    'DEAFEN_MEMBERS',
    'MOVE_MEMBERS',
    'USE_VAD',
    'CHANGE_NICKNAME',
    'MANAGE_NICKNAMES',
    'MANAGE_ROLES',
    'MANAGE_WEBHOOKS',
    'MANAGE_EMOJIS',
]
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
                    let user = message.mentions.members.first() || message.member
                    let userId = user.user.id
                    let description = lang.by == 'by' ? `Server - ${s}\nCurrent channel - ${c}\n\n${s} | ${c}\n` : `Serveur - ${s}\nSalon actuel - ${c}\n\n${s} | ${c}\n`
                    let embed2 = new Discord.MessageEmbed()
                        .setTitle(`${user.user.username} Permissions`)
                        .setColor(user.displayColor)
                    if (lang.by == 'by') {
                        permissions2.forEach(perm => {
                            description += `${user.permissions.has(perm) ? yes : no} | ${message.channel.permissionsFor(userId).has(perm) ? yes : no} - ${perm.replace('CREATE_INSTANT_INVITE', 'Create Invite').replace('KICK_MEMBERS', 'Kick Members').replace('BAN_MEMBERS', 'Ban Members').replace('ADMINISTRATOR', 'Administrator').replace('MANAGE_CHANNELS', 'Manage Channels').replace('MANAGE_GUILD', 'Manage Guild').replace('ADD_REACTIONS', 'Add Reactions').replace('VIEW_AUDIT_LOG', 'View Audit Log').replace('PRIORITY_SPEAKER', 'Priority Speaker').replace('STREAM', 'Stream').replace('VIEW_CHANNEL', 'View Channel').replace('SEND_MESSAGES', 'Send Messages').replace('SEND_TTS_MESSAGES', 'Send TTS Messages').replace('MANAGE_MESSAGES', 'Manage Messages').replace('EMBED_LINKS', 'Embed Links').replace('ATTACH_FILES', 'Attach Files').replace('READ_MESSAGE_HISTORY', 'Read Message History').replace('MENTION_EVERYONE', 'Mention Everyone').replace('USE_EXTERNAL_EMOJIS', 'Use External Emojis').replace('VIEW_GUILD_INSIGHTS', 'View Guild Insights').replace('CONNECT', 'Connect').replace('SPEAK', 'Speak').replace('MUTE_MEMBERS', 'Mute Members').replace('DEAFEN_MEMBERS', 'Defean Members').replace('MOVE_MEMBERS', 'Move Members').replace('USE_VAD', 'Use VAD').replace('CHANGE_NICKNAME', 'Change Nickname').replace('MANAGE_NICKNAMES', 'Manage Nicknames').replace('MANAGE_ROLES', 'Manage Roles').replace('MANAGE_WEBHOOKS', 'Manage Webhooks').replace('MANAGE_EMOJIS', 'Manage Emojis')}\n`
                        })
                    } else {
                        permissions2.forEach(perm => {
                            description += `${user.permissions.has(perm) ? yes : no} | ${message.channel.permissionsFor(userId).has(perm) ? yes : no} - ${perm.replace('CREATE_INSTANT_INVITE', 'Créé une invite').replace('KICK_MEMBERS', 'Exclure des membres').replace('BAN_MEMBERS', 'Ban des members').replace('ADMINISTRATOR', 'Administrateur').replace('MANAGE_CHANNELS', 'Gérer les salons').replace('MANAGE_GUILD', 'Gérer le serveur').replace('ADD_REACTIONS', 'Ajouté des réactions').replace('VIEW_AUDIT_LOG', 'Voir les logs').replace('PRIORITY_SPEAKER', 'Priorité pour parler').replace('STREAM', 'Diffuser en direct').replace('VIEW_CHANNEL', 'Voir les salons').replace('SEND_MESSAGES', 'Envoyé des messages').replace('SEND_TTS_MESSAGES', 'Envoyé des messages TTS').replace('MANAGE_MESSAGES', 'Gérer des messages').replace('EMBED_LINKS', 'Intégrer des liens').replace('ATTACH_FILES', 'Attaché des fichiers').replace('READ_MESSAGE_HISTORY', 'Voir les anciens messages').replace('MENTION_EVERYONE', 'Mentionné Everyone').replace('USE_EXTERNAL_EMOJIS', 'Utilisé des emojis externe').replace('VIEW_GUILD_INSIGHTS', 'Voir les paramètres du serveur').replace('CONNECT', 'Ce connecté').replace('SPEAK', 'Parler').replace('MUTE_MEMBERS', 'Mute des members').replace('DEAFEN_MEMBERS', 'Defean des membres').replace('MOVE_MEMBERS', 'Bouger des members').replace('USE_VAD', 'Utilisé la VAD').replace('CHANGE_NICKNAME', 'Changer de pseudo').replace('MANAGE_NICKNAMES', 'Gérer les pseudos').replace('MANAGE_ROLES', 'Gérer les rôles').replace('MANAGE_WEBHOOKS', 'Gérer les webhooks').replace('MANAGE_EMOJIS', 'Gérer les emojis')}\n`
                        })
                    }
                    embed2.setDescription(x + description + x)
                    embed2.setColor(color.darkcyan)
                    message.channel.send(embed2)
                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

// return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

module.exports.help = {
    name: "permchecker",
    aliases: [`checkerperm`, `checker`],
    desc: ["Montre les permissions d'un membre", "Show permissions of someone"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["permchecker [mention]"],
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