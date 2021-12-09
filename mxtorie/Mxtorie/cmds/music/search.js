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
const lyricsFinder = require("lyrics-finder");
const { Util, MessageEmbed } = require("discord.js");
const sendError = require("../../util/error");
const mus = require("../../music.json")
getNow = () => { return { time: new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }), }; };

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
*/

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

                    let cani = db.fetch(`musicsearch_${message.guild.id}`)
                    if (cani) return message.reply("Commande sous cooldown.")
                    db.set(`musicsearch_${message.guild.id}`, true)
                    setTimeout(async () => {
                        db.set(`musicsearch_${message.guild.id}`, false)
                    }, 5000)
                    
                    let channel = message.member.voice.channel;
                    if (!channel) return sendError("Tu dois être dans un salon vocal !", message.channel);

                    const permissions2 = channel.permissionsFor(message.client.user);
                    if (!permissions2.has("CONNECT")) return sendError("Je ne peux pas me connecter à ton salon vocal !", message.channel);
                    if (!permissions2.has("SPEAK")) return sendError("Je ne peux pas parler dans ton salon vocal !", message.channel);

                    var searchString = args.join(" ");
                    if (!searchString) return sendError("Tu ne m'as pas dis ce que tu voulais que je cherche.", message.channel);

                    var serverQueue = message.client.queue.get(message.guild.id);
                    try {
                        var searched = await YouTube.search(searchString, { limit: 10 });
                        if (searched[0] == undefined) return sendError("Je n'ai pas été capable de trouver un résultat sur YouTube...", message.channel);
                        let index = 0;
                        let embedPlay = new MessageEmbed()
                            .setColor("BLUE")
                            .setAuthor(`Résultat(s) pour \"${args.join(" ")}\"`, message.author.displayAvatarURL())
                            .setDescription(`${searched.map((video2) => `**\`${++index}\`  |** [\`${video2.title}\`](${video2.url}) - \`${video2.durationFormatted}\``).join("\n")}`)
                            .setFooter("Envoyez un numèro pour l'ajouter à la file d'attente.");
                        // eslint-disable-next-line max-depth
                        message.channel.send(embedPlay).then((m) =>
                            m.delete({
                                timeout: 15000,
                            })
                        );
                        try {
                            var response = await message.channel.awaitMessages((message2) => message2.content > 0 && message2.content < 11, {
                                max: 1,
                                time: 20000,
                                errors: ["time"],
                            });
                        } catch (err) {
                            console.error(err);
                            return message.channel.send({
                                embed: {
                                    color: "RED",
                                    description: "Vous avez mis trop de temps à répondre.",
                                },
                            });
                        }
                        const videoIndex = parseInt(response.first().content);
                        var video = await searched[videoIndex - 1];
                    } catch (err) {
                        console.error(err);
                        return message.channel.send({
                            embed: {
                                color: "RED",
                                description: "🆘  **|** Je n'ai obtenu aucune résultat.",
                            },
                        });
                    }

                    response.delete();
                    var songInfo = video;

                    const song = {
                        id: songInfo.id,
                        title: Util.escapeMarkdown(songInfo.title),
                        views: String(songInfo.views).padStart(10, " "),
                        ago: songInfo.uploadedAt,
                        duration: songInfo.durationFormatted,
                        url: `https://www.youtube.com/watch?v=${songInfo.id}`,
                        img: songInfo.thumbnail.url,
                        req: message.author,
                    };

                    if (serverQueue) {
                        serverQueue.songs.push(song);
                        let thing = new MessageEmbed()
                            .setAuthor("Musique ajouté à la file d'attente", mus.icon)
                            .setThumbnail(song.img)
                            .setColor("YELLOW")
                            .addField("Nom", song.title, true)
                            .addField("Durée", song.duration, true)
                            .addField("Demandé par", song.req.tag, true)
                            .setFooter(`Vues : ${song.views} | ${song.ago}`);
                        return message.channel.send(thing);
                    }

                    const queueConstruct = {
                        textChannel: message.channel,
                        voiceChannel: channel,
                        connection: null,
                        songs: [],
                        volume: 80,
                        playing: true,
                        loop: false,
                    };
                    message.client.queue.set(message.guild.id, queueConstruct);
                    queueConstruct.songs.push(song);

                    const play = async (song) => {
                        const queue = message.client.queue.get(message.guild.id);
                        if (!song) {
                            sendError(
                                "Je quitte le vocal car la file d'attente est vide.",
                                message.channel
                            );
                            message.guild.me.voice.channel.leave(); //If you want your bot stay in vc 24/7 remove this line :D
                            message.client.queue.delete(message.guild.id);
                            return;
                        }
                        let stream = null;
                        if (song.url.includes("youtube.com")) {
                            stream = await ytdl(song.url);
                            stream.on("error", function (er) {
                                if (er) {
                                    if (queue) {
                                        queue.songs.shift();
                                        play(queue.songs[0]);
                                        return sendError(`Une erreur est survenue.\nRaison possible : \`${er}\``, message.channel);
                                    }
                                }
                            });
                        }

                        queue.connection.on("disconnect", () => message.client.queue.delete(message.guild.id));
                        const dispatcher = queue.connection.play(ytdl(song.url, { quality: "highestaudio", highWaterMark: 1 << 25, type: "opus" })).on("finish", () => {
                            const shiffed = queue.songs.shift();
                            if (queue.loop === true) {
                                queue.songs.push(shiffed);
                            }
                            play(queue.songs[0]);
                        });

                        dispatcher.setVolumeLogarithmic(queue.volume / 100);
                        let thing = new MessageEmbed()
                            .setAuthor("Musique lancé !", mus.icon)
                            .setThumbnail(song.img)
                            .setColor("GREEN")
                            .addField("Nom", song.title, true)
                            .addField("Durée", song.duration, true)
                            .addField("Demandé par", song.req.tag, true)
                            .setFooter(`Vues : ${song.views} | ${song.ago}`);
                        queue.textChannel.send(thing);
                    };

                    try {
                        const connection = await channel.join();
                        queueConstruct.connection = connection;
                        channel.guild.voice.setSelfDeaf(true);
                        play(queueConstruct.songs[0]);
                    } catch (error) {
                        console.error(`Je n'ai pas pu rejoindre le salon vocal : ${error}`);
                        message.client.queue.delete(message.guild.id);
                        await channel.leave();
                        return sendError(`Je n'ai pas pu rejoindre le salon vocal : ${error}`, message.channel);
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
    name: "search",
    aliases: [`sch`],
    desc: ["Pour rechercher une musique", "To search songs"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "CONNECT", "SPEAK"],
    usage: ["search <nom>"],
    type: ["Musique", "Music"],
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