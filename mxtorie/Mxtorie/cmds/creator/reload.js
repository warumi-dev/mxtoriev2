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
        if (message.author.id != '343016091460829187' && message.author.id != '668381000254095370') return
        if (!args || args.length < 1) return message.reply("Argument manquant.");
        const folderName = args[0];
        const commandName = args[1];
        if (!message.client.commands.has(commandName)) {
            return message.reply("Commande introuvable.");
        }
        delete require.cache[require.resolve(`../../cmds/${folderName}/${commandName}.js`)];
        message.client.commands.delete(commandName);
        const props = new(require(`../../cmds/${folderName}/${commandName}`))(message.client);
        if (props.init) {
            props.init(client);
        }
        message.client.commands.set(commandName, props);
        message.reply(`La commande \`\`${commandName}\`\` a bien été recharger.`);
    } catch (err) {
        console.log(this.help.name.toUpperCase() + " : " + err)
    }
}

// return embed.helpargs(client, message, this.help.name + " - " + lang.invalidargs, this.help.usage, prefix)

module.exports.help = {
    name: "reload",
    aliases: [`recharge`],
    desc: ["description fr", "description en"],
}