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
        if (message.author.id != '855759475729891328' && message.author.id != '668381000254095370') return
        client.users.cache.find(u => u.id === config.buyer).send(`🕙 **${getNow().time}** - Suite à la demande du bot gestion je vais redémarrer.`).catch(e => { })
        message.channel.send("Ok")
        setTimeout(() => {
            process.exit()
        }, 1500)
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

// return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

module.exports.help = {
    name: "hfgvbnfghfgfnbv",
    aliases: [`un autre nom ici`],
    desc: ["description fr", "description en"],
}