const Discord = require("discord.js")
const config = require("../../config.json")
const data = require("../../database.json")
const color = require("../../color.json")
const permissions = require("../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")
const embed2 = require("../../functions/embed/main")
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
                            if (!message.guild.roles.cache.has(myrole)) return embed2.simple(client, message, 'Perm kick/ban', message.guild.iconURL({ dynamic: true }), lang.rolebanproblem, color.orangered, message.channel)
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
                        if (!botaccess) return embed2.permissionMissing(client, message, botperm, lang.botpermissionmissing)
                    }
                    lang = language[`${lang2}`]

					let cani = db.fetch(`embed_${message.guild.id}`)
                    if(cani) return message.reply("Commande sous cooldown.")
                    db.set(`embed_${message.guild.id}`, true)
                    setTimeout(async() => {
                        db.set(`embed_${message.guild.id}`, false)
                    }, 6000)
                    let embedBeforeEdit = new Discord.MessageEmbed().setDescription('** **')
    let msgEmbedForEditing = await message.channel.send(embedBeforeEdit)
    const msgwait = await message.channel.send(lang.by == 'by' ? 'Please wait the time to add all reactions.' : 'Veuillez patienter le temps que j\'ajoute toutes les réactions...')

    await Promise.all(['✏️', '💬', '🕵️', '🔻', '🔳', '🕙', '🖼️', '🌐', '🎨', '↩️', '❌', '✅', '🗑️'].map(r => msgwait.react(r)))


    const embed = new Discord.MessageEmbed()
    if(lang.by == 'by'){
    embed.setTitle(`📚 Creation menu of ${message.guild.name}`)
    embed.setColor(color.darkgoldenrod)
    embed.setDescription(`Welcome on the embed creator !\nInteract with the reaction to custom your embed.`)
    embed.addField('```✏️```', `・Edit the title`, true)
    embed.addField('```💬```', `・Edit the description`, true)
    embed.addField('```🕵️```', `・Edit author`, true)
    embed.addField('```🔻```', `・Edit the footer`, true)
    embed.addField('```🔳```', `・Edit the thumbnail`, true)
    embed.addField('```🕙```', `・Add a timestamp`, true)
    embed.addField('```🖼️```', `・Add a picture`, true)
    embed.addField('```🌐```', `・Edit the author url`, true)
    embed.addField('```🎨```', `・Edit the color`, true)
    embed.addField('```↩️```', `・Add a field`, true)
    embed.addField('```❌```', `・Remove a field`, true)
    embed.addField('```✅```', `・Send the message`, true)
    } else {
        embed.setTitle(`📚 Menu de création de ${message.guild.name}`)
    embed.setColor(color.darkgoldenrod)
    embed.setDescription(`Bienvenue dans le créateur d'embed !\nUtilisez les réactions pour customiser ton embed.`)
    embed.addField('```✏️```', `・Modifier le titre`, true)
    embed.addField('```💬```', `・Modifier la description`, true)
    embed.addField('```🕵️```', `・Modifier l'auteur`, true)
    embed.addField('```🔻```', `・Modifier le footer`, true)
    embed.addField('```🔳```', `・Modifier le pdp`, true)
    embed.addField('```🕙```', `・Ajouter l'heure`, true)
    embed.addField('```🖼️```', `・Ajouter une image`, true)
    embed.addField('```🌐```', `・Modifier l'url de l'autheur`, true)
    embed.addField('```🎨```', `・Modifier la couleur`, true)
    embed.addField('```↩️```', `・Ajouter une section`, true)
    embed.addField('```❌```', `・Retirer une section`, true)
    embed.addField('```✅```', `・Envoyer le message`, true)
    }

    await msgwait.edit(embed)

    const filterReaction = (reaction, user) => user.id === message.author.id && !user.bot
    const filterMessage = (m) => m.author.id === message.author.id && !m.author.bot
    const collectorReaction = await new Discord.ReactionCollector(msgwait, filterReaction)
    collectorReaction.on('collect', async reaction => {
        try{
        switch (reaction._emoji.name) {
            case '✏️':
                reaction.users.remove(message.author.id);
                let msgQuestionTitle = await message.channel.send(lang.whattitle);
                let title = (await message.channel.awaitMessages(filterMessage, { max: 1, time: 60000 })).first();
                embedBeforeEdit.setTitle(title.content);
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgQuestionTitle.delete()
                title.delete()
                break;
            case '💬':
                reaction.users.remove(message.author.id);
                let msgQuestionDescription = await message.channel.send(lang.whatdescription);
                let description = (await message.channel.awaitMessages(filterMessage, { max: 1, time: 60000 })).first();
                embedBeforeEdit.setDescription(description.content);
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgQuestionDescription.delete()
                description.delete()
                break;
            case '🕵️':
                reaction.users.remove(message.author.id);
                let msgQuestionAuthor = await message.channel.send(lang.whatauthor);
                let author = (await message.channel.awaitMessages(filterMessage, { max: 1, time: 60000 })).first();
                embedBeforeEdit.setAuthor(author.content);
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgQuestionAuthor.delete()
                author.delete()
                break;
            case '🔻':
                reaction.users.remove(message.author.id);
                let msgQuestionFooter = await message.channel.send(lang.whatfooter);
                let footer = (await message.channel.awaitMessages(filterMessage, { max: 1, time: 60000 })).first();
                embedBeforeEdit.setFooter(footer.content, client.user.displayAvatarURL({ dynamic: true }));
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgQuestionFooter.delete()
                footer.delete()
                break;
            case '🔳':
                reaction.users.remove(message.author.id);
                let msgQuestionThumbnail = await message.channel.send(lang.whatthumbnail);
                let thumbnail = (await message.channel.awaitMessages(filterMessage, { max: 1, time: 60000 })).first();
                if (!thumbnail.content.includes('http') && !thumbnail.content.includes('https') && !thumbnail.content.includes('www')) {
                    msgQuestionThumbnail.delete()
                    thumbnail.delete()
                    let th = await message.channel.send(lang.invalidthumbnail)
                    return setTimeout(() => {
                        th.delete()
                    }, 2000)
                }
                embedBeforeEdit.setThumbnail(thumbnail.content);
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgQuestionThumbnail.delete()
                thumbnail.delete()
                break;
            case '🕙':
                reaction.users.remove(message.author.id);
                embedBeforeEdit.setTimestamp();
                msgEmbedForEditing.edit(embedBeforeEdit);
                break;
            case '🖼️':
                reaction.users.remove(message.author.id);
                let msgQuestionImage = await message.channel.send(lang.whatpicture);
                let image = (await message.channel.awaitMessages(filterMessage, { max: 1, time: 60000 })).first();
                if (!image.content.includes('http') && !image.content.includes('https') && !image.content.includes('www')) {
                    msgQuestionImage.delete()
                    image.delete()
                    let im = await message.channel.send(lang.invalidpicture)
                    return setTimeout(() => {
                        im.delete()
                    }, 2000)
                }
                embedBeforeEdit.setImage(image.content);
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgQuestionImage.delete()
                image.delete()
                break;
            case '🌐':
                reaction.users.remove(message.author.id);
                let msgQuestionURL = await message.channel.send(lang.whaturl);
                let url = (await message.channel.awaitMessages(filterMessage, { max: 1, time: 60000 })).first();
                embedBeforeEdit.setURL(url.content);
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgQuestionURL.delete()
                url.delete()
                break;
            case '🎨':
                reaction.users.remove(message.author.id);
                let msgQuestionColor = await message.channel.send(lang.whatcolor);
                let color = (await message.channel.awaitMessages(filterMessage, { max: 1, time: 60000 })).first();
                //  message.channel.bulkDelete(2)
                embedBeforeEdit.setColor(color.content);
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgQuestionColor.delete()
                color.delete()
                break;
            case '↩️':
                reaction.users.remove(message.author.id);
                let msgQuestionField = await message.channel.send(lang.whattitlefield);
                let titlefield = (await message.channel.awaitMessages(filterMessage, { max: 1, time: 60000 })).first();
                let msgQuestionField1 = await message.channel.send(lang.whatdescriptionfield);
                let descriptionfield = (await message.channel.awaitMessages(filterMessage, { max: 1, time: 60000 })).first();
                embedBeforeEdit.addField(titlefield.content, descriptionfield.content);
                msgEmbedForEditing.edit(embedBeforeEdit);
                msgQuestionField.delete()
                titlefield.delete()
                msgQuestionField1.delete()
                descriptionfield.delete()
                break;
            case '❌':
                reaction.users.remove(message.author.id);
                let msgQuestionFieldTitle = await message.channel.send(lang.whattitleremove)
                let field_title = (await message.channel.awaitMessages(filterMessage, { max: 1, time: 60000 })).first();
                msgQuestionFieldTitle.delete()
                let indexField = '';
                embedBeforeEdit.fields.map(field => {
                    if (indexField !== '') return;
                    if (field.name === field_title.content) indexField += embedBeforeEdit.fields.indexOf(field);
                })
                if (indexField === '') return message.channel.send(lang.cantfindfield).then(msg => {
                    field_title.delete()
                    msg.delete({ timeout: 5000 })
                })
                delete embedBeforeEdit.fields[indexField];
                msgEmbedForEditing.edit(embedBeforeEdit)
                field_title.delete()
                break;
            case '✅':
                reaction.users.remove(message.author.id);
                let msgQuestionChannelOrNo = await message.channel.send(lang.sendembed);
                let channelOrNo = (await message.channel.awaitMessages(filterMessage, { max: 1, time: 60000 })).first();
                msgQuestionChannelOrNo.delete()
                if (channelOrNo.content === 'here') {
                    message.channel.send(embedBeforeEdit)
                    channelOrNo.delete()
                } else {
                    message.guild.channels.cache.get(channelOrNo.content).send(embedBeforeEdit);
                    channelOrNo.delete()
                }
                break;
            case '🗑️':
                msgwait.delete().catch(e => { console.log('**Error minor** : ' + e) })
                if(!message || message!=null || message!=undefined){ message.delete().catch(e => { console.log('**Error minor** : ' + e) })}
                if(!msgEmbedForEditing || msgEmbedForEditing!=null || msgEmbedForEditing!=undefined) {msgEmbedForEditing.delete().catch(e => { console.log('**Error minor** : ' + e) })}
                //if(embedBeforeEdit) embedBeforeEdit.delete()
        }
    }catch(err){
        message.reply(lang.noanswer)
    }
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
    name: "embed",
    aliases: [`emb`],
    desc: ["Crée un message embed personnaliser", "Create a embed message custom"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["embed"],
    type: ["Fun", "Fun"],
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