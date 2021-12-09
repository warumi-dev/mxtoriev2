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
const coins = require('../../coins.json')

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

module.exports.run = async (client, message, args, prefix, perm, whitelisted, database, database2, lang, database3) => {
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

                    if(!args[0]){
                        let mwork = await db.fetch(`multiplierwork_${message.guild.id}`)
                        let mdaily = await db.fetch(`multiplierdaily_${message.guild.id}`)
                        let embed2 = new Discord.MessageEmbed()
                        embed2.setTitle("Multiplicateur de gain")
                        embed2.setDescription(`**work** : \`x${mwork?mwork:'1.0'}\`\n**daily** : \`x${mdaily?mdaily:'1.0'}\``)
                        embed2.setFooter("Mxtorie", "https://cdn.discordapp.com/avatars/668381000254095370/a_a7487e5102fb6a928b2b1a29381cd176.gif?size=512")
                        embed2.setColor('RANDOM')
                        return message.channel.send(embed2)
                    } else if(args[0].toLowerCase=="work"||args[0].toLowerCase()=="daily"){
                        switch(args[0].toLowerCase){
                            case 'work':
                                if(!args[1]) return message.channel.send("Multiplicateur invalide.")
                                if(isNaN(args[1])) return message.channel.send("Multiplicateur invalide.")
                                if(10*parseFloat(args[1])<1) return message.channel.send("Multiplicateur invalide.")
                                await db.set(`multiplierwork_${message.guild.id}`, parseFloat(args[1]))
                                message.channel.send("Multiplicateur de gain pour la commande **\`work\`** a bien été changé pour **\`"+args[1]+"\`**.")
                            break;
                            case 'daily':
                                if(!args[1]) return message.channel.send("Multiplicateur invalide.")
                                if(isNaN(args[1])) return message.channel.send("Multiplicateur invalide.")
                                if(10*parseFloat(args[1])<1) return message.channel.send("Multiplicateur invalide.")
                                await db.set(`multiplierdaily_${message.guild.id}`, parseFloat(args[1]))
                                message.channel.send("Multiplicateur de gain pour la commande **\`daily\`** a bien été changé pour **\`"+args[1]+"\`**.")
                            break;
                        }
                    } else {
                        return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
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
    name: "multiplier",
    aliases: [`gain`],
    desc: ["Change le mutliplier des commandes work et daily", "Get you money of the day"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["multiplier", "multiplier work <valeur>", "multiplier daily <valeur>"],
    type: ["Economie", "Economy"],
    perm: "1"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, '1']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}