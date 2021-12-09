const Canvas = require('canvas')
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
					let cani = db.fetch(`love_${message.guild.id}`)
                    if(cani) return message.reply("Commande sous cooldown.")
                    db.set(`love_${message.guild.id}`, true)
                    setTimeout(async() => {
                        db.set(`love_${message.guild.id}`, false)
                    }, 5000)

                    const canvas = Canvas.createCanvas(700, 250)
                    const ctx = canvas.getContext("2d")

                    const target = message.mentions.users.first()
                    if (!target) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    if (target.id == message.author.id) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

                    const bg = await Canvas.loadImage("https://cdn.discordapp.com/attachments/716216765448978504/858442843197669376/PElrfiWeuvQ.png")
                    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

                    const avatar = await Canvas.loadImage(message.author.displayAvatarURL({ format: 'png' }))
                    ctx.drawImage(avatar, 100, 25, 200, 200)

                    const TargetAvatar = await Canvas.loadImage(target.displayAvatarURL({ format: "png" }))
                    ctx.drawImage(TargetAvatar, 400, 25, 200, 200)


                    const heart = await Canvas.loadImage('https://cdn.discordapp.com/attachments/716216765448978504/858607217728159744/unknown.png')
                    const broken = await Canvas.loadImage('https://cdn.discordapp.com/attachments/716216765448978504/858607537238179840/unknown.png')
                    const random = Math.floor(Math.random() * 99) + 1

                    if (random >= 50) {
                        ctx.drawImage(heart, 275, 60, 150, 150)
                        const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'love.png')
                        const embed2 = new Discord.MessageEmbed()
                            .setDescription(`:twisted_rightwards_arrows: ${message.author.username} + ${target.username} = ${random}%`)
                            .attachFiles(attachment)
                            .setImage(`attachment://love.png`)
                            .setColor("GREEN")
                        return message.channel.send(embed2)

                    } else {
                        ctx.drawImage(broken, 275, 60, 150, 150)
                        const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'broken.png')
                        const embed2 = new Discord.MessageEmbed()
                            .setDescription(`:twisted_rightwards_arrows: ${message.author.username} + ${target.username} = ${random}%`)
                            .attachFiles(attachment)
                            .setImage(`attachment://broken.png`)
                            .setColor("RED")
                        return message.channel.send(embed2)

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
    name: "love",
    aliases: [`lc`],
    desc: ["Donne un pourcentage d'amour aléatoire avec un autre membre", "Give you a random love percent with an other member"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["love <mention>"],
    type: ["Fun", "Fun"],
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