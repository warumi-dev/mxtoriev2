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
module.exports.run = async (client, message, args, prefix, perm, whitelisted, database, database2, lang) => {
    try {
        await CmdExist(database, message, this.help.name).then(async()=>{
        await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, this.help.name], async (error, result) => {
            var canaccess = false
            try {
                if(error) return message.reply(language[lang].error+error)
                if(!result[0]) canaccess = true
                if(result[0].perm == '0') canaccess = true
                if(result[0].perm == '1') if(perm[0]) canacces = true
                if(result[0].perm == '2') if(perm[0] || perm[1]) canaccess = true
                if(result[0].perm == '3') if(perm[0] || perm[1] || perm[2]) canaccess = true
                if(result[0].perm == 'giveaway') if(perm[3]) canaccess = true
                if(result[0].perm == 'mention everyone') if(perm[4]) canaccess = true
                if (result[0].perm == 'whitelist') if(whitelisted) canaccess = true
                if (result[0].perm == 'owner') if(config.owners.includes(message.author.id) || config.buyer==message.author.id || config.creator==message.author.id) canaccess = true
                if (result[0].perm == 'buyer') if (config.buyer == message.author.id || config.creator == message.author.id) canaccess = true
                if(!canaccess) return message.channel.send(language[lang].permissionmissing+`**\`perm ${result[0].perm} minimum\`**`)
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

                if (!args[0] || args[0] != 'list' && args[0] != 'add' && args[0] != 'remove') return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
        switch (args[0]) {
            case 'list':
                try {
                    if (config.owners.length < 1) return message.reply(lang.by == 'by' ? 'No one is owner.' : 'Je n\'ai pas de propriétaire.')
                    let embed = new Discord.MessageEmbed()
                    embed.setTitle(lang.by == 'by' ? 'Owner list' : 'Liste des propriétaires')
                    embed.setDescription(config.owners.map((i, n) => `**${n+1} -** <@${i}>`))
                    embed.setColor(color.mediumpurple)
                    message.channel.send(embed)
                } catch (err) {}
                break;
            case 'add':
                try {
                    if (config.buyer != message.author.id && config.creator != message.author.id) return message.reply(lang.by == 'by' ? 'You need to be my buyer.' : 'Tu dois être l\'acheteur du bot.')
                    let mention2 = message.mentions.members.first()
                    if (mention2) mention2 = mention2.id
                    if (!mention2) mention2 = args[1]
                    if (!mention2 || isNaN(mention2) || mention2.length != 18) return message.reply(lang.invalidmi)
                    //let mention = client.users.cache.find(u => u.id == mention2)
                    if (!mention2) return message.reply(lang.invalidmi)
                    if (config.owners.includes(mention2)) return message.reply(lang.by == 'by' ? 'This user is already owner.' : 'Cette personne est déjà propriétaire.')
                    config.owners.push(mention2)
                    message.channel.send(lang.by == 'by' ? '<@' + mention2 + '> is now a owner.' : '<@' + mention2 + '> est maintenant un propriétaire.')
                    fs.writeFile(`./config.json`, JSON.stringify(config), (x) => {
                        if (x) console.error(x)
                      });
                } catch (err) {}
                break;
            case 'remove':
                try {
                    if (config.buyer != message.author.id && config.creator != message.author.id) return message.reply(lang.by == 'by' ? 'You need to be my buyer.' : 'Tu dois être l\'acheteur du bot.')
                    let mention2 = message.mentions.members.first()
                    if (mention2) mention2 = mention2.id
                    if (!mention2) mention2 = args[1]
                    if (!mention2 || isNaN(mention2) || mention2.length != 18) return message.reply(lang.invalidmi)
                    //let mention = client.users.cache.find(u => u.id == mention2)
                    if (!mention2) return message.reply(lang.invalidmi)
                    if (!config.owners.includes(mention2)) return message.reply(lang.by == 'by' ? 'This user is not a owner.' : 'Cette personne n\'est pas propriétaire.')
                    let newlist = []
                    config.owners.map((i, n) => {
                        if (i != mention2) {
                            newlist.push(i)
                        }
                        if (n == config.owners.length-1) {
                             config.owners = newlist
                             return fs.writeFile(`./config.json`, JSON.stringify(config), (x) => {
                                if (x) console.error(x)
                              });
                        }
                    })
                    message.channel.send(lang.by == 'by' ? '<@' + mention2 + '> is now removed from the owner(s) list.' : '<@' + mention2 + '> est maintenant retiré de la liste de propriétaire(s).')
                } catch (err) {}
                break;
        }

            } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
        })
    })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

module.exports.help = {
    name: "owner",
    aliases: [`proprio`],
    desc: ["Ajouter/Retirer des propriétaires sur le bot, cette liste est au dessus des whitelistés", "Add/Remove owners on the bot, they are above whitelisted"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["owner list", "owner add <mention/id>", "owner remove <mention/id>"],
    type: ["Paramètres", "Settings"],
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