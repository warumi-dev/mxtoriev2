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
const yts = require("yt-search");
const ytdlDiscord = require("ytdl-core-discord");
var ytpl = require("ytpl");
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
					
                    let cani = db.fetch(`musicplaylist_${message.guild.id}`)
                    if (cani) return message.reply("Commande sous cooldown.")
                    db.set(`musicplaylist_${message.guild.id}`, true)
                    setTimeout(async () => {
                        db.set(`musicplaylist_${message.guild.id}`, false)
                    }, 5000)
                    
                    const channel = message.member.voice.channel;
                    if (!channel) return sendError("Tu dois être dans un salon vocal !", message.channel);
                    const url = args[0] ? args[0].replace(/<(.+)>/g, "$1") : "";
                    var searchString = args.join(" ");
                    const permissions2 = channel.permissionsFor(message.client.user);
                    if (!permissions2.has("CONNECT")) return sendError("Je ne peux pas me connecter à ton salon vocal !", message.channel);
                    if (!permissions2.has("SPEAK")) return sendError("Je ne peux pas parler dans ton salon vocal !", message.channel);

                    if (!searchString || !url) return sendError("Tu ne m'as pas dis ce que tu voulais que je joue.", message.channel);
                    if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
                        try {
                            const playlist = await ytpl(url.split("list=")[1]);
                            if (!playlist) return sendError("Playlist introuvable", message.channel);
                            const videos = await playlist.items;
                            for (const video of videos) {
                                // eslint-disable-line no-await-in-loop
                                await handleVideo(video, message, channel, true); // eslint-disable-line no-await-in-loop
                            }
                            return message.channel.send({
                                embed: {
                                    color: "GREEN",
                                    description: `✅  **|**  La playlist : **\`${videos[0].title}\`** a bien été ajouté à la file d'attente.`,
                                },
                            });
                        } catch (error) {
                            console.error(error);
                            return sendError("Playlist not found :(", message.channel).catch(console.error);
                        }
                    } else {
                        try {
                            var searched = await yts.search(searchString);

                            if (searched.playlists.length === 0) return sendError("Je n'ai pas été capable de trouver un résultat sur YouTube...", message.channel);
                            var songInfo = searched.playlists[0];
                            let listurl = songInfo.listId;
                            const playlist = await ytpl(listurl);
                            const videos = await playlist.items;
                            for (const video of videos) {
                                // eslint-disable-line no-await-in-loop
                                await handleVideo(video, message, channel, true); // eslint-disable-line no-await-in-loop
                            }
                            let thing = new MessageEmbed()
                                .setAuthor("Playlist ajouté à la file d'attente", mus.icon)
                                .setThumbnail(songInfo.thumbnail)
                                .setColor("GREEN")
                                .setDescription(`✅  **|**  La playlist : **\`${songInfo.title}\`** a ajouté \`${songInfo.videoCount}\` vidéo dans la file d'attente.`);
                            return message.channel.send(thing);
                        } catch (error) {
                            return sendError("Une erreur est survenue.", message.channel).catch(console.error);
                        }
                    }

                    async function handleVideo(video, message, channel, playlist = false) {
                        const serverQueue = message.client.queue.get(message.guild.id);
                        const song = {
                            id: video.id,
                            title: Util.escapeMarkdown(video.title),
                            views: video.views ? video.views : "-",
                            ago: video.ago ? video.ago : "-",
                            duration: video.duration,
                            url: `https://www.youtube.com/watch?v=${video.id}`,
                            img: video.thumbnail,
                            req: message.author,
                        };
                        if (!serverQueue) {
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

                            try {
                                var connection = await channel.join();
                                queueConstruct.connection = connection;
                                play(message.guild, queueConstruct.songs[0]);
                            } catch (error) {
                                console.error(`Je ne peux pas rejoindre le salon vocal : ${error}`);
                                message.client.queue.delete(message.guild.id);
                                return sendError(`Je ne peux pas rejoindre le salon vocal : ${error}`, message.channel);
                            }
                        } else {
                            serverQueue.songs.push(song);
                            if (playlist) return;
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
                        return;
                    }

                    async function play(guild, song) {
                        const serverQueue = message.client.queue.get(message.guild.id);
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
                                    if (serverQueue) {
                                        serverQueue.songs.shift();
                                        play(guild, serverQueue.songs[0]);
                                        return sendError(`Une erreur a été rencontré.\nRaison possible : \`${er}\``, message.channel);
                                    }
                                }
                            });
                        }

                        serverQueue.connection.on("disconnect", () => message.client.queue.delete(message.guild.id));
                        const dispatcher = serverQueue.connection.play(ytdl(song.url, { quality: "highestaudio", highWaterMark: 1 << 25, type: "opus" })).on("finish", () => {
                            const shiffed = serverQueue.songs.shift();
                            if (serverQueue.loop === true) {
                                serverQueue.songs.push(shiffed);
                            }
                            play(guild, serverQueue.songs[0]);
                        });

                        dispatcher.setVolume(serverQueue.volume / 100);
                        let thing = new MessageEmbed()
                            .setAuthor("Lancement", mus.icon)
                            .setThumbnail(song.img)
                            .setColor("BLUE")
                            .addField("Nom", song.title, true)
                            .addField("Durée", song.duration, true)
                            .addField("Demandé par", song.req.tag, true)
                            .setFooter(`Vues : ${song.views} | ${song.ago}`);
                        serverQueue.textChannel.send(thing);
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
    name: "playlist",
    aliases: [`pl`],
    desc: ["Jouer toute une playlist", "Play an entire playlist"],
    access_member: [""],
    access_bot: ["SEND_MESSAGES", "EMBED_LINKS", "CONNECT", "SPEAK"],
    usage: ["playlist <lien>", "playlist <nom d'une playlist>"],
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