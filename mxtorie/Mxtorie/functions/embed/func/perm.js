const Discord = require("discord.js")
const config = require("../../../config.json")
const data = require("../../../database.json")
const color = require("../../../color.json")
const permissions = require("../../../permissions.json")
const ms = require("ms")
const pretty = require("pretty-ms")
const db = require("quick.db")
const fs = require("fs")

module.exports = async(client, message, database, lang) => {
    try {
        await database.query(`SELECT * FROM perm1 WHERE serverid = ${message.guild.id}`, async(error, result, fields) => {
            var p1
            var p2
            var p3
            var pg
            var pe
            p1 = result.map((i, n) => `${n+1} - ${i.type=='role'?`<@&${i.id}>`:`<@${i.id}>`}`)
            await database.query(`SELECT * FROM perm2 WHERE serverid = ${message.guild.id}`, async(error, result, fields) => {
                p2 = result.map((i, n) => `${n+1} - ${i.type=='role'?`<@&${i.id}>`:`<@${i.id}>`}`)
                await database.query(`SELECT * FROM perm3 WHERE serverid = ${message.guild.id}`, async(error, result, fields) => {
                    p3 = result.map((i, n) => `${n+1} - ${i.type=='role'?`<@&${i.id}>`:`<@${i.id}>`}`)
                    await database.query(`SELECT * FROM permg WHERE serverid = ${message.guild.id}`, async(error, result, fields) => {
                        pg = result.map((i, n) => `${n+1} - ${i.type=='role'?`<@&${i.id}>`:`<@${i.id}>`}`)
                        await database.query(`SELECT * FROM permeve WHERE serverid = ${message.guild.id}`, async(error, result, fields) => {
                            pe = result.map((i, n) => `${n+1} - ${i.type=='role'?`<@&${i.id}>`:`<@${i.id}>`}`)
                        let embed = new Discord.MessageEmbed()
                        if (p1.length < 1) {
                            embed.addField('**Permission 1**', lang.nooneperm + ' 1')
                        } else {
                            embed.addField('**Permission 1**', p1, false)
                        }
                        if (p2.length < 1) {
                            embed.addField('**Permission 2**', lang.nooneperm + ' 2')
                        } else {
                            embed.addField('**Permission 2**', p2, false)
                        }
                        if (p3.length < 1) {
                            embed.addField('**Permission 3**', lang.nooneperm + ' 3')
                        } else {
                            embed.addField('**Permission 3**', p3, false)
                        }
                        if (pg.length < 1) {
                            embed.addField('**Permission giveaway**', "Personne n'a la permission giveaway.")
                        } else {
                            embed.addField('**Permission giveaway**', pg, false)
                        }
                        if (pe.length < 1) {
                            embed.addField('**Permission mention everyone**', "Personne n'a la permisssion de mention everyone.")
                        } else {
                            embed.addField('**Permission mention everyone**', pe, false)
                        }
                        //embed.setTitle(lang.permtitle)
                        embed.setAuthor(message.guild.name, message.guild.iconURL({dynamic: true}))
                        embed.setFooter(message.guild.name)
                        embed.setTimestamp()
                        embed.setColor(color.purple)
                        message.channel.send(embed)
                    })
                    })
                })
            })

        })
    } catch (err) {
        console.log('Permission list embed : ' + err)
    }
}