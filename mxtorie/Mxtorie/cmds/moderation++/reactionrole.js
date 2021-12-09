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

                    if (!args[0]) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                    switch (args[0].toLowerCase()) {
                        case 'add':
                            if (args[0].toLowerCase() === 'add') {
                                if (true) {
                                    try {
                                        let channelRRAdd = message.channel.id;
                                        if (!channelRRAdd) return message.channel.send(lang.by == 'by' ? `Channel not found.` : `Salon introuvable.`);
                                        let messageRRAdd = await message.channel.messages.cache.find(m => m.id = args[1]);
                                        if (!messageRRAdd) return message.channel.send(lang.by == 'by' ? `Message not found` : `Message introuvable`);
                                        let emoteRRAdd = await message.guild.emojis.cache.find(e => e.name = args[2].trim());
                                        if (!emoteRRAdd && isNaN(args[2])) emoteRRAdd = args[2];
                                        if (!emoteRRAdd) return message.channel.send(`Emoji introuvable.`);
                                        let role = message.guild.roles.cache.find(r => r.id = args[3]) || message.mentions.roles.first().id;
                                        if (!role || role.id == message.channel.guild.id) return message.channel.send(`Rôle introuvable.`);
                                        let existingReactionRole = await db.fetch(`reactionrole_${message.guild.id}_${message.channel.id}_${messageRRAdd.id}_${emoteRRAdd.name}`)
                                        if (existingReactionRole) return message.channel.send(`L'emojie existe déjà sur ce message.`);
                                        try {
                                            await messageRRAdd.react(`${emoteRRAdd.name}`).catch(async e => { await messageRRAdd.react(`${emoteRRAdd.name}:${emoteRRAdd.id}`).catch(async e => { await messageRRAdd.react(emoteRRAdd) }) });
                                        } catch (err) { return message.reply(lang.by == 'by' ? 'I can use only emotes from the server.' : 'Je ne peux qu\'utilisé que les emojis du serveur.') }
                                        /*let arrayRRAdd = settings.reactionroles
                                        arrayRRAdd.push({ channelID: channelRRAdd.id, messageID: messageRRAdd.id, emoji: emoteRRAdd.id ? emoteRRAdd.id : emoteRRAdd, roleID: role.id })*/
                                        db.set(`reactionrole_${message.guild.id}_${message.channel.id}_${messageRRAdd.id}_${emoteRRAdd.name}`, message.channel.id + "_" + messageRRAdd.id + "_" + role.id)

                                        // await client.updateGuild(message.guild, { reactionroles: arrayRRAdd });
                                        message.channel.send(lang.by == 'by' ? `Role-reaction have been created.` : `Réaction-rôle créé.`);
                                        try {
                                            await messageRRAdd.react(`${emoteRRAdd.name}`).catch(async e => { await messageRRAdd.react(`${emoteRRAdd.name}:${emoteRRAdd.id}`).catch(async e => { await messageRRAdd.react(emoteRRAdd) }) });
                                        } catch (err) { return message.reply(lang.by == 'by' ? 'I can use only emotes from the server.' : 'Je ne peux qu\'utilisé que les emojis du serveur.') }
                                        message.guild.channels.cache.find(s => s.id === messageRRAdd.channel.id).messages.fetch(messageRRAdd.id).catch(e => { return })
                                        client.emit('newReactionRole', message, messageRRAdd)
                                    } catch (e) {
                                        if (e.message.match('Unknown Message')) return message.channel.send(`Message introuvable`);
                                        else return message.channel.send(`Une erreur est survenue, attention au espace etc...`);
                                    }
                                } else return message.channel.send(`An error occurred. Please try again.`)
                                break;
                            }
                        case 'rem':
                            if (args.length == 2 && args[1] == 'all') {
                                let searchdb = db.all().filter(o => o.ID.startsWith(`reactionrole_${message.guild.id}_`))
                                let users = searchdb.map(x => x.ID.slice(`reactionrole_${message.guild.id}_`.length))
                                if (users.length < 1) return message.channel.send('Ce serveur n\'a aucune reaction role.')
                                searchdb.forEach(s => {
                                    let msg = s.data
                                    //console.log(msg)
                                    let msg1 = msg.split('_')
                                    let result = msg1[0].replace(/[&"<>@]/g, '')
                                    if (!message.guild.channels.cache.find(c => c.id === result)) return
                                    try {
                                        message.guild.channels.cache.find(c => c.id === result).messages.cache.find(m => m.id === msg1[1]).reactions.removeAll().catch(error => console.error('Failed to remove reactions: ', error))
                                    } catch (err) { }
                                    db.delete(s.ID)
                                })
                                return message.channel.send(`Toutes les reaction roles du serveur on était supprimées.`);
                            } else// return message.reply(lang.by == "by" ? "For the moment you can only remove all reactions roles at the same time." : "Pour le moment vous ne pouvez pas enlever une reaction role précisement.")
                            {
                                //try {
                                let channel = message.channel.id;
                                if (!channel) return message.channel.send(`Salon introuvable.`);
                                let messageRR = await message.channel.messages.cache.find(m => m.id = args[1])
                                if (!messageRR) return message.channel.send(`Message introuvable`);
                                let searchdb = db.all().filter(o => o.ID.startsWith(`reactionrole_${message.guild.id}_${channel}_${messageRR.id}_`))
                                let users = searchdb.map(x => x.ID.slice(`reactionrole_${message.guild.id}_${channel}_${messageRR.id}_`.length))
                                //console.log(searchdb)
                                if (users.lenght < 1) return message.channel.send(`Il n'y a aucun reaction rone sous ce message.`);
                                let emojiToRemove = await message.guild.emojis.cache.find(e => e.name = args[2].trim());
                                if (!emojiToRemove && isNaN(args[2])) emojiToRemove = args[2];
                                if (!emojiToRemove) return message.channel.send(`Emoji introuvable.`);
                                //args.splice(0, 4);
                                //const role = client.resolveRole(message.channel.guild, args.join(' '));
                                //if (!role || role.id == message.channel.guild.id) return message.channel.send(` Can't find this role.`);
                                // client.updateGuild(message.guild, { $pull: { reactionroles: { channelID: channel, messageID: messageRR.id, emoji: emojiToRemove, roleID: role.id } } });
                                let searchdb2 = db.all().filter(o => o.ID.startsWith(`reactionrole_${message.guild.id}_${channel}_${messageRR.id}_<:${emojiToRemove.name}:${emojiToRemove.id}>`))
                                let users2 = searchdb2.map(x => x.ID.slice(`reactionrole_${message.guild.id}_${channel}_${messageRR.id}_<:${emojiToRemove.name}:${emojiToRemove.id}>`.length))
                                // if(!users2.length < 1 || searchdb2.length < 1) return message.channel.send('Cette reaction role n\'existe pas.')
                                db.delete(`reactionrole_${message.guild.id}_${channel}_${messageRR.id}_${emojiToRemove.name}`)
                                db.delete(`reactionrole_${message.guild.id}_${channel}_${messageRR.id}_<:${emojiToRemove.name}:${emojiToRemove.id}`)
                                db.delete(`reactionrole_${message.guild.id}_${channel}_${messageRR.id}_${emojiToRemove}`)
                                message.channel.send(`Reaction role supprimé, retiré les réactions manuellement.`);
                                if (!message.channel.messages.cache.find(m => m.id = messageRR.id).reactions.cache.get(emojiToRemove.name)) {

                                    if (!message.channel.messages.cache.find(m => m.id = messageRR.id).reactions.cache.get(`${emojiToRemove.name}:${emojiToRemove.id}`) && !message.channel.messages.cache.find(m => m.id = messageRR.id).reactions.cache.get(`${emojiToRemove.name}`) && !message.channel.messages.cache.find(m => m.id = messageRR.id).reactions.cache.get(emojiToRemove) && !message.channel.messages.cache.find(m => m.id = messageRR.id).reactions.cache.get(emojiToRemove.id)) return console.log("gfhgf")
                                }
                                //console.log(emojiToRemove.name)
                                try {
                                    await message.channel.messages.cache.find(m => m.id = messageRR.id).reactions.cache.get(emojiToRemove.name).remove().catch(async error => { await message.channel.messages.cache.find(m => m.id = messageRR.id).reactions.cache.get(`${emojiToRemove.name}:${emojiToRemove.id}`).remove().catch(async error => { await message.channel.messages.cache.find(m => m.id = messageRR.id).reactions.cache.get(emojiToRemove).remove().catch(async error => { await message.channel.messages.cache.find(m => m.id = messageRR.id).reactions.cache.get(emojiToRemove.id).remove().catch(e => { }).catch(async error => { await message.channel.messages.cache.find(m => m.id = messageRR.id).reactions.cache.get(`<:${emojiToRemove.name}:${emojiToRemove.id}>`).remove().catch(e => { }) }) }) }) })
                                } catch (err) { }
                                /*} catch (e) {
                                    if (e.message.match('Unknown Message')) return message.channel.send(`Message not found.`);
                                    else return message.channel.send(e);
                                }*/
                            }
                            break;
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
    name: "reactionrole",
    aliases: [`rr`, `rolereaction`],
    desc: ["Crée des messages réaction, interagir avec vous donne un rôle", "Create a reaction message, interact with them give you a role"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "ADD_REACTIONS"],
    usage: ["reactionrole add <id du message> <emoji> <id du rôle>", "reactionrole rem all", "reactionrole rem <id du message> <emoji>", "ps : la commande doit être faite dans le même salon que le message."],
    type: ["Modération ++", "Moderation ++"],
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