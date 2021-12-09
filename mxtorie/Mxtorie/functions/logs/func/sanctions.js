const Discord = require('discord.js')
const embed = require('../../embed/main')

/**
 * Créé une rapport de log
 * @param {Client}		client	- Bot reference
 * @param {Message}		message	- Message reference
 * @param {Database}		database	- Database reference
 * @param {Embed name}	name		- Embed title
 * @param {Embed text}		text	- Embed description ([member] / [author] / [punish] / [reason])
 * @param {Victim}		sanctionned	- Who is sanctionned
 * @param {Reason}		reason	- What's the reason of the sanction
 * @param {Color}	color		- Color of the embed
 * @param {lang reference}		lang	- Lang of the bot
 * @param {Author}		author	- Who give the sanction
 * @param {Type}	type		- system/sanctions/protections/messages/channel
 * @param {Time}   time  - Time argument
 * @param {Channel}  channel - Channel reference (id or name)
 * @param {Role} role - Role reference or id or name
 * @param {Victim} victim - Reference of the victim (not the id)
 */


module.exports = async (client, message, database, name, text, sanctionned, reason, color, lang, author, type, time, channelref, role, victim) => {
    if (!client) return
    if (!message) return
    if (!message.guild) return
    try {
        await database.query("SELECT * FROM channels WHERE serverid = ?", message.guild.id, async (error, result) => {
            try {
                if (error) return console.log("Sanctions logs error : " + error)
                if (!result[0] || result[0].sanctions == '-') return
                let chan = result[0].sanctions
                if (!chan) return
                if (!message.guild.channels.cache.has(chan)) return
                chan = message.guild.channels.cache.find(c => c.id === chan)
                if (!chan) return
                if(!lang) lang = require('../../../lang.json').fr
                await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async (error, result) => {
                    if (error) return console.log('Sanctions logs error : ' + error)
                    var content = text
                    if (sanctionned.user) content = content.toString().replace("[member]", sanctionned)
                    else content = content.toString().replace("[member]", "<@" + sanctionned + ">")
                    content = content.toString().replace("[author]", author.id ? author : `<@${author}>`)
                    content = content.toString().replace("[punish]", result[0].punish)
                    if (reason) content = content.toString().replace("[reason]", `\`${reason}\``)
                    content = content.toString().replace("[sanction]", name.toLowerCase())
                    if (time) content = content.toString().replace("[time]", `**${time}**`)
                    if (channelref) content = content.toString().replace("[channel]", !isNaN(channelref) ? "<#" + channelref + ">" : `\`${channelref}\``)
                    if (sanctionned && !role) content = content.toString().replace("[role]", "<@&" + sanctionned + "> (" + sanctionned + ")")
                    if(role) content = content.toString().replace("[role]", !isNaN(role.id) ?  (role.id ? role : `<@&${role}>`) : `\`${role}\``)
                    if(victim) content = content.toString().replace('[victim]', `${victim}(id : ${victim.id})`)
                    await database.query("SELECT * FROM channels WHERE serverid = ?", message.guild.id, async (error, result) => {
                        let r = result[0]
                        switch (type) {
                            case 'system':
                                r = r.system
                                break;
                            case 'sanctions':
                                r = r.sanctions
                                break;
                            case 'channel':
                                r = r.channel
                                break;
                            case 'messages':
                                r = r.messages
                                break;
                            case 'protections':
                                r = r.protections
                                break;
                            case 'roles':
                                r = r.roles
                                break;
                        }
                        if (!message.guild.channels.cache.find(c => c.id === r)) return
                        let chan = message.guild.channels.cache.find(c => c.id === r)
                        if (!chan) return
                        embed.logs(client, message, name, content, sanctionned, color, chan)
                    })
                })
            } catch (err) {
                console.log('Sanctions logs error : ' + err)
            }
        })
    } catch (err) {
        console.log('Sanctions logs error : ' + err)
    }
}