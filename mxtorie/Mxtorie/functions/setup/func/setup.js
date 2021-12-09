const Discord = require('discord.js')
const config = require('../../../config.json')
module.exports = async(name, id, language, prefix, serveravatar, owner, ownerid, owneravatar, members, chan, database) => {
    try {
        if (!members) return;
        var embed = new Discord.MessageEmbed()
        database.query("SELECT * FROM settings WHERE serverid = " + id, function(error, result, fields) {
            // let key = ultrax.passGen(36)
            if (!serveravatar) {
                serveravatar = "None";
            }
            if (!owneravatar) {
                owneravatar = "None";
            }
            if (result.length < 1) {
                var sql2 = "INSERT INTO settings (servername, serverid, serveravatar, owner, ownerid, owneravatar, membres, language, prefix, welcomemsg, welcome, captcha, defaultrole, support, supportmsg) VALUES ?";
                var values2 = [
                    [name, id, serveravatar, owner, ownerid, owneravatar, members, language, prefix, 'default', 'off', 'off', 'off', 'off', '-']
                ];
                database.query(sql2, [values2], function(error, result, fields) {
                    if (error) {
                        embed = new Discord.MessageEmbed()
                            .setTitle("Erreur lors d'une configuration. | Settings")
                            .setTimestamp()
                            .setDescription(name + " id: " + id + "\n" + error);
                        bot.channels.cache.get(config.mainchannel).send(embed).catch(e => console.log(e))
                    }
                })
            }
        })
        database.query("SELECT * FROM protections WHERE serverid = " + id, function(error, result, fields) {
            if (result < 1) {
                var sql3 = "INSERT INTO protections (serverid, links, gif, spam, spamlevel, role, channel, bot, prtcjoin, prtcjointime, webhook, antieditrole) VALUES ?";
                var values3 = [
                    [id, "off", "off", "off", "medium", "off", "off", "off", "off", "86400000", "off", "off"]
                ];
                database.query(sql3, [values3], function(error, result, fields) {
                    if (error) {
                        embed = new Discord.MessageEmbed()
                            .setTitle("Erreur lors d'une configuration. | Protections")
                            .setTimestamp()
                            .setDescription(name + " id: " + id + "\n" + error);
                        bot.channels.cache.get(config.mainchannel).send(embed).catch(e => console.log(e))
                    }
                })
            }
        })
        database.query("SELECT * FROM channels WHERE serverid = " + id, function(error, result, fields) {
            if (result < 1) {
                var sql4 = "INSERT INTO channels (serverid, system, sanctions, channel, messages, protections, tickets, ticketslogs, welcomechan, level, captcha, jtc) VALUES ?";
                var values4 = [
                    [id, chan.id, "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"]
                ];
                database.query(sql4, [values4], function(error, result, fields) {
                    if (error) {
                        embed = new Discord.MessageEmbed()
                            .setTitle("Erreur lors d'une configuration. | Channels")
                            .setTimestamp()
                            .setDescription(name + " id: " + id + "\n" + error);
                        bot.channels.cache.get(config.mainchannel).send(embed).catch(e => console.log(e))
                    }
                })
            }
        })
        database.query("SELECT * FROM roles WHERE serverid = " + id, function(error, result, fields) {
            if (result < 1) {
                var sql5 = "INSERT INTO roles (serverid, member, mute, ban, ticket, captcha, defaultrole, support) VALUES ?";
                var values5 = [
                    [id, "-", "-", "-", "-", "-", "-", "-"]
                ];
                database.query(sql5, [values5], function(error, result, fields) {
                    if (error) {
                        embed = new Discord.MessageEmbed()
                            .setTitle("Erreur lors d'une configuration. | Roles")
                            .setTimestamp()
                            .setDescription(name + " id: " + id + "\n" + error);
                        bot.channels.cache.get(config.mainchannel).send(embed).catch(e => console.log(e))
                    }
                })
            }
        })

        database.query("SELECT * FROM moderations WHERE serverid = " + id, async(error, result, fields) => {
            if (result < 1) {
                var sql6 = "INSERT INTO moderations (serverid, mute, ban, warn, ticket) VALUES ?";
                var values6 = [
                    [id, "0", "0", "0", "0"]
                ];
                database.query(sql6, [values6], function(error, result, fields) {
                    if (error) {

                    }
                })
            }
        })
        await database.query("SELECT * FROM s_giveaway WHERE serverid = ?", id, async function(error, result, fields) {
            if (result < 1) {
                var ladate = new Date()
                let values = [
                    [id, '2h', '-', 'false', 'VIP role', '-', 'false']
                ]
                database.query("INSERT INTO s_giveaway(serverid, time, channel, winner, price, lastmsg, needvoice) VALUES ?", [values], async(error, result, fields) => {
                    if (error || result === undefined) {
                        try {
                            embed = new Discord.MessageEmbed()
                                .setTitle("Erreur lors d'une configuration. | Giveaway")
                                .setTimestamp()
                                .setDescription(name + " id: " + id + "\n" + error);
                            bot.channels.cache.get(config.mainchannel).send(embed).catch(e => console.log(e))
                        } catch (err) {}
                    }
                })
            }
        })
        /*embed = new Discord.MessageEmbed()
            .setTitle("Setup finish.")
            .setDescription('You can edit the bot functions with our [website](' + config.domain + ':' + config.port + ')')
            .setTimestamp()
            .setDescription(name + " id: " + id);
        bot.channels.cache.get(chan.id).send(embed).catch(e => { return })*/
    } catch (err) { console.log(err) }
}