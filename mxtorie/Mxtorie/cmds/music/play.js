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
const ytdl = require("ytdl-core");
const ytdlDiscord = require("ytdl-core-discord");
const yts = require("yt-search");
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


					let cani = db.fetch(`musicplay_${message.guild.id}`)
                    if (cani) return message.reply("Commande sous cooldown.")
                    db.set(`musicplay_${message.guild.id}`, true)
                    setTimeout(async () => {
                        db.set(`musicplay_${message.guild.id}`, false)
                    }, 5000)


                    let channel = message.member.voice.channel;
                    if (!channel) return sendError("Tu dois être dans un salon vocal !", message.channel);

                    const permissions2 = channel.permissionsFor(message.client.user);
                    if (!permissions2.has("CONNECT")) return sendError("Je ne peux pas me connecter à ton salon !", message.channel);
                    if (!permissions2.has("SPEAK")) return sendError("Je ne peux pas parler dans ton salon !", message.channel);

                    var searchString = args.join(" ");
                    if (!searchString) return sendError("Tu ne m'as pas dis ce que tu voulais que je joue.", message.channel);
                    const url = args[0] ? args[0].replace(/<(.+)>/g, "$1") : "";
                    var serverQueue = message.client.queue.get(message.guild.id);

                    let songInfo = null;
                    let song = null;
                    if (url.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi)) {
                        try {
                            songInfo = await ytdl.getInfo(url);
                            if (!songInfo) return sendError("Je n'ai pas été capable de trouver un résultat sur YouTube...", message.channel);
                            song = {
                                id: songInfo.videoDetails.videoId,
                                title: songInfo.videoDetails.title,
                                url: songInfo.videoDetails.video_url,
                                img: songInfo.player_response.videoDetails.thumbnail.thumbnails[0].url,
                                duration: songInfo.videoDetails.lengthSeconds,
                                ago: songInfo.videoDetails.publishDate,
                                views: String(songInfo.videoDetails.viewCount).padStart(10, " "),
                                req: message.author,
                            };
                        } catch (error) {
                            console.error(error);
                            return message.reply(error.message).catch(console.error);
                        }
                    } else {
                        try {
                            var searched = await yts.search(searchString);
                            if (searched.videos.length === 0) return sendError("Je n'ai pas été capable de trouver un résultat sur YouTube...", message.channel);

                            songInfo = searched.videos[0];
                            song = {
                                id: songInfo.videoId,
                                title: Util.escapeMarkdown(songInfo.title),
                                views: String(songInfo.views).padStart(10, " "),
                                url: songInfo.url,
                                ago: songInfo.ago,
                                duration: songInfo.duration.toString(),
                                img: songInfo.image,
                                req: message.author,
                            };
                        } catch (error) {
                            console.error(error);
                            return message.reply(error.message).catch(console.error);
                        }
                    }

                    if (serverQueue) {
                        serverQueue.songs.push(song);
                        let thing = new MessageEmbed()
                            .setAuthor("Musique ajouté à la file d'attente", mus.icon)
                            .setThumbnail(song.img)
                            .setColor("CYAN")
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
                            .setAuthor("Lancement", mus.icon)
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
                        play(queueConstruct.songs[0]);
                    } catch (error) {
                        console.error(`Je ne peux pas rejoindre le salon vocal : ${error}`);
                        message.client.queue.delete(message.guild.id);
                        await channel.leave();
                        return sendError(`Je ne peux pas rejoindre le salon vocal : ${error}`, message.channel);
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
    name: "play",
    aliases: [`p`, `jouer`],
    desc: ["Joue une musique", "Play a music"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "CONNECT", "SPEAK"],
    usage: ["play <lien d'une vidéo>", "play <nom d'une vidéo>"],
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