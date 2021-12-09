const usersSpamMap = new Map();
const sanction = require('../../db/main')
const logs = require('../../logs/main')
const color = require('../../../color.json')
const config = require('../../../config.json')
const Discord = require('discord.js')
module.exports = async (client, message, lang, haveperm, database) => {
    //console.log('anti spam')
    if (!message) return
    if (!message.member) return
    //if (message.author.bot) return
    if (message.author.id == client.user.id || message.author.id == '668381000254095370') return
    if (!message.channel) return
    if (haveperm) return
    await database.query("SELECT * FROM spamchan WHERE serverid = ? AND channel = ?", [message.guild.id, message.channel.id], async function (error, result, fields) {
        if (error) return
        if (result.length != 0) return
        await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            if (result[0].spam == 'off') return
            let level = result[0].spamlevel
            let warned = 3
            let kicked = 5
            if (level == 'low') {
                warned = 8
                kicked = 10
            } else if (level == 'medium') {
                warned = 6
                kicked = 8
            } else if (level == 'agressive') {
                warned = 3
                kicked = 5
            } else if (!level) {
                return
            } else { return console.log('Error with the anti-spam in : ' + message.guild.name) }
            await database.query("SELECT * FROM spamchan WHERE serverid = ? AND channel = ?", [message.guild.id, message.channel.id], async function (error, result, fields) {
                if (error) return
                if (result > 0) return
                await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async (error, result, fields) => {
                    if (result[0]) return
                    if (config.owners.includes(message.author.id) || message.guild.ownerID == message.author.id) return
                    if (usersSpamMap.has(message.author.id)) {
                        const data = usersSpamMap.get(message.author.id)
                        const { lastmsg, timer } = data;
                        const diff = message.createdTimestamp - lastmsg.createdTimestamp;
                        let msgs = data.msgs
                        if (diff > 5000) {
                            clearTimeout(timer);
                            data.msgs = 1;
                            data.lastmsg = message;
                            data.timer = setTimeout(() => {
                                usersSpamMap.delete(message.author.id);
                            }, 5000)
                            usersSpamMap.set(message.author.id, data)
                        } else {
                            ++msgs;
                            switch (msgs) {
                                case warned:
                                    message.reply(lang.sendmsgtoofast)
                                    break;
                                case kicked:
                                    let member = message.member
                                    let reason = "spam"
                                    /*let embed = new Discord.MessageEmbed()
                                    embed.setTitle("Kick")
                                    embed.setDescription(`${message.member} ${lang.hasbeenkicked} \`${reason}\` ${lang.by} ${client.user}`)
                                    embed.setColor(config.color.red)
                                    embed.setTimestamp()
                                    log(message, 'sanction', embed, database)**/
                                    logs.sanctions(client, message, database, 'Anti-spam', lang.antispam, message.author.id, 'spam', color.red, lang, client.user, 'protections')
                                    sanction.sanctions(client, message, message.author.id, 'kick', 'spam', client.user, database)
                                    message.channel.send(`${message.member} ${lang.hasbeenkicked} \`${reason}\``)
                                    if (message.member.kickable) {
                                        message.member.send(lang.by == 'by' ? `You has been kick from \`${message.guild.name}\` for **spaming**.` : `Vous avez été exclu de \`${message.guild.name}\` pour **spam**.`).catch(e => { })
                                        message.member.kick({ reason: 'spamming, kick by Mxtorie' })
                                        message.channel.messages.fetch({ limit: 100 }).then((messages) => {
                                            const botMessages = [];
                                            messages.filter(m => m.author.id === message.author.id).forEach(msg => botMessages.push(msg))
                                            message.channel.bulkDelete(botMessages).catch(e => { return })

                                        })
                                    }
                                    break;
                            }
                            data.msgs = msgs;
                            usersSpamMap.set(message.author.id, data)
                        }
                    } else {
                        let remove = setTimeout(() => {
                            usersSpamMap.delete(message.author.id);
                        }, 5000)
                        usersSpamMap.set(message.author.id, {
                            msgs: 1,
                            lastmsg: message,
                            timer: remove
                        })
                    }
                })
            })
        })
    })
}