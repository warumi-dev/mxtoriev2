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

var msgwait

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

                    filter = (reaction, user) => ['👤', '🔊', '✅', '⭐', '👥', '🔉', '🌟', '📝'].includes(reaction.emoji.name) && user.id === message.author.id,
                        dureefiltrer = response => { return response.author.id === message.author.id };
                    msgwait = await message.channel.send(lang.by == 'by' ? 'Please wait the time to add all reactions.' : 'Veuillez attendre la fin de l\'ajout des réactions.')

                    await Promise.all(['👤', '🔊', '✅', '⭐', '👥', '🔉', '🌟', '📝'].map(r => msgwait.react(r)))
                    await updateEmbed(message, database)
                    const filterReaction = (reaction, user) => user.id === message.author.id && !user.bot
                    const filterMessage = (m) => m.author.id === message.author.id && !m.author.bot
                    const collectorReaction = await new Discord.ReactionCollector(msgwait, filterReaction)
                    collectorReaction.on('collect', async reaction => {
                        try {
                            let chan
                            let format
                            switch (reaction.emoji.name) {
                                case '👤':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 👤 Quel sera le salon **vocal** pour le compteur de membre ? \`false\` = désactiver`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (msg.content != 'false') {
                                                    if (!message.guild.channels.cache.has(msg.content)) return message.channel.send("Ce salon n'existe pas.").then(m => {
                                                        msg.delete().catch(e => { })
                                                        return m.delete({ timeout: 3000 }).catch(e => { })
                                                    })
                                                    if (message.guild.channels.cache.get(msg.content).type != "voice") return message.channel.send("Ce salon n'est pas un salon vocal.").then(m => {
                                                        msg.delete().catch(e => { })
                                                        return m.delete({ timeout: 3000 }).catch(e => { })
                                                    })
                                                    db.set(`memberc_${message.guild.id}`, msg.content)
                                                    chan = message.guild.channels.cache.get(msg.content)
                                                    format = db.fetch(`memberf_${message.guild.id}`)
                                                    chan.setName(format.replace('<count>', message.guild.memberCount)).catch(e => { message.channel.send("Erreur : " + e) })
                                                    message.channel.send("✅ - Le compteur total de membre a bien été assigné à <#" + msg.content + ">.").then(m => { msg.delete().catch(e => { }); m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    return updateEmbed(message)
                                                } else {
                                                    db.set(`memberc_${message.guild.id}`, false)
                                                    msg.delete().catch(e => { return })
                                                    message.channel.send("✅ - Le compteur total de membre a bien été désactivé.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    return updateEmbed(message)
                                                }
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre.") })
                                    })
                                    break;
                                case '🔊':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 🔊 Quel sera le salon **vocal** pour le compteur de membre en vocal ? \`false\` = désactiver`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (msg.content != 'false') {
                                                    if (!message.guild.channels.cache.has(msg.content)) return message.channel.send("Ce salon n'existe pas.").then(m => {
                                                        msg.delete().catch(e => { })
                                                        return m.delete({ timeout: 3000 }).catch(e => { })
                                                    })
                                                    if (message.guild.channels.cache.get(msg.content).type != "voice") return message.channel.send("Ce salon n'est pas un salon vocal.").then(m => {
                                                        msg.delete().catch(e => { })
                                                        return m.delete({ timeout: 3000 }).catch(e => { })
                                                    })
                                                    db.set(`voicec_${message.guild.id}`, msg.content)
                                                    chan = message.guild.channels.cache.get(msg.content)
                                                    format = db.fetch(`voicef_${message.guild.id}`)
                                                    chan.setName(format.replace('<count>', message.guild.members.cache.filter(m => m.voice.channel).size)).catch(e => { message.channel.send("Erreur : " + e) })
                                                    message.channel.send("✅ - Le compteur de membre en vocal a bien été assigné à <#" + msg.content + ">.").then(m => { msg.delete().catch(e => { }); m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    return updateEmbed(message)
                                                } else {
                                                    db.set(`voicec_${message.guild.id}`, false)
                                                    msg.delete().catch(e => { return })
                                                    message.channel.send("✅ - Le compteur de membre en vocal a bien été désactivé.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    return updateEmbed(message)
                                                }
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre.") })
                                    })
                                    break;
                                case '✅':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 🔊 Quel sera le salon **vocal** pour le compteur de membre en ligne ? \`false\` = désactiver`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (msg.content != 'false') {
                                                    if (!message.guild.channels.cache.has(msg.content)) return message.channel.send("Ce salon n'existe pas.").then(m => {
                                                        msg.delete().catch(e => { })
                                                        return m.delete({ timeout: 3000 }).catch(e => { })
                                                    })
                                                    if (message.guild.channels.cache.get(msg.content).type != "voice") return message.channel.send("Ce salon n'est pas un salon vocal.").then(m => {
                                                        msg.delete().catch(e => { })
                                                        return m.delete({ timeout: 3000 }).catch(e => { })
                                                    })
                                                    db.set(`onlinec_${message.guild.id}`, msg.content)
                                                    chan = message.guild.channels.cache.get(msg.content)
                                                    format = db.fetch(`onlinef_${message.guild.id}`)
                                                    chan.setName(format.replace('<count>', message.guild.members.cache.filter(({ presence }) => presence.status !== 'offline').size)).catch(e => { message.channel.send("Erreur : " + e) })
                                                    message.channel.send("✅ - Le compteur de membre en ligne a bien été assigné à <#" + msg.content + ">.").then(m => { msg.delete().catch(e => { }); m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    return updateEmbed(message)
                                                } else {
                                                    db.set(`onlinec_${message.guild.id}`, false)
                                                    msg.delete().catch(e => { return })
                                                    message.channel.send("✅ - Le compteur de membre en ligne a bien été désactivé.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    return updateEmbed(message)
                                                }
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre.") })
                                    })
                                    break;
                                case '⭐':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 🔊 Quel sera le salon **vocal** pour le compteur de boost ? \`false\` = désactiver`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (msg.content != 'false') {
                                                    if (!message.guild.channels.cache.has(msg.content)) return message.channel.send("Ce salon n'existe pas.").then(m => {
                                                        msg.delete().catch(e => { })
                                                        return m.delete({ timeout: 3000 }).catch(e => { })
                                                    })
                                                    if (message.guild.channels.cache.get(msg.content).type != "voice") return message.channel.send("Ce salon n'est pas un salon vocal.").then(m => {
                                                        msg.delete().catch(e => { })
                                                        return m.delete({ timeout: 3000 }).catch(e => { })
                                                    })
                                                    db.set(`boostc_${message.guild.id}`, msg.content)
                                                    chan = message.guild.channels.cache.get(msg.content)
                                                    format = db.fetch(`boostf_${message.guild.id}`)
                                                    chan.setName(format.replace('<count>', message.guild.premiumSubscriptionCount)).catch(e => { message.channel.send("Erreur : " + e) })
                                                    message.channel.send("✅ - Le compteur de boost a bien été assigné à <#" + msg.content + ">.").then(m => { msg.delete().catch(e => { }); m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    return updateEmbed(message)
                                                } else {
                                                    db.set(`boostc_${message.guild.id}`, false)
                                                    msg.delete().catch(e => { return })
                                                    message.channel.send("✅ - Le compteur de boost a bien été désactivé.").then(m => { m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                    return updateEmbed(message)
                                                }
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre.") })
                                    })
                                    break;
                                case '👥':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 👥 Quel sera le format pour le compteur de membre ? Mettez \`<count>\` pour ajoutez le nombre de membre.`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (!msg.content.includes('<count>')) return message.channel.send("Le message doit contenir **\`<count>\`** !").then(m => {
                                                    msg.delete().catch(e => { })
                                                    return m.delete({ timeout: 3000 }).catch(e => { })
                                                })
                                                db.set(`memberf_${message.guild.id}`, msg.content)
                                                chan = db.fetch(`memberc_${message.guild.id}`)
                                                if (chan) {
                                                    if (message.guild.channels.cache.has(chan)) {
                                                        chan = message.guild.channels.cache.get(chan)
                                                        format = msg.content
                                                        chan.setName(format.replace('<count>', message.guild.memberCount)).catch(e => { message.channel.send("Erreur : " + e) })
                                                    }
                                                }
                                                message.channel.send(`✅ - Le format du compteur total de membre a bien été changé pour \`${msg.content.replace(`<count>`, message.guild.memberCount)}\``).then(m => { msg.delete().catch(e => { }); m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                return updateEmbed(message)
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre.") })
                                    })
                                    break;
                                case '🔉':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 🔉 Quel sera le format pour le compteur de membre en vocal ? Mettez \`<count>\` pour ajoutez le nombre de membre.`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (!msg.content.includes('<count>')) return message.channel.send("Le message doit contenir **\`<count>\`** !").then(m => {
                                                    msg.delete().catch(e => { })
                                                    return m.delete({ timeout: 3000 }).catch(e => { })
                                                })
                                                db.set(`voicef_${message.guild.id}`, msg.content)
                                                chan = db.fetch(`voicec_${message.guild.id}`)
                                                if (chan) {
                                                    if (message.guild.channels.cache.has(chan)) {
                                                        chan = message.guild.channels.cache.get(chan)
                                                        format = msg.content
                                                        chan.setName(format.replace('<count>', message.guild.members.cache.filter(m => m.voice.channel).size)).catch(e => { message.channel.send("Erreur : " + e) })
                                                    }
                                                }
                                                message.channel.send(`✅ - Le format du compteur de membre en vocal a bien été changé pour \`${msg.content.replace(`<count>`, message.guild.memberCount)}\``).then(m => { msg.delete().catch(e => { }); m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                return updateEmbed(message)
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre.") })
                                    })
                                    break;
                                case '🌟':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 🌟 Quel sera le format pour le compteur de membre en ligne ? Mettez \`<count>\` pour ajoutez le nombre de membre.`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (!msg.content.includes('<count>')) return message.channel.send("Le message doit contenir **\`<count>\`** !").then(m => {
                                                    msg.delete().catch(e => { })
                                                    return m.delete({ timeout: 3000 }).catch(e => { })
                                                })
                                                db.set(`onlinef_${message.guild.id}`, msg.content)
                                                chan = db.fetch(`onlinec_${message.guild.id}`)
                                                if (chan) {
                                                    if (message.guild.channels.cache.has(chan)) {
                                                        chan = message.guild.channels.cache.get(chan)
                                                        format = msg.content
                                                        chan.setName(format.replace('<count>', message.guild.members.cache.filter(({ presence }) => presence.status !== 'offline'))).catch(e => { message.channel.send("Erreur : " + e) })
                                                    }
                                                }
                                                message.channel.send(`✅ - Le format du compteur de membre en ligne a bien été changé pour \`${msg.content.replace(`<count>`, message.guild.memberCount)}\``).then(m => { msg.delete().catch(e => { }); m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                return updateEmbed(message)
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre.") })
                                    })
                                    break;
                                case '📝':
                                    reaction.users.remove(message.author.id);
                                    await message.channel.send(`\`${getNow().time}\` 🌟 Quel sera le format pour le compteur de boost ? Mettez \`<count>\` pour ajoutez le nombre de membre.`).then(mp => {
                                        mp.channel.awaitMessages(dureefiltrer, { max: 1, time: 30000, errors: ['time'] })
                                            .then(async cld => {
                                                var msg = cld.first();
                                                mp.delete().catch(e => { return })
                                                if (!msg.content.includes('<count>')) return message.channel.send("Le message doit contenir **\`<count>\`** !").then(m => {
                                                    msg.delete().catch(e => { })
                                                    return m.delete({ timeout: 3000 }).catch(e => { })
                                                })
                                                db.set(`boostf_${message.guild.id}`, msg.content)
                                                chan = db.fetch(`boostc_${message.guild.id}`)
                                                if (chan) {
                                                    if (message.guild.channels.cache.has(chan)) {
                                                        chan = message.guild.channels.cache.get(chan)
                                                        format = msg.content
                                                        chan.setName(format.replace('<count>', message.guild.premiumSubscriptionCount)).catch(e => { message.channel.send("Erreur : " + e) })
                                                    }
                                                }
                                                message.channel.send(`✅ - Le format du compteur de boost a bien été changé pour \`${msg.content.replace(`<count>`, message.guild.memberCount)}\``).then(m => { msg.delete().catch(e => { }); m.delete({ timeout: 3000 }).catch(e => { return }) })
                                                return updateEmbed(message)
                                            }).catch(err => { return message.channel.send("Vous avez mis trop de temps à répondre.") })
                                    })
                                    break;
                            }
                        } catch (err) { return }
                    })
                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

// return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

module.exports.help = {
    name: "counters",
    aliases: [`compteurs`, `compteur`, `counter`],
    desc: ["Assigne les salons pour les compteurs", "Assign channels for the counters"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_CHANNELS"],
    usage: ["counters"],
    type: ["Configuration", "Setup"],
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

async function updateEmbed(message) {
    let memberscounter = db.fetch(`memberc_${message.guild.id}`)
    let voicecounter = db.fetch(`voicec_${message.guild.id}`)
    let onlinecounter = db.fetch(`onlinec_${message.guild.id}`)
    let boostcounter = db.fetch(`boostc_${message.guild.id}`)
    let membersformat = db.fetch(`memberf_${message.guild.id}`)
    let voiceformat = db.fetch(`voicef_${message.guild.id}`)
    let onlineformat = db.fetch(`onlinef_${message.guild.id}`)
    let boostformat = db.fetch(`boostf_${message.guild.id}`)
    if (!message.guild.channels.cache.find(c => c.id === memberscounter)) memberscounter = false
    if (!message.guild.channels.cache.find(c => c.id === voicecounter)) voicecounter = false
    if (!message.guild.channels.cache.find(c => c.id === onlinecounter)) onlinecounter = false
    if (!message.guild.channels.cache.find(c => c.id === boostcounter)) boostcounter = false
    let embed2 = new Discord.MessageEmbed()
        .setTitle("📚 Salon des logs")
        .addField("`👤` Compteur total de membre", memberscounter ? memberscounter : "-", true)
        .addField("`🔊` Compteur de membre en vocal", voicecounter ? voicecounter : "-", true)
        .addField("`✅` Compteur de membre en ligne", onlinecounter ? onlinecounter : "-", true)
        .addField("`⭐` Compteur de boost", boostcounter ? boostcounter : "-", true)
        .addField("`👥` Format compteur total de membre", membersformat.replace(`<count>`, message.guild.memberCount), true)
        .addField("`🔉` Format compteur de membre en vocal", voiceformat.replace(`<count>`, message.guild.members.cache.filter(m => m.voice.channel).size), true)
        .addField("`🌟` Format compteur de membre en ligne", onlineformat.replace(`<count>`, message.guild.members.cache.filter(({ presence }) => presence.status !== 'offline').size), true)
        .addField("`📝` Format compteur de boost", boostformat.replace(`<count>`, message.guild.premiumSubscriptionCount), true)
        .setColor('RANDOM')
        .setFooter(message.guild.name + ' - ' + 'Mxtorie')
    return msgwait.edit(embed2)
}