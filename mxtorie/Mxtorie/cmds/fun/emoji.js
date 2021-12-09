const Discord = require("discord.js")
const config = require("../../config.json")
const data = require("../../database.json")
const color = require("../../color.json")
const permissions = require("../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")
const embed4 = require("../../functions/embed/main")
const language = require("../../lang.json")
const logs = require('../../functions/logs/main')
const moment = require('moment')
const axios = require('axios')
getNow = () => { return { time: new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }), }; };

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
 * @param {import("mysql").Connection} database3
*/

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
                            if (!message.guild.roles.cache.has(myrole)) return embed4.simple(client, message, 'Perm kick/ban', message.guild.iconURL({ dynamic: true }), lang.rolebanproblem, color.orangered, message.channel)
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
                        if (!botaccess) return embed4.permissionMissing(client, message, botperm, lang.botpermissionmissing)
                    }
                    lang = language[`${lang2}`]

                    if (!args[0] && args[0] != 'list' && args[0] != 'create' && args[0] != 'delete' && args[0] != 'update' && args[0] != "view") return embed4.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    switch (args[0].toLowerCase()) {
                        case 'list':
                            let emojisListe = message.guild.emojis.cache.map(emojis => emojis.toString());
                            let embed = {
                                title: lang.by == 'by' ? `List of emojis for the guild **${message.guild.name}** | ${emojisListe.length} in total` : `Liste des emojis de **${message.guild.name}** | ${emojisListe.length} au total`,
                                thumbnail: {
                                    url: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                },
                                color: "#7400FF",
                                description: 'Error',
                                fields: [],
                                footer: `${message.guild.name} - Emoji script : Lauryne`
                            };
                            if (emojisListe.join(' ').length > 2048) {
                                let i = '';
                                emojisListe.forEach(emoji => {
                                    if (i.length <= 1024 && i.length + emoji.length > 1024) embed.fields.push({ name: '\u200b', value: i, inline: true });
                                    i = i.concat(' ', emoji);
                                });
                            } else embed.description = emojisListe.join(' ');
                            message.channel.send({ embed });
                            break;
                        case 'create':
                            if ((/\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]/).test(args[2])) return message.channel.send(`Vous ne pouvez pas crée un emojis présent sur discord`);
                            let base64Image;
                            if (args[2] && (/<a?:([a-z0-9-_]+):(\d+)>/gi).test(args[2])) {
                                let extension = args[1].startsWith('<a:') ? '.gif' : '.png';
                                let emoteLink = `https://cdn.discordapp.com/emojis/${args[2].replace('<:', '').replace('<a:', '').replace('>', '').split(':')[1]}${extension}`;
                                let query = await axios({
                                    url: emoteLink,
                                    responseType: 'arraybuffer'
                                }).catch(() => { return });
                                let data = Buffer.from(query.data, 'binary');
                                base64Image = `data:image/${extension.slice(1)};base64,` + data.toString('base64');
                            }
                            let test = Discord.Util.parseEmoji(args[2])
                            let link
                            if(test && !args[2].startsWith('https://') || !args[2].startsWith('http://')&&message.attachments.size<1) link = `https://cdn.discordapp.com/emojis/${test.id}.${test.animated ? 'gif' : 'png'}`
                            if (args[2] && (args[2].startsWith('https://') || args[2].startsWith('http://'))) if(!link) base64Image = args[2];
                            if (!args[2] && message.attachments.first()) if(!link) base64Image = message.attachments.first().url
                            let name = args[1]
                            
                            if (!name) return message.reply(lang.by == 'by' ? "Invalid name !" : "Nom invalide !")
                            if (name.includes(':')) return message.channel.send(lang.by == 'by' ? `Name of emoji *(${name})* is invalid.` : `Nom d'emoji *(${name})* invalide.`)
                            try {
                                emote = await message.channel.guild.emojis.create(link ? link : base64Image, name);
                            } catch (err) {
                                if (err.message.match('String value did not match validation regex')) return message.channel.send(lang.by == 'by' ? `The name is not valid.` : `Le nom n'est pas valide.`);
                                else return message.channel.send(lang.by == 'by' ? `An error has occurred. Please try again.` : `Une erreur est survenue. Merci de ré-essayer.`)
                            }
                            message.channel.send(new Discord.MessageEmbed()
                                .setTitle(`:white_check_mark: ${lang.by == 'by' ? 'Emoji created' : 'Emoji créé'}`)
                                .setColor(config.color)
                                .setThumbnail(`https://cdn.discordapp.com/emojis/${emote.id}${emote.animated ? '.gif' : '.png'}`)
                                .addField(lang.by == 'by' ? `Name :` : `Nom :`, `${emote.name}`, true)
                                .addField(`Emoji :`, `<${emote.animated ? 'a' : ''}:${emote.name}:${emote.id}>`, true)
                                .setTimestamp()
                                .setFooter(message.guild.name));
                            break;
                        case 'update':
                            if (!args[1]) return message.channel.send(lang.by == 'by' ? 'Old name invalid' : "Ancien nom invalide")
                            let emoji = await message.guild.emojis.cache.find(e => e.name = args[1]);
                            if (!emoji) return message.channel.send(lang.by == 'by' ? `Emoji not found.` : `Emoji introuvable`)
                            if (!args[2]) return message.channel.send(lang.by == 'by' ? 'New name invalid' : 'Nouveau nom invalide')
                            else {
                                emoji.edit({
                                    name: `${args.slice(2).join(' ').toLowerCase()}`
                                })
                                message.channel.send(new Discord.MessageEmbed()
                                    .setTitle(lang.by == 'by' ? `Emoji update` : `Emoji modifié`)
                                    .setColor(config.color)
                                    .setThumbnail(`https://cdn.discordapp.com/emojis/${emoji.id}${emoji.animated ? '.gif' : '.png'}`)
                                    .addField(`Action :`, lang.by == 'by' ? `Update` : `Modification`, true)
                                    .addField(lang.by == 'by' ? `Old name :` : `Ancien nom :`, `${emoji.name}`, true)
                                    .addField(lang.by == 'by' ? `New name :` : `Nouveau nom :`, `${args[2]}`, true)
                                    .setTimestamp()
                                    .setFooter(message.guild.name))
                            }
                            break;
                        case 'delete':
                            let emojiToDelete = await message.guild.emojis.cache.find(e => e.name = args[1]);
                            if (!emojiToDelete) return message.channel.send(lang.by == 'by' ? `Emoji not found.` : `Emoji introuvable`)
                            else {
                                emojiToDelete.delete()
                                message.channel.send(new Discord.MessageEmbed()
                                    .setTitle(lang.by == 'by' ? 'Emoji delete' : "Emoji supprimé")
                                    .setColor(config.color)
                                    .setThumbnail(`https://cdn.discordapp.com/emojis/${emojiToDelete.id}${emojiToDelete.animated ? '.gif' : '.png'}`)
                                    .addField(`Action :`, lang.by == 'by' ? `Delete` : `Suppression`, true)
                                    .addField(lang.by == 'by' ? `Name :` : `Nom :`, `${emojiToDelete.name}`, true)
                                    .setTimestamp()
                                    .setFooter(message.guild.name))
                            }
                            break;
                        case 'view':
                            let emoteID = await args[1].trim().replace('<:', '').replace('<a:', '').replace('>', '').split(':')[1];
                            if (!emoteID) return message.channel.send(lang.by == 'by' ? `Emoji not found.` : `Emoji introuvable.`);
                            let emoteURL = `https://cdn.discordapp.com/emojis/${emoteID}${args[0].startsWith('<a:') ? '.gif' : '.png'}`;
                            message.channel.send(new Discord.MessageEmbed()
                                .setTitle('Emoji view')
                                .setColor(config.color)
                                .setImage(emoteURL)
                                .setTimestamp()
                                .setFooter(message.guild.name))
                            break;
                    }

                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

// return embed4.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

module.exports.help = {
    name: "emoji",
    aliases: [`emj`],
    desc: ["Ajoute ou supprime un emoji", "Add or delete an emoji"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_EMOJIS"],
    usage: ["emoji list", "emoji create <nom> <emoji/lien/photo>", "emoji update <ancien nom> <nouveau nom>", "emoji delete <nom>", "emoji view <emoji>"],
    type: ["Fun", "Fun"],
    perm: "2"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, '2']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}