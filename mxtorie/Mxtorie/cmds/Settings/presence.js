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
                    let author = await db.fetch(`presence_${message.guild.id}`)

                    let timeout = 10000;

                    if (author !== null && timeout - (Date.now() - author) > 0) {
                        let time = ms(timeout - (Date.now() - author));

                        let timeEmbed = new Discord.MessageEmbed()
                            .setColor("#FFFFFF")
                            .setDescription(`❌ Tu as déjà changé la présence du bot.\n\nRé-essayer dans : ${pretty(ms(time))} `);
                        message.channel.send(timeEmbed)
                    } else {
                        if (!message.guild) return
                        if(!args[0]) return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        let pre = args[0].toLowerCase()
                        if (!pre || pre != 'online' && pre != 'idle' && pre != 'dnd' && pre != 'invisible') return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)
                        client.user.setStatus(pre).catch(e => { return message.reply(`\`${getNow().time}\` :x: ${message.author}, ${lang.by=='by' ? 'Error occured. \n **More informations:**' : 'Une erreur a été rencontré. \n **Plus d\'informations:**'} \`🔻\` \`\`\`${e}\`\`\``) })
                        config.state = args[0]
                        message.channel.send(`\`${getNow().time}\` :white_check_mark: ${message.author}, ${lang.by=='by' ? 'Status changed for : **'+pre+'**\n_That can take a moment_' : 'Statut changé pour : **'+pre+'**\n_Cela peut prendre un moment_'}`)
                        fs.writeFile(`./config.json`, JSON.stringify(config), (x) => {
                            if (x) console.error(x)
                        });
                        db.set(`presence_${message.guild.id}`, Date.now())
                    }
                } catch (err) { console.log(this.help.name.toUpperCase() + " : " + err) }
            })
        })
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

module.exports.help = {
    name: "presence",
    aliases: [`setstatus`],
    desc: ["Change la présence du bot", "Change the presence of the bot"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: ["presence <online/dnd/idle/invisible>"],
    type: ["Paramètres", "Settings"],
    perm: "buyer"
}

async function CmdExist(database, message, cmdname) {
    await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [message.guild.id, cmdname], async (error, result) => {
        if (error) return console.log(cmdname.toUpperCase() + ' : ' + error)
        if (result[0]) return
        var val = [[message.guild.id, cmdname, 'buyer']]
        return database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val])
    })
}