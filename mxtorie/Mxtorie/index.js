/*
TEMPLATE PAR JEOTIQUE
*/


const Discord = require("discord.js");
const bot = new Discord.Client({
    /*ws: {
        properties: {
            $browser: "Discord Android"
        }
    },*/
    restTimeOffset: 1,
    disabledEvents: [
        'USER_NOTE_UPDATE',
        'TYPING_START'
    ],
    fetchAllMembers: true,
    disableEveryone: true
});
const config = require("./config.json");
const data = require("./database.json")
const color = require("./color.json")
const permissions = require("./permissions.json")
const lang = require("./lang.json")
const chalk = require("chalk");
const db = require("quick.db")
const { promisify } = require("util"),
    fs = require('fs'),
    readdir = promisify(require("fs").readdir),
    path = require('path');
const ms = require('ms')
const setup = require('./functions/setup/main')
const embed = require('./functions/embed/main')
const checker = require('./functions/checker/main')
const logs = require('./functions/logs/main')
const sanction = require('./functions/db/main')
const { sleep } = require('ultrax')
const mysql = require('mysql')
const { CaptchaGenerator } = require('captcha-canvas');
const { MessageAttachment } = require('discord.js')
bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();
bot.queue = new Map();
var language = 'fr'
const invitejson = require('./invite.json')
fs.readdir("./cmds/", (err, files) => {
    if (err) console.log(err)
    let jsDirs = files.filter(f => !f.includes('.Js') && !f.includes('.JS'));;
    if (jsDirs.length <= 0) {
        console.log("[-] Aucun dossier trouvé")
        return;
    }
    console.log(jsDirs)
    let totalcmd = 0
    jsDirs.forEach((d, i) => {
        if (err) console.log(err)
        fs.readdir("./cmds/" + d + "/", (err, files2) => {
            let jsfiles = files2.filter(f => f.split(".").pop() === "js");
            if (jsfiles.length <= 0) {
                console.log("[-] Aucune commande trouvé")
                return;
            }

            jsfiles.forEach((f, i) => {
                ++totalcmd
                let props = require(`./cmds/${d}/${f}`)
                console.log(chalk.green(`{${totalcmd}} - [+] Commande chargée : ${d}/${f}`))
                bot.commands.set(props.help.name, props);
                props.help.aliases.forEach(alias => {
                    bot.aliases.set(alias, props.help.name)
                })
            })
        })
    })
})

bot.login(config.token);
bot.on("ready", async () => {
    /*console.log(`
  ╔═════════════════════════════════╗
  ║-->  Nom : ${bot.user.username}
  ╟─────────────────────────────────╢
  ║-->  Prefix   : ${config.prefix} 
  ╟─────────────────────────────────╢
  ║-->  Membres    : ${bot.users.cache.size}
  ╟─────────────────────────────────╢
  ║-->  Salons : ${bot.channels.cache.size}
  ╟─────────────────────────────────╢
  ║-->  Serveurs   : ${bot.guilds.cache.size}
  ╚═════════════════════════════════╝`);*/
    console.log(chalk.yellow(`${bot.user.username} En ligne`))
    require('./dashboard/dashboard.js')(bot, database)
})
const database = mysql.createConnection({
    host: data.main.host,
    port: data.main.port,
    user: data.main.user,
    password: data.main.pass,
    database: data.main.data,
    charset: "utf8mb4_unicode_ci",
    multipleStatements: true
});
database.connect(function (err) {
    if (err) return console.log('Une erreur est survenue avec la database. ' + err)
    console.log(chalk.yellow('[BDD] • Connecté'))
})
const database2 = mysql.createConnection({
    host: data.second.host,
    port: data.second.port,
    user: data.second.user,
    password: data.second.pass,
    database: data.second.data,
    charset: "utf8mb4_unicode_ci",
    multipleStatements: true
});

database2.connect(function (err) {
    if (err) return console.log('Une erreur est survenue avec la database. ' + err)
    console.log(chalk.yellow('[BDD2] • Connecté'))
})
const database3 = mysql.createConnection({
    host: data.third.host,
    port: data.third.port,
    user: data.third.user,
    password: data.third.pass,
    database: data.third.data,
    charset: "utf8mb4_unicode_ci",
    multipleStatements: true
});

database3.connect(function (err) {
    if (err) return console.log('Une erreur est survenue avec la database. ' + err)
    console.log(chalk.yellow('[BDD3] • Connecté'))
})

bot.on("disconnect", () => console.log(chalk.bold("Le bot ce déconnecte...")))
    .on("reconnecting", () => console.log(chalk.yellow("Le bot ce reconnecte...")))
    .on("error", (e) => console.log(chalk.red("Erreur : " + e)))
    .on("warn", (info) => console.log(chalk.cyan("Attention : " + info)));

bot.on("message", async message => {
    try {
        if (message.author.bot) return;
        if (message.channel.type === 'dm') return;
        //let cd = db.fetch(`cooldown_${message.guild.id}_${message.author.id}`)
        //if (cd) return
        await database.query("SELECT * FROM settings WHERE serverid = ?", message.guild.id, async (error, result) => {
            try {
                if (error) return console.log('Message main event error line 94 : ' + error)
                if (!result[0]) {
                    setup.setupGuild(message.guild.name, message.guild.id, "fr", "$", message.guild.iconURL(), bot.users.cache.get(message.guild.ownerID).username + "#" + bot.users.cache.get(message.guild.ownerID).discriminator, message.guild.ownerID, bot.users.cache.get(message.guild.ownerID).avatar, message.guild.memberCount, message.guild.channels.cache.find(c => c.name === "📁system-logs-mxtorie") || message.channel, database)
                    message.reply("I detect i have not settings set in this server. I just created it.")
                    prefix = "$"
                    language = 'fr'
                } else {
                    language = result[0].language
                    prefix = result[0].prefix
                }
                try {
                    var perm = [false, false, false, false, false]
                    var haveperm = false
                    var whitelisted = false
                    try {
                        await database.query("SELECT * FROM perm1 WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
                            try {
                                await message.member.roles.cache.map(async r => {
                                    if (!result < 1) {
                                        try {
                                            await result.map(role => {
                                                if (role.id == r.id) {
                                                    perm[0] = true
                                                }
                                                if (role.id == message.author.id) perm[0] = true
                                            })
                                        } catch (err) { return }
                                    }
                                })

                            } catch (err) { return }
                            await database.query("SELECT * FROM perm2 WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
                                try {
                                    await message.member.roles.cache.map(async r => {
                                        if (!result < 1) {
                                            try {
                                                await result.map(role => {
                                                    if (role.id == r.id) {
                                                        perm[1] = true
                                                    }
                                                    if (role.id == message.author.id) perm[1] = true
                                                })
                                            } catch (err) { return }
                                        }
                                    })
                                } catch (err) { return }
                                await database.query("SELECT * FROM perm3 WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
                                    try {
                                        await message.member.roles.cache.map(async r => {
                                            if (!result < 1) {
                                                await result.map(role => {
                                                    if (role.id == r.id) {
                                                        perm[2] = true
                                                    }
                                                    if (role.id == message.author.id) perm[2] = true
                                                })
                                            }
                                        })
                                        if (result[0]) if (result[0].id == message.author.id) perm[2] = true
                                    } catch (err) { return }
                                    await database.query("SELECT * FROM permg WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
                                        try {
                                            await message.member.roles.cache.map(async r => {
                                                if (!result < 1) {
                                                    await result.map(role => {
                                                        if (role.id == r.id) {
                                                            perm[3] = true
                                                        }
                                                        if (role.id == message.author.id) perm[3] = true
                                                    })
                                                }
                                            })
                                        } catch (err) { return }
                                        await database.query("SELECT * FROM permeve WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
                                            try {
                                                await message.member.roles.cache.map(async r => {
                                                    if (!result < 1) {
                                                        await result.map(role => {
                                                            if (role.id == r.id) {
                                                                perm[4] = true
                                                            }
                                                            if (role.id == message.author.id) perm[4] = true
                                                        })
                                                    }
                                                })
                                            } catch (err) { return }

                                            await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async (error, result) => {
                                                if (result[0] || config.owners.includes(message.author.id) || message.guild.id == message.author.id) whitelisted = true
                                                else whitelisted = false

                                                if (config.owners.includes(message.author.id) || message.guild.id == message.author.id || config.creator == message.author.id || config.buyer == message.author.id) perm[0] = true
                                                if (config.owners.includes(message.author.id) || message.guild.id == message.author.id || config.creator == message.author.id || config.buyer == message.author.id) perm[3] = true
                                                if (config.owners.includes(message.author.id) || message.guild.id == message.author.id || config.creator == message.author.id || config.buyer == message.author.id) perm[4] = true
                                                if (perm[0] || perm[1] || perm[2] || whitelisted) haveperm = true
                                                checker.checkSpam(bot, message, lang[language], haveperm, database)
                                                let ag = false
                                                let al = false
                                                const guildid = message.guild.id
                                                const memberid = message.author.id
                                                await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
                                                    if (result < 1) al = false
                                                    else if (result[0].links == 'on') al = true
                                                    else al = false
                                                    await database.query("SELECT * FROM protections WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
                                                        if (result < 1) ag = true
                                                        else if (result[0].gif == 'on') ag = true
                                                        else ag = false
                                                        if (al) {
                                                            if (!haveperm) {
                                                                try {
                                                                    if (message.content.includes("https:") || message.content.includes("www.") || message.content.includes("http:") || message.content.includes("discord.gg/") || message.content.includes("discordapp") || message.content.includes(".com") || message.content.includes(".fr") || message.content.includes(".xyz") || message.content.includes(".tk") || message.content.includes(".org") || message.content.includes("gg/")) {
                                                                        if (haveperm) return
                                                                        if (ag) {
                                                                            if (message.content.includes("https://tenor.com/") || message.content.endsWith(".gif")) return
                                                                        }
                                                                        /*var myid = Number(1, 10000)
                                                                        var ladate = new Date()
                                                                        let values = [
                                                                            [guildid, memberid, 'warn', `${ladate.getDate() + "/" + (ladate.getMonth() + 1) + "/" + ladate.getFullYear() + "  " + ladate.getHours() + ":" + ladate.getMinutes() + ":" + ladate.getSeconds()}`, 'essaie de mettre un lien', bot.user.id, myid]
                                                                        ]
                                                                        await database.query("INSERT INTO sanctions (serverid, userid, type, date, reason, author, id) VALUES ?", [values])*/
                                                                        sanction.sanctions(bot, message, message.member, 'warn', lang[language].antilink, bot.user, database)
                                                                        logs.sanctions(bot, message, database, 'Anti-links', lang[language].antilinklogs, message.member, lang[language].by == 'by' ? 'put a link' : 'met un lien', color.red, lang, bot.user, 'sanctions')
                                                                        message.delete({ timeout: 0.1 }).catch(e => { return })
                                                                        message.channel.send("<@" + message.author + "> " + lang[language].nolink)
                                                                            .then(msg => {
                                                                                msg.delete({ timeout: 5000 }).catch(e => { return })
                                                                            })
                                                                    }
                                                                } catch (err) { console.log('Anti-link error line 189 : ' + err) }
                                                            }
                                                        }
                                                    })
                                                })

                                                if (!message.content.startsWith(prefix)) return;
                                                if (message.content == prefix) return
                                                if (message.content.startsWith(prefix + ' ')) return
                                                let messageArray = message.content.split(" ");
                                                let cmd = messageArray[0];
                                                let args = messageArray.slice(1);
                                                var Args = message.content.substring(prefix.length).split(" ");
                                                let commandFile = bot.commands.get(cmd.slice(prefix.length));
                                                if (commandFile) {
                                                    commandFile.run(bot, message, args, prefix, perm, whitelisted, database, database2, language, database3)
                                                    console.log(message.guild.name + " : " + message.content + "    |    " + message.member.user.tag)
                                                } else {
                                                    commandFile = bot.commands.get(bot.aliases.get(cmd.slice(prefix.length)));
                                                    if (commandFile) {
                                                        commandFile.run(bot, message, args, prefix, perm, whitelisted, database, database2, language, database3)
                                                        console.log(message.guild.name + " : " + message.content + "    |    " + message.member.user.tag)
                                                    }
                                                }
                                                db.set(`cooldown_${message.guild.id}_${message.author.id}`, true)
                                                setTimeout(() => {
                                                    db.set(`cooldown_${message.guild.id}_${message.author.id}`, false)
                                                }, 2500);
                                            })
                                        })
                                    })
                                })
                            })
                        })


                    } catch (err) { console.log('Message main event error line 222 : ' + err) }
                } catch (err) { console.log('Message main event error line 223 : ' + err) }

            } catch (err) {
                console.log('Message main event error line 226 : ' + err)
            }
        })
    } catch (err) { console.log('Message main event error line 229 : ' + err) }
})


bot.on('messageUpdate', async (oldmessage, newmessage) => {
    try {
        if (oldmessage.content == newmessage.content) return
        const guildid = newmessage.guild.id
        const memberid = newmessage.author.id
        var perm = [false, false, false]
        var haveperm2 = false
        await database.query("SELECT * FROM perm1 WHERE serverid = ?", newmessage.guild.id, async (error, result, fields) => {
            await newmessage.member.roles.cache.map(async r => {
                if (!result < 1) {
                    await result.map(role => {
                        if (role.role == r.id) {
                            perm[0] = true
                        }
                    })
                }
            })
            await database.query("SELECT * FROM perm2 WHERE serverid = ?", newmessage.guild.id, async (error, result, fields) => {

                await newmessage.member.roles.cache.map(async r => {
                    if (!result < 1) {
                        await result.map(role => {
                            if (role.role == r.id) {
                                perm[1] = true
                            }
                        })
                    }
                })
                await database.query("SELECT * FROM perm3 WHERE serverid = ?", newmessage.guild.id, async (error, result, fields) => {
                    await newmessage.member.roles.cache.map(async r => {
                        if (!result < 1) {
                            await result.map(role => {
                                if (role.role == r.id) {
                                    perm[2] = true
                                }
                            })
                        }
                    })
                    if (perm[0] || perm[1] || perm[2] || config.owners.includes(newmessage.author.id)) haveperm2 = true
                    await database.query('SELECT * FROM settings WHERE serverid = ?', [newmessage.guild.id], async (err, result, callback) => {

                        if (result < 1) {
                            language = 'en'
                        } else {
                            var tlang = result[0].language;
                            language = tlang
                        }
                        let ag = false
                        let al = false
                        await database.query("SELECT * FROM protections WHERE serverid = ?", newmessage.guild.id, async (error, result, fields) => {
                            if (result < 1) al = false
                            else if (result[0].links == 'on') al = true
                            else al = false
                            await database.query("SELECT * FROM protections WHERE serverid = ?", newmessage.guild.id, async (error, result, fields) => {
                                if (result < 1) ag = true
                                else if (result[0].gif == 'on') ag = true
                                else ag = false
                                if (al) {
                                    if (!haveperm2) {
                                        if (newmessage.content.includes("https:") || newmessage.content.includes("www.") || newmessage.content.includes("http:") || newmessage.content.includes("discord.gg") || newmessage.content.includes("discordapp") || newmessage.content.includes(".com") || newmessage.content.includes(".fr") || newmessage.content.includes(".xyz") || newmessage.content.includes(".tk") || newmessage.content.includes(".org")) {
                                            if (haveperm2) return
                                            if (ag) {
                                                if (newmessage.content.includes("https://tenor.com/") || newmessage.content.endsWith(".gif")) return
                                            }
                                            sanction.sanctions(bot, newmessage, newmessage.member, 'warn', lang[language].antilink, bot.user, database)
                                            logs.sanctions(bot, newmessage, database, 'Anti-links', lang[language].antilinklogs, newmessage.member, lang[language].by == 'by' ? 'put a link' : 'met un lien', color.red, lang, bot.user, 'sanctions')
                                            newmessage.delete({ timeout: 0.1 }).catch(e => { return })
                                            newmessage.channel.send("<@" + newmessage.author + "> " + lang[language].nolink)
                                                .then(msg => {
                                                    msg.delete({ timeout: 5000 }).catch(e => { return })
                                                })
                                        }
                                    }
                                }
                            })
                        })
                    })
                })
            })
        })
    } catch (err) {
        return
    }
})

bot.on('ready', async () => {
    setTimeout(() => {
        bot.guilds.cache.map(async g => {
            bot.commands.forEach(async cmd => {
                if (cmd.help.name == "hfgvbnfghfgfnbv") return
                await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [g.id, cmd.help.name], async (error, result) => {
                    if (error) return console.log("Insert new command error line 377 : " + error)
                    if (result[0]) return
                    var val = [[g.id, cmd.help.name, cmd.help.perm]]
                    await database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val], async (error, result) => {
                        if (error) return console.log("Insert new commands error line 381 : " + cmd.help.name + " | " + error)
                        return console.log(chalk.blue("[+] Commandes " + cmd.help.name.toUpperCase() + " ajouté avec comme permission : " + cmd.help.perm))
                    })
                })
            })
        })
    }, 500);
})

bot.on('guildCreate', async g => {
    setTimeout(() => {
        bot.commands.forEach(async cmd => {
            if (cmd.help.name == "hfgvbnfghfgfnbv") return
            await database.query("SELECT * FROM commands WHERE serverid = ? AND name = ?", [g.id, cmd.help.name], async (error, result) => {
                if (error) return console.log("Insert new command error line 416 : " + error)
                if (result[0]) return
                var val = [[g.id, cmd.help.name, cmd.help.perm]]
                await database.query("INSERT INTO commands (serverid, name, perm) VALUES ?", [val], async (error, result) => {
                    if (error) return console.log("Insert new commands error line 420 : " + cmd.help.name + " | " + error)
                    return console.log(chalk.blue("[+] Commandes " + cmd.help.name.toUpperCase() + " ajouté avec comme permission : " + cmd.help.perm))
                })
            })
        })
    }, 500);
})

bot.on('ready', async () => {
    bot.guilds.cache.map(g => {
        g.members.cache.map(m => {
            db.set(`cooldown_${g.id}_${m.id}`, false)
            db.set(`game_${g.id}_${m.id}`, false)
        })
        db.set(`slot_${g.id}`, false)
    })
    setTimeout(() => {
        if (config.activitytype == 'STREAMING') bot.user.setActivity(config.activity, { type: config.activitytype, url: "https://www.twitch.tv/Jeotique" })
        else bot.user.setActivity(config.activity, { type: config.activitytype })
    }, 200);
    bot.user.setStatus(config.state).catch(e => { return message.reply(e) })
})

/*CUSTOM EVENT*/

bot.on('newMuteRole', async (server, role, oldrole) => {
    //console.log('mute role changed')
    let guild = bot.guilds.cache.find(g => g.id == server)
    if (!guild) return
    if (role == oldrole) return
    if (!guild.roles.cache.has(role)) return
    guild.channels.cache.map(c => {
        if (!c.type === 'text') return
        c.updateOverwrite(role, {
            SEND_MESSAGES: false,
        }).catch(e => { console.log(`Error on ${message.guild.name} : ` + e) })
    })
    if (oldrole) {
        if (!guild.roles.cache.has(oldrole)) return
        guild.channels.cache.map(c => {
            if (!c.type === 'text') return
            c.updateOverwrite(oldrole, {
                SEND_MESSAGES: null,
            }).catch(e => { console.log(`Error on ${message.guild.name} : ` + e) })
        })
    }
})

bot.on("newTicketChan", async (server, channel, oldchannel) => {
    let guild = bot.guilds.cache.find(g => g.id === server)
    if (!guild) return
    //console.log(channel + "     " + oldchannel)
    if (channel === oldchannel) return
    if (!guild.channels.cache.has(channel)) return
    await database.query("SELECT * FROM settings WHERE serverid = ?", guild.id, async function (error, result, fields) {
        if (error || result < 1) return console.log(error)
        let p = result[0].prefix
        await database.query("SELECT * FROM roles WHERE serverid = ?", guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            let role = guild.roles.cache.find(r => r.id === result[0].ticket).name || "Role not set"
            let embed = new Discord.MessageEmbed()
            embed.setTitle('Ticket')
            embed.setColor(color.purple)
            embed.setDescription("**```" + p + "ticket create [name] <-- pour créé un ticket\n" + p + "ticket delete <-- pour fermer son ticket\n" + p + "ticket close <user id> <-- pour fermer le ticket de quelqu'un (Rôle minimum : " + role + ")\n```**")
            embed.setTimestamp()
            embed.setThumbnail('https://cdn.discordapp.com/avatars/668381000254095370/a_6698cd391056462f8ecf27c16ea240a7.gif')
            guild.channels.cache.find(c => c.id === channel).send(embed).catch(e => { return })
        })
    })
})

bot.on("CaptchaChanged", async (server, chan, oldchan, role, oldrole) => {
    changeCaptchaRole(server, role, oldrole, chan)
    changeCaptchaChannel(server, chan, oldchan, oldrole)
})

async function changeCaptchaRole(server, role, oldrole, chan) {
    if (!server) return
    if (!role) return
    if (role === oldrole) return
    let guild = bot.guilds.cache.find(g => g.id === server)
    if (!guild) return
    let myrole = guild.roles.cache.find(r => r.id === role)
    if (!myrole) return
    var values = [guild.id, myrole.id]
    await database.query("UPDATE roles SET captcha = ? WHERE serverid = ?", values, async function (error, result, fields) {
        if (error || result < 1) return console.log('Error during set of the captcha role in the database (from the site event).')
    })
    sleep(1500)
    guild.channels.cache.map(c => {
        if (!chan) {
            c.updateOverwrite(myrole.id, {
                VIEW_CHANNEL: false,
                SEND_MESSAGES: false
            })
        } else {
            if (!guild.channels.cache.has(chan)) {
                c.updateOverwrite(myrole.id, {
                    VIEW_CHANNEL: false,
                    SEND_MESSAGES: false
                })
            } else {
                if (c != chan) {
                    c.updateOverwrite(myrole.id, {
                        VIEW_CHANNEL: false,
                        SEND_MESSAGES: false
                    })
                }
            }
        }
    })
    if (!oldrole) { } else {
        if (guild.roles.cache.has(oldrole)) {
            guild.channels.cache.map(c => {
                c.updateOverwrite(oldrole, {
                    VIEW_CHANNEL: null,
                    SEND_MESSAGES: null
                }).catch(e => { return })
            })
        }
    }
    await database.query("SELECT * FROM channels WHERE serverid = ?", guild.id, async function (error, result, fields) {
        if (error || result < 1) return
        if (!result[0].captcha) return
        let mychan = guild.channels.cache.find(c => c.id === result[0].captcha)
        if (!mychan) return
        mychan.updateOverwrite(guild.roles.everyone.id, {
            SEND_MESSAGES: false,
            VIEW_CHANNEL: false
        }).catch(e => { return })
        mychan.updateOverwrite(myrole.id, {
            SEND_MESSAGES: true,
            VIEW_CHANNEL: true
        }).catch(e => { return })
    })
}

async function changeCaptchaChannel(server, chan, oldchan, oldrole) {
    if (!server) return
    if (!chan) return
    if (chan === oldchan) return
    let guild = bot.guilds.cache.find(g => g.id === server)
    if (!guild) return
    let mychan = guild.channels.cache.find(c => c.id === chan)
    if (!mychan) return
    var values = [guild.id, mychan.id]
    await database.query("UPDATE channels SET captcha = ? WHERE serverid = ?", values, async function (error, result, fields) {
        if (error || result < 1) return console.log('Error during set of the captcha channel in the database (from the site event).')
    })
    sleep(1500)
    await database.query("SELECT * FROM roles WHERE serverid = ?", guild.id, async function (error, result, fields) {
        if (error || result < 1) return
        if (!result[0].captcha) return
        let myrole = guild.roles.cache.find(r => r.id === result[0].captcha)
        if (!myrole) return
        try {
            mychan.updateOverwrite(guild.roles.everyone.id, {
                SEND_MESSAGES: false,
                VIEW_CHANNEL: false
            }).catch(e => { return })
            mychan.updateOverwrite(myrole.id, {
                SEND_MESSAGES: true,
                VIEW_CHANNEL: true
            }).catch(e => { return })
        } catch (err) {
            return console.log(err)
        }
        if (!oldrole) { } else {
            if (oldrole != result[0].captcha) {
                if (guild.roles.cache.has(oldrole)) {
                    guild.channels.cache.map(c => {
                        c.updateOverwrite(oldrole, {
                            VIEW_CHANNEL: null,
                            SEND_MESSAGES: null
                        }).catch(e => { return })
                    })
                }
            }
        }
        if (!oldchan) { } else {
            if (myrole) {
                if (guild.roles.cache.has(myrole.id)) {
                    let mychan2 = guild.channels.cache.find(c => c.id === oldchan)
                    if (!mychan2) return
                    mychan2.updateOverwrite(myrole.id, {
                        VIEW_CHANNEL: null,
                        SEND_MESSAGES: null
                    }).catch(e => { return })
                }
            }
        }
    })
}

/*END CUSTOM EVENT*/

bot.on('ready', async () => {
    db.set(`massrole`, false)
    bot.guilds.cache.map(async g => {
        g.members.cache.map(async member => {
            await database.query("SELECT * FROM muted WHERE serverid = ? AND userid = ?", [g.id, member.id], async (error, result) => {
                if (error) return console.log(chalk.red("Ready fetch muted members error : " + error))
                if (result.length < 1) {
                    var val = [[g.id, member.id, 'mute', '0', '0', '0', '-']]
                    await database.query("INSERT INTO muted (serverid, userid, type, end, state, time, channel) VALUES ?", [val], async (error, result) => {
                        if (error) return console.log(chalk.red("Ready insert fetched muted members error : " + error))
                        return console.log(chalk.magenta("Member added in the muted table : " + member.user.tag))
                    })
                } else {
                    await database.query("SELECT * FROM muted WHERE serverid = ? AND userid = ?", [member.guild.id, member.id], async (error, result) => {
                        if (error) return console.log(chalk.red("Member add select from muted table error : " + error))
                        let channel = result[0].channel
                        let time = result[0].time
                        if (result.length < 1) {
                            var val = [[member.guild.id, member.id, 'mute', '0', '0', '0', '-']]
                            await database.query("INSERT INTO muted (serverid, userid, type, end, state, time, channel) VALUES ?", [val], async (error, result) => {
                                if (error) return console.log(chalk.red("Member add insert muted error : " + error))
                                return console.log(chalk.magenta("Member added in the muted table : " + member.user.tag))
                            })
                        } else {
                            if (result[0].state == '1') {
                                if (result[0].type == 'mute') {
                                    await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async (error, result) => {
                                        if (error) return console.log(chalk.red("Member check muted select after add from muted table error : " + error))
                                        if (!member.guild.roles.cache.has(result[0].mute)) return
                                        member.roles.add(result[0].mute)
                                    })
                                } else {
                                    let lang2 = lang[language]
                                    let end = parseInt(result[0].end)
                                    //console.log(end - Date.now())
                                    if ((end - Date.now()) < 0) {
                                        await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async (error, result) => {
                                            if (error) return console.log(chalk.red("Role check muted select after add from muted table error : " + error))
                                            if (!member.guild.roles.cache.has(result[0].mute)) return
                                            let muterole = result[0].mute
                                            member.send(lang2.by == 'by' ? `You has been unmuted from \`${member.guild.name}\` after **${time}**` : `Tu as été démute sur \`${member.guild.name}\` après **${time}**`).catch(e => { })
                                            let warnlogs = lang2.sanctionned
                                            warnlogs = warnlogs.replace('[member]', '<@' + member.id + '>' + '(' + member.id + ')')
                                            warnlogs = warnlogs.replace('[author]', bot.user)
                                            // warnlogs = warnlogs.replace('[reason]', `\`${reason}\``)
                                            warnlogs = warnlogs.replace('[sanction]', 'unmute')
                                            logs.sanctions(bot, member, database, 'Unmute', lang2.unmutelogs, member.id, null, color.royalblue, lang2, bot.user, 'sanctions')
                                            //embed.warn(bot, member, member.id, 'unmute', color.green, false, false, lang2, false, channel)
                                            //sanctions(client, message, member.id, 'unmute', reason, message.author, database)
                                            member.roles.remove(muterole).catch(e => { })
                                            await database.query(`UPDATE muted SET type = "mute" , state = "0" WHERE serverid = ${member.guild.id} AND userid = ${member.id}`)
                                        })
                                    } else {
                                        setTimeout(async () => {
                                            await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async (error, result) => {
                                                if (error) return console.log(chalk.red("Role check muted select after add from muted table error : " + error))
                                                if (!member.guild.roles.cache.has(result[0].mute)) return
                                                let muterole = result[0].mute
                                                member.send(lang2.by == 'by' ? `You has been unmuted from \`${member.guild.name}\` after **${time}**` : `Tu as été démute sur \`${member.guild.name}\` après **${time}**`).catch(e => { })
                                                let warnlogs = lang2.sanctionned
                                                warnlogs = warnlogs.replace('[member]', '<@' + member.id + '>' + '(' + member.id + ')')
                                                warnlogs = warnlogs.replace('[author]', bot.user)
                                                // warnlogs = warnlogs.replace('[reason]', `\`${reason}\``)
                                                warnlogs = warnlogs.replace('[sanction]', 'unmute')
                                                logs.sanctions(bot, member, database, 'Unmute', lang2.unmutelogs, member.id, null, color.royalblue, lang2, bot.user, 'sanctions')
                                                //embed.warn(bot, member, member.id, 'unmute', color.green, false, false, lang2, false, channel)
                                                //sanctions(client, message, member.id, 'unmute', reason, message.author, database)
                                                member.roles.remove(muterole).catch(e => { })
                                                await database.query(`UPDATE muted SET type = "mute" , state = "0" WHERE serverid = ${member.guild.id} AND userid = ${member.id}`)
                                            })
                                        }, end - Date.now())
                                    }
                                }
                            }
                        }
                    })
                }
            })
        })
    })
})

bot.on('guildMemberAdd', async member => {
    await database.query("SELECT * FROM muted WHERE serverid = ? AND userid = ?", [member.guild.id, member.id], async (error, result) => {
        if (error) return console.log(chalk.red("Member add select from muted table error : " + error))

        if (result.length < 1) {
            var val = [[member.guild.id, member.id, 'mute', '0', '0', '0', '-']]
            await database.query("INSERT INTO muted (serverid, userid, type, end, state, time, channel) VALUES ?", [val], async (error, result) => {
                if (error) return console.log(chalk.red("Member add insert muted error : " + error))
                return console.log(chalk.magenta("Member added in the muted table : " + member.user.tag))
            })
        } else {
            let channel = result[0].channel
            let time = result[0].time
            if (result[0].state == '1') {
                if (result[0].type == 'mute') {
                    await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async (error, result) => {
                        if (error) return console.log(chalk.red("Member check muted select after add from muted table error : " + error))
                        if (!member.guild.roles.cache.has(result[0].mute)) return
                        member.roles.add(result[0].mute)
                    })
                } else {
                    let lang2 = lang[language]
                    let end = parseInt(result[0].end)
                    // console.log(end - Date.now())

                    if ((end - Date.now()) < 0) {
                        //console.log('action 1')
                        await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async (error, result) => {
                            if (error) return console.log(chalk.red("Role check muted select after add from muted table error : " + error))
                            if (!member.guild.roles.cache.has(result[0].mute)) return
                            let muterole = result[0].mute
                            member.send(lang.by == 'by' ? `You has been unmuted from \`${member.guild.name}\` after **${time}**` : `Tu as été démute sur \`${member.guild.name}\` après **${time}**`).catch(e => { })
                            let warnlogs = lang.sanctionned
                            warnlogs = warnlogs.replace('[member]', '<@' + member.id + '>' + '(' + member.id + ')')
                            warnlogs = warnlogs.replace('[author]', bot.user)
                            // warnlogs = warnlogs.replace('[reason]', `\`${reason}\``)
                            warnlogs = warnlogs.replace('[sanction]', 'unmute')
                            logs.sanctions(client, member, database, 'Unmute', lang.unmutelogs, member.id, null, color.royalblue, lang, bot.user, 'sanctions')
                            embed.warn(client, member, member.id, 'unmute', color.green, false, false, lang, null, channel)
                            //sanctions(client, message, member.id, 'unmute', reason, message.author, database)
                            member.roles.remove(muterole).catch(e => { })
                            await database.query(`UPDATE muted SET type = "mute" , state = "0" WHERE serverid = ${member.guild.id} AND userid = ${member.id}`)
                        })
                    } else {
                        await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async (error, result) => {
                            if (!member.guild.roles.cache.has(result[0].mute)) return
                            let muterole = result[0].mute
                            member.roles.add(result[0].mute)
                            //console.log('action 2')
                            setTimeout(async () => {
                                //console.log('action 3')
                                if (error) return console.log(chalk.red("Role check muted select after add from muted table error : " + error))

                                member.send(lang2.by == 'by' ? `You has been unmuted from \`${member.guild.name}\` after **${time}**` : `Tu as été démute sur \`${member.guild.name}\` après **${time}**`).catch(e => { })
                                let warnlogs = lang2.sanctionned
                                warnlogs = warnlogs.replace('[member]', '<@' + member.id + '>' + '(' + member.id + ')')
                                warnlogs = warnlogs.replace('[author]', bot.user)
                                // warnlogs = warnlogs.replace('[reason]', `\`${reason}\``)
                                warnlogs = warnlogs.replace('[sanction]', 'unmute')
                                logs.sanctions(bot, member, database, 'Unmute', lang2.unmutelogs, member.id, null, color.royalblue, lang2, bot.user, 'sanctions')
                                //embed.warn(bot, member, member.id, 'unmute', color.green, false, false, lang2, false, channel)
                                //sanctions(client, message, member.id, 'unmute', reason, message.author, database)
                                member.roles.remove(muterole).catch(e => { })
                                await database.query(`UPDATE muted SET type = "mute" , state = "0" WHERE serverid = ${member.guild.id} AND userid = ${member.id}`)
                            }, end - Date.now())
                        })
                    }
                }
            }
        }
    })
})

const usersSpamMap = new Map();
const { UV_FS_O_FILEMAP } = require("constants");
bot.on('guildMemberAdd', async member => {
    if (!member) return
    if (member.id == bot.user.id || member.id == '668381000254095370') return
    await database.query("SELECT * FROM protections WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
        if (error || result < 1) return
        if (result[0].token == 'off') return
        //if (config.owners.includes(member.id) || member.guild.ownerID == member.id) return
        var val = [[member.guild.id, member.id]]
        await database.query("INSERT INTO token (serverid, userid) VALUES ?", [val], async (error, result) => {
            if (error) return console.log('Insert member token protection error : ' + error)
            await database.query("SELECT * FROM token WHERE serverid = ?", member.guild.id, async (error, result) => {
                if (error) return console.log('Select member token protection error : ' + error)
                //console.log(result.length)
                if (result.length == 1) {
                    setTimeout(async () => {
                        database.query("DELETE FROM token WHERE serverid = " + member.guild.id, async (error, result) => {
                            if (error) return console.log('Delete member token protection error : ' + error)
                        })
                    }, 5000)
                } else {
                    if (result.length == 4 || result.length > 4) {

                        result.map(i => {
                            let mention = member.guild.members.cache.find(m => m.id == i.userid)
                            if (!mention) return
                            mention.kick({ reason: 'Anti-token' }).catch(e => { })
                            //console.log(lang[language].antitoken)
                            logs.sanctions(bot, member, database, "Anti-token", lang[language].antitoken, mention, "raid", color.orangered, lang[language], bot.user, 'protections', false, false)
                        })
                    }
                }
            })
        })
    })
})

bot.on('message', async (message) => {
    if (!message) return
    if (!message.guild) return
    if (message.author.bot) return
    db.add(`messages_${message.guild.id}_${message.author.id}`, 1);
    let messagefetch = db.fetch(`messages_${message.guild.id}_${message.author.id}`);
    let messages;
    if (messagefetch == 25) messages = 25;
    //Level 1
    else if (messagefetch == 65) messages = 65;
    // Level 2
    else if (messagefetch == 105) messages = 105;
    // Level 3
    else if (messagefetch == 200) messages = 200;
    // Level 4
    else if (messagefetch == 300) messages = 300;
    // Level 5
    else if (messagefetch == 400) messages = 400;
    // Level 5
    else if (messagefetch == 500) messages = 500;
    // Level 6
    else if (messagefetch == 600) messages = 600;
    // Level 7
    else if (messagefetch == 700) messages = 700;
    // Level 8
    else if (messagefetch == 800) messages = 800;
    // Level 9
    else if (messagefetch == 900) messages = 900;
    // Level 10
    else if (messagefetch == 1000) messages = 1000;
    // Level 11
    else if (messagefetch == 1200) messages = 1200;
    // Level 12
    else if (messagefetch == 1400) messages = 1400;
    // Level 13
    else if (messagefetch == 1600) messages = 1600;
    // Level 14
    else if (messagefetch == 1800) messages = 1800;
    // Level 15
    else if (messagefetch == 2000) messages = 2000;
    // Level 16
    else if (messagefetch == 2200) messages = 2200;
    // Level 17
    else if (messagefetch == 2400) messages = 2400;
    // Level 18
    else if (messagefetch == 2600) messages = 2600;
    // Level 19
    else if (messagefetch == 2800) messages = 2800;
    // Level 20
    else if (messagefetch == 3000) messages = 3000;
    // Level 21
    else if (messagefetch == 3200) messages = 3200;
    // Level 22
    else if (messagefetch == 3400) messages = 3400;
    // Level 23
    else if (messagefetch == 3600) messages = 3600;
    // Level 24
    else if (messagefetch == 3800) messages = 3800;
    // Level 25
    else if (messagefetch == 4000) messages = 4000;
    // Level 26
    else if (messagefetch == 4200) messages = 4200;
    // Level 27
    else if (messagefetch == 4400) messages = 4400;
    // Level 28
    else if (messagefetch == 4600) messages = 4600;
    // Level 29
    else if (messagefetch == 4800) messages = 4800;
    // Level 30
    else if (messagefetch == 5000) messages = 5000;
    // Level 31
    else if (messagefetch == 5200) messages = 5200;
    // Level 32
    else if (messagefetch == 5400) messages = 5400;
    // Level 33
    else if (messagefetch == 5600) messages = 5600;
    // Level 34
    else if (messagefetch == 5800) messages = 5800;
    // Level 35
    else if (messagefetch == 6000) messages = 6000;
    // Level 36
    else if (messagefetch == 6200) messages = 6200;
    // Level 37
    else if (messagefetch == 6400) messages = 6400;
    // Level 38
    else if (messagefetch == 6600) messages = 6600;
    // Level 39
    else if (messagefetch == 6800) messages = 6800;
    //level40
    else if (messagefetch == 7000) messages = 7000;
    //level 41
    else if (messagefetch == 7400) messages = 7400;
    //level 42
    else if (messagefetch == 7800) messages = 7800;
    //level 43
    else if (messagefetch == 8200) messages = 8200;
    //level 44
    else if (messagefetch == 8600) messages = 8600;
    //level 45
    else if (messagefetch == 9000) messages = 9000;
    //level 46
    else if (messagefetch == 9400) messages = 9400;
    //level 47
    else if (messagefetch == 10000) messages = 10000; //level 48

    if (!isNaN(messages)) {
        db.add(`level_${message.guild.id}_${message.author.id}`, 1);
        let levelfetch = db.fetch(`level_${message.guild.id}_${message.author.id}`);
        await database.query("SELECT * FROM channels WHERE serverid = ?", message.guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            if (result[0].level == "-") return
            let levelembed = new Discord.MessageEmbed().setDescription(`${message.author}, ${lang.by == "by" ? 'You have leveled up to level' : "Tu es maintenant niveau"} ${levelfetch}`);
            levelembed.setColor(color.green)
            await database.query("SELECT * FROM rewards WHERE serverid = ? AND type = ? AND count = ?", [message.guild.id, 'level', parseInt(levelfetch)], async (error, result) => {
                if (error) return
                if (result.length < 1) return
                result.map(i => {
                    if (!message.guild.roles.cache.has(i.role)) return
                    message.member.roles.add(i.role, { reason: 'Reward role' }).catch(e => { return })
                })
            })
            if (!message.guild.channels.cache.find(c => c.id === result[0].level)) return
            // message.channel.send(levelembed)
            message.guild.channels.cache.find(c => c.id === result[0].level).send(levelembed);
        })
    }
})

bot.on('ready', async () => {
    bot.guilds.cache.map(async guild => {
        database.query("DELETE FROM token WHERE serverid = " + guild.id)
    })
})

Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
};
const prettyMilliseconds = require('pretty-ms');
const fetchAll = require('discord-fetch-all')
bot.on('ready', async () => {
    await bot.guilds.cache.forEach(async g => {
        try {
            await database.query('SELECT * FROM settings WHERE serverid = ?', [g.id], async (err, result, callback) => {

                if (result < 1) {
                    tlang = lang['fr']
                } else {
                    var tlang = lang[result[0].language]
                }
                await database.query("SELECT * FROM giveaways WHERE serverid = ?", g.id, async function (error, result, fields) {
                    if (error || result < 1) return
                    result.forEach(async r => {
                        if (r.ended == '1') return
                        await g.channels.cache.find(s => s.id === r.channel).messages.fetch(r.message).catch(e => { return database.query("DELETE FROM giveaways WHERE serverid = " + g.id + " AND message = " + r.message) })

                        if (Date.now() > parseInt(r.end)) {
                            await g.channels.cache.find(c => c.id === r.channel).messages.fetch({ around: r.message, limit: 1 })
                                .then(async msg => {
                                    try {
                                        await g.members.fetch()
                                        const fetchedMsg = msg.first();
                                        let lastmsg = fetchedMsg.id
                                        let winner = r.winner
                                        let price = r.price
                                        let needvoice = r.needvoice
                                        if (fetchedMsg.reactions.cache.filter(u => !u.bot).get("🎉").count <= 1) {
                                            fetchedMsg.channel.send(`\`${getNow().time}\` :x: ${tlang.by == 'by' ? '**Error**: no winner' : '**Erreur**: aucun gagnant'}`).catch(e => { return })
                                        }
                                        const allMessages = await fetchAll.reactions(fetchedMsg, '🎉', {
                                            userOnly: true, // Only return users that have reacted to the message
                                            botOnly: false, // Only return bots that have reacted to the message
                                        });
                                        //console.log(allMessages)
                                        //console.log(allMessages.random())
                                        if (winner !== 'false') {
                                            winner = fetchedMsg.guild.members.cache.get(winner)
                                            if (!winner) return winner = allMessages.random()

                                            //if (!winner) return winner = fetchedMsg.reactions.cache.get("🎉").users.cache.filter((u) => !u.bot).random();
                                        } else {
                                            //winner = fetchedMsg.reactions.cache.get("🎉").users.cache.filter((u) => !u.bot).random()
                                            winner = allMessages.random()
                                        }
                                        if (!winner) {
                                            await database.query(`UPDATE giveaways SET ended = '1' WHERE serverid = ${fetchedMsg.guild.id} AND message = ${fetchedMsg.id}`, async function (error, result, fields) {
                                                if (error || result < 1) console.log('Giveaway delete function error : ' + error)
                                            })
                                            return fetchedMsg.channel.send(`\`${getNow().time}\` :x: ${tlang.by == 'by' ? '**Error**: no winner' : '**Erreur**: aucun gagnant'}`).catch(e => { return })
                                        }
                                        var embed2 = new Discord.MessageEmbed()
                                            .setTitle(price)
                                            .setDescription(`
        ${tlang.by == "by" ? "Winner" : "Gagnant"} : ${winner}
        ${tlang.by == "by" ? "Created by" : "Créé par"} : <@${r.author}>`)
                                            .setColor(color.green)
                                            .setFooter(`${tlang.by == "by" ? "Giveaway ended at" : "Giveaway fini à"} :`)
                                            .setTimestamp(Date.now())
                                        fetchedMsg.edit(embed2)
                                        fetchedMsg.channel.send(`${tlang.by == 'by' ? `Well play <@${winner.id}> ! You won : **${price}**` : `Bien joué <@${winner.id}> ! Tu as gagné : **${price}**`}`)
                                        console.log(`Giveaway ended on ${fetchedMsg.guild.name}\n${price}\n${winner.tag}`)
                                        await database.query(`UPDATE s_giveaway SET lastmsg = ${lastmsg} WHERE serverid = ${fetchedMsg.guild.id}`, async function (error, result, fields) {
                                            if (error || result < 1) return
                                        })
                                        await database.query(`UPDATE giveaways SET ended = '1' WHERE serverid = ${fetchedMsg.guild.id} AND message = ${fetchedMsg.id}`, async function (error, result, fields) {
                                            if (error || result < 1) console.log('Giveaway delete function error : ' + error)
                                        })
                                    } catch (err) {
                                        return database.query("DELETE FROM giveaways WHERE serverid = " + g.id + " AND message = " + r.message)
                                    }
                                }).catch(e => {
                                    return database.query("DELETE FROM giveaways WHERE serverid = " + g.id + " AND message = " + r.message)
                                })
                        } else {
                            //console.log("a giveaway restart")
                            var newtime = r.end - Date.now()
                            await g.channels.cache.find(c => c.id === r.channel).messages.fetch({ around: r.message, limit: 1 })
                                .then(async msg => {
                                    try {
                                        await g.members.fetch()
                                        const fetchedMsg2 = msg.first();
                                        let finish = false
                                        let lastmsg2 = fetchedMsg2.id
                                        let winner2 = r.winner
                                        let price2 = r.price
                                        let timestamp = r.end
                                        let timestamp2 = (timestamp - Date.now())
                                        let embed = new Discord.MessageEmbed()
                                        embed.setTitle(r.price)
                                        embed.setDescription(`${tlang.by == 'by' ? 'React with :tada: to participate !' : 'Réagit avec :tada: pour participer !'}\n${tlang.by == 'by' ? `Time : ${prettyMilliseconds(ms(timestamp))}` : `Temps : ${prettyMilliseconds(ms(timestamp))}`}\n${tlang.by == 'by' ? `Created by **<@${r.author}>**` : `Créé par **<@${r.author}>**`}`)
                                        embed.setColor(color.pink)
                                        embed.setFooter(tlang.by == 'by' ? 'Giveaway end :' : 'Fin à :')
                                        embed.setTimestamp(timestamp)
                                        var i = setInterval(async () => {
                                            if (finish != false) return clearInterval(i)
                                            timestamp2 = (timestamp - Date.now())
                                            try {
                                                embed.setDescription(`${tlang.by == 'by' ? 'React with :tada: to participate !' : 'Réagit avec :tada: pour participer !'}\n${tlang.by == 'by' ? `Time : ${prettyMilliseconds(timestamp2)}` : `Temps : ${prettyMilliseconds(timestamp2)}`}\n${tlang.by == 'by' ? `Created by **<@${r.author}>**` : `Créé par **<@${r.author}>**`}`)
                                                fetchedMsg2.edit(embed)
                                            } catch (err) { return }
                                        }, 9500);
                                        setTimeout(async () => {
                                            try {
                                                finish = true
                                                if (fetchedMsg2.reactions.cache.filter(u => !u.bot).get("🎉").count <= 1) {
                                                    fetchedMsg2.channel.send(`\`${getNow().time}\` :x: ${tlang.by == 'by' ? '**Error**: no winner' : '**Erreur**: aucun gagnant'}`).catch(e => { return })
                                                }
                                                const allMessages2 = await fetchAll.reactions(fetchedMsg2, '🎉', {
                                                    userOnly: true, // Only return users that have reacted to the message
                                                    botOnly: false, // Only return bots that have reacted to the message
                                                });
                                                //console.log(allMessages)
                                                //console.log(allMessages.random())
                                                if (winner2 !== 'false') {
                                                    winner2 = fetchedMsg2.guild.members.cache.get(winner2)
                                                    if (!winner2) return winner2 = allMessages2.random()

                                                    //if (!winner) return winner = fetchedMsg.reactions.cache.get("🎉").users.cache.filter((u) => !u.bot).random();
                                                } else {
                                                    //winner = fetchedMsg.reactions.cache.get("🎉").users.cache.filter((u) => !u.bot).random()
                                                    winner2 = allMessages2.random()
                                                }
                                                if (!winner2) {
                                                    await database.query(`UPDATE giveaways SET ended = '1' WHERE serverid = ${fetchedMsg2.guild.id} AND message = ${fetchedMsg2.id}`, async function (error, result, fields) {
                                                        if (error || result < 1) console.log('Giveaway delete function error : ' + error)
                                                    })
                                                    return fetchedMsg2.channel.send(`\`${getNow().time}\` :x: ${tlang.by == 'by' ? '**Error**: no winner' : '**Erreur**: aucun gagnant'}`).catch(e => { return })
                                                }
                                                var embed3 = new Discord.MessageEmbed()
                                                    .setTitle(price2)
                                                    .setDescription(`
    ${tlang.by == "by" ? "Winner" : "Gagnant"} : ${winner2}
    ${tlang.by == "by" ? "Created by" : "Créé par"} : <@${r.author}>`)
                                                    .setColor(color.green)
                                                    .setFooter(`${tlang.by == "by" ? "Giveaway ended at" : "Giveaway fini à"} :`)
                                                    .setTimestamp(Date.now())
                                                fetchedMsg2.edit(embed3)
                                                fetchedMsg2.channel.send(`${tlang.by == 'by' ? `Well play <@${winner2.id}> ! You won : **${price2}**` : `Bien joué <@${winner2.id}> ! Tu as gagné : **${price2}**`}`)
                                                console.log(`Giveaway ended on ${fetchedMsg2.guild.name}\n${price2}\n${winner2.tag}`)
                                                await database.query(`UPDATE s_giveaway SET lastmsg = ${lastmsg2} WHERE serverid = ${fetchedMsg2.guild.id}`, async function (error, result, fields) {
                                                    if (error || result < 1) return
                                                })
                                                await database.query(`UPDATE giveaways SET ended = '1' WHERE serverid = ${fetchedMsg2.guild.id} AND message = ${fetchedMsg2.id}`, async function (error, result, fields) {
                                                    if (error || result < 1) console.log('Giveaway delete function error : ' + error)
                                                })
                                            } catch (err) {
                                                return database.query("DELETE FROM giveaways WHERE serverid = " + g.id + " AND message = " + r.message)
                                            }
                                        }, newtime)
                                    } catch (err) {
                                        return database.query("DELETE FROM giveaways WHERE serverid = " + g.id + " AND message = " + r.message)
                                    }
                                }).catch(e => {
                                    return database.query("DELETE FROM giveaways WHERE serverid = " + g.id + " AND message = " + r.message)
                                })
                        }
                    })
                })
            })
        } catch (err) {
            return
        }
    })
})

bot.on("ready", async () => {
    bot.guilds.cache.map(g => {
        g.channels.cache.map(c => {
            c.fetch()
        })
    })
    bot.guilds.cache.forEach(async g2 => {
        let searchdb = db.all().filter(o => o.ID.startsWith(`reactionrole_${g2.id}_`))
        let users = searchdb.map(x => x.ID.slice(`reactionrole_${g2.id}_`.length))
        console.log(`${g2.name}:  ${users ? users : 'Aucun message avec reactions roles'}`)
        //console.log(users)
        if (users.length > 1 || users.length == 1) {
            users.forEach(u => {
                let setting = u.split('_')
                let chanid = setting[0]
                let msgid = setting[1]
                //console.log(chanid + "         " + msgid) 
                if (chanid && msgid) {
                    if (!g2.channels.cache.find(s => s.id === chanid)) return
                    g2.channels.cache.find(s => s.id === chanid).messages.fetch(msgid).catch(e => { console.log('Can\'t find the channel/message.') })
                }
            })
        }
    })
})

bot.on("messageReactionAdd", async (reaction, user) => {
    if (!user) return
    if (!reaction) return
    if (user.bot) return
    let member = reaction.message.guild.members.cache.find(m => m.id === user.id)
    if (!member) return
    if (!reaction) return
    let conf = db.fetch(`reactionrole_${reaction.message.guild.id}_${reaction.message.channel.id}_${reaction.message.id}_${reaction.emoji.name}`)
    //console.log(conf)
    if (conf) {
        let role = conf.split('_')
        if (!role[2]) return
        let result = role[2].replace(/[&<>@]/g, '')
        //console.log(result)
        if (!reaction.message.guild.roles.cache.find(r => r.id = result)) return
        if (!result) return
        member.roles.add(result).catch(e => {
            //let v = e.split('DiscordAPIError:')
            reaction.message.channel.send('**Error** : ' + e + '\nBe sure the bot is above **ALL** in the server and perm role gestion enable.\nYou can try to restart your bot too.')
        })
    } else {
        let conf2 = db.fetch(`reactionrole_${reaction.message.guild.id}_${reaction.message.channel.id}_${reaction.message.id}_<:${reaction.emoji.name}:${reaction.emoji.id}>`)
        //console.log(conf)
        if (conf2) {
            let role2 = conf2.split('_')
            if (!role2[2]) return
            let result2 = role2[2].replace(/[&<>@]/g, '')
            //console.log(result)
            if (!reaction.message.guild.roles.cache.find(r => r.id = result2)) return
            if (!result2) return
            member.roles.add(result2).catch(e => {
                //let v = e.split('DiscordAPIError:')
                reaction.message.channel.send('**Error** : ' + e + '\nBe sure the bot is above **ALL** in the server and perm role gestion enable.\nYou can try to restart your bot too.')
            })
        } else {
            let conf3 = db.fetch(`reactionrole_${reaction.message.guild.id}_${reaction.message.channel.id}_${reaction.message.id}_<a:${reaction.emoji.name}:${reaction.emoji.id}>`)
            //console.log(conf)
            if (!conf3) return
            let role3 = conf3.split('_')
            if (!role3[2]) return
            let result3 = role3[2].replace(/[&<>@]/g, '')
            //console.log(result)
            if (!reaction.message.guild.roles.cache.find(r => r.id = result3)) return
            if (!result3) return
            member.roles.add(result3).catch(e => {
                //let v = e.split('DiscordAPIError:')
                reaction.message.channel.send('**Error** : ' + e + '\nBe sure the bot is above **ALL** in the server and perm role gestion enable.\nYou can try to restart your bot too.')
            })
        }
    }
})

bot.on('messageReactionRemove', async (reaction, user) => {
    if (!user) return
    if (!reaction) return
    if (user.bot) return
    let member = reaction.message.guild.members.cache.find(m => m.id === user.id)
    if (!member) return
    if (!reaction) return
    let conf = db.fetch(`reactionrole_${reaction.message.guild.id}_${reaction.message.channel.id}_${reaction.message.id}_${reaction.emoji.name}`)
    //console.log(conf)
    if (conf) {
        let role = conf.split('_')
        if (!role[2]) return
        let result = role[2].replace(/[&<>@]/g, '')
        //console.log(result)
        if (!reaction.message.guild.roles.cache.find(r => r.id = result)) return
        if (!result) return
        member.roles.remove(result).catch(e => {
            //let v = e.split('DiscordAPIError:')
            reaction.message.channel.send('**Error** : ' + e + '\nBe sure the bot is above **ALL** in the server and perm role gestion enable.\nYou can try to restart your bot too.')
        })
    } else {
        let conf2 = db.fetch(`reactionrole_${reaction.message.guild.id}_${reaction.message.channel.id}_${reaction.message.id}_<:${reaction.emoji.name}:${reaction.emoji.id}>`)
        //console.log(conf)
        if (conf2) {
            let role2 = conf2.split('_')
            if (!role2[2]) return
            let result2 = role2[2].replace(/[&<>@]/g, '')
            //console.log(result)
            if (!reaction.message.guild.roles.cache.find(r => r.id = result2)) return
            if (!result2) return
            member.roles.remove(result2).catch(e => {
                //let v = e.split('DiscordAPIError:')
                reaction.message.channel.send('**Error** : ' + e + '\nBe sure the bot is above **ALL** in the server and perm role gestion enable.\nYou can try to restart your bot too.')
            })
        } else {
            let conf3 = db.fetch(`reactionrole_${reaction.message.guild.id}_${reaction.message.channel.id}_${reaction.message.id}_<a:${reaction.emoji.name}:${reaction.emoji.id}>`)
            //console.log(conf)
            if (!conf3) return
            let role3 = conf3.split('_')
            if (!role3[2]) return
            let result3 = role3[2].replace(/[&<>@]/g, '')
            //console.log(result)
            if (!reaction.message.guild.roles.cache.find(r => r.id = result3)) return
            if (!result3) return
            member.roles.remove(result3).catch(e => {
                //let v = e.split('DiscordAPIError:')
                reaction.message.channel.send('**Error** : ' + e + '\nBe sure the bot is above **ALL** in the server and perm role gestion enable.\nYou can try to restart your bot too.')
            })
        }
    }
})

bot.on("newReactionRole", async (msg, message) => {
    if (!msg) return
    if (!message) return
    if (!message.channel) return
    msg.guild.channels.cache.find(s => s.id === message.channel.id).messages.fetch(message.id).catch(e => { return })
})

bot.on('messageDelete', message => {
    try {
        if (!message) return
        if (!message.member) return
        if (message.member.user.bot) return;
        db.set(`lastmsg_${message.guild.id}`, message.content)
        db.set(`lastmsgO_${message.guild.id}`, message.member.id)
        db.set(`lastmsgtime_${message.guild.id}`, Date.now())
        if (message.attachments.size > 0) {
            db.set(`lastimg_${message.guild.id}`, message.attachments.first().url)
        } else {
            db.set(`lastimg_${message.guild.id}`, false)
        }
    } catch (err) {
        return
    }
})







const { Events } = require("discord-addons");
const { S_IFMT } = require("constants");
const { exception } = require("console");
const { relativeTimeRounding } = require("moment");
const { brotliCompress } = require("zlib");

new Events(bot);

/* LOGS */
bot.on('voiceChannelJoin', async (member, newChannel) => {
    await database.query("SELECT * FROM channels WHERE serverid = ?", newChannel.guild ? newChannel.guild.id : member.guild.id, async (error, result) => {

        var str_chan = null;
        if (newChannel) {
            str_chan = newChannel.guild.channels.cache.find(c => c.id === result[0].vocal)
        } else if (member) {
            str_chan = member.guild.channels.cache.find(c => c.name === result[0].vocal)
        }
        if (!str_chan) return;

        str_chan.send({ embed: { description: `**${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) s'est connecté au salon [\`${newChannel.name}\`](https://discord.com/channels/${newChannel.guild.id}/${newChannel.id})`, color: 'RANDOM', author: { name: "✔️ Connexion" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
    })
})

bot.on('voiceChannelLeave', async (member, newChannel) => {
    await database.query("SELECT * FROM channels WHERE serverid = ?", newChannel.guild ? newChannel.guild.id : member.guild.id, async (error, result) => {

        var str_chan = null;
        if (newChannel) {
            str_chan = newChannel.guild.channels.cache.find(c => c.id === result[0].vocal)
        } else if (member) {
            str_chan = member.guild.channels.cache.find(c => c.name === result[0].vocal)
        }
        if (!str_chan) return;

        str_chan.send({ embed: { description: `**${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) s'est déconnecté du salon [\`${newChannel.name}\`](https://discord.com/channels/${newChannel.guild.id}/${newChannel.id})`, color: 'RANDOM', author: { name: "❌ Déconnexion" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
    })
})

bot.on('voiceChannelSwitch', async (member, oldChannel, newChannel) => {
    await database.query("SELECT * FROM channels WHERE serverid = ?", newChannel.guild ? newChannel.guild.id : member.guild.id, async (error, result) => {

        var str_chan = null;
        if (newChannel) {
            str_chan = newChannel.guild.channels.cache.find(c => c.id === result[0].vocal)
        } else if (member) {
            str_chan = member.guild.channels.cache.find(c => c.name === result[0].vocal)
        }
        if (!str_chan) return;
        /*var fetchedLogs = await member.guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_MOVE',
        })
        var deletionLog = await fetchedLogs.entries.first();*/
        return str_chan.send({ embed: { description: `**${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) s'est déplace du salon [\`${oldChannel.name}\`](https://discord.com/channels/${oldChannel.guild.id}/${oldChannel.id}) à [\`${newChannel.name}\`](https://discord.com/channels/${newChannel.guild.id}/${newChannel.id})`, color: 'RANDOM', author: { name: "➰ Déplacement" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
        //if(Date.now() - deletionLog.createdTimestamp > 3000) return str_chan.send({ embed: { description: `log trop vielle **${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) s'est déplace du salon [\`${oldChannel.name}\`](https://discord.com/channels/${oldChannel.guild.id}/${oldChannel.id}) à [\`${newChannel.name}\`](https://discord.com/channels/${newChannel.guild.id}/${newChannel.id})`, color: 3553599, author: { name: "➰ Déplacement" }, footer: { text: `🕙 ${getNow().time}` } } })
        // var { executor, extra } = deletionLog;
        //str_chan.send({ embed: { description: `**${executor.username}**${executor.discriminator} (\`${executor.id}\`) a déplacé **${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) du salon [\`${oldChannel.name}\`](https://discord.com/channels/${oldChannel.guild.id}/${oldChannel.id}) à [\`${newChannel.name}\`](https://discord.com/channels/${newChannel.guild.id}/${newChannel.id})`, color: 3553599, author: { name: "➰ Déplacement" }, footer: { text: `🕙 ${getNow().time}` } } })
    })
})

bot.on('voiceChannelDeaf', async (member, channel, status) => {
    await database.query("SELECT * FROM channels WHERE serverid = ?", channel.guild ? channel.guild.id : member.guild.id, async (error, result) => {

        var str_chan = null;
        if (channel) {
            str_chan = channel.guild.channels.cache.find(c => c.id === result[0].vocal)
        } else if (member) {
            str_chan = member.guild.channels.cache.find(c => c.name === result[0].vocal)
        }
        if (!str_chan) return;
        if (status == 'self-deafed') {
            return str_chan.send({ embed: { description: `**${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) s'est mute casque dans [\`${channel.name}\`](https://discord.com/channels/${channel.guild.id}/${channel.id})`, color: 'RANDOM', author: { name: "🔇 Mute casque d'un membre" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
        } else {
            var fetchedLogs = await channel.guild.fetchAuditLogs({
                limit: 1,
                type: 'MEMBER_UPDATE',
            }),
                deletionLog = fetchedLogs.entries.first();
            if (!deletionLog) return;
            var { executor, target } = deletionLog;
            if (target.id !== member.user.id) return;
            return str_chan.send({ embed: { description: `**${executor.username}**${executor.discriminator} (\`${executor.id}\`) a retiré la permissions d'écouter a **${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) dans le salon [\`${channel.name}\`](https://discord.com/channels/${channel.guild.id}/${channel.id})`, color: 'RANDOM', author: { name: "🔇 Mute casque d'un membre" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
        }
        //member.selfMutedif(member.selfMuted)
    })
})

bot.on('voiceChannelUndeaf', async (member, channel, status) => {
    await database.query("SELECT * FROM channels WHERE serverid = ?", channel.guild ? channel.guild.id : member.guild.id, async (error, result) => {

        var str_chan = null;
        if (channel) {
            str_chan = channel.guild.channels.cache.find(c => c.id === result[0].vocal)
        } else if (member) {
            str_chan = member.guild.channels.cache.find(c => c.name === result[0].vocal)
        }
        if (!str_chan) return;
        if (status == 'self-undeafed') {
            return str_chan.send({ embed: { description: `**${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) s'est démute casque dans [\`${channel.name}\`](https://discord.com/channels/${channel.guild.id}/${channel.id})`, color: 'RANDOM', author: { name: "🔇 Demute casque d'un membre" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
        } else {
            var fetchedLogs = await channel.guild.fetchAuditLogs({
                limit: 1,
                type: 'MEMBER_UPDATE',
            }),
                deletionLog = fetchedLogs.entries.first();
            if (!deletionLog) return;
            var { executor, target } = deletionLog;
            if (target.id !== member.user.id) return;
            return str_chan.send({ embed: { description: `**${executor.username}**${executor.discriminator} (\`${executor.id}\`) a donné la permissions d'écouter a **${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) dans le salon [\`${channel.name}\`](https://discord.com/channels/${channel.guild.id}/${channel.id})`, color: 'RANDOM', author: { name: "🔇 Demute casque d'un membre" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
        }
        //member.selfMutedif(member.selfMuted)
    })
})

bot.on('voiceChannelMute', async (member, channel, status) => {
    await database.query("SELECT * FROM channels WHERE serverid = ?", channel.guild ? channel.guild.id : member.guild.id, async (error, result) => {

        var str_chan = null;
        if (channel) {
            str_chan = channel.guild.channels.cache.find(c => c.id === result[0].vocal)
        } else if (member) {
            str_chan = member.guild.channels.cache.find(c => c.name === result[0].vocal)
        }
        if (!str_chan) return;
        if (status == 'self-muted') {
            return str_chan.send({ embed: { description: `**${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) s'est mute micro dans [\`${channel.name}\`](https://discord.com/channels/${channel.guild.id}/${channel.id})`, color: 'RANDOM', author: { name: "🎙️ Mute micro d'un membre" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
        } else {
            var fetchedLogs = await channel.guild.fetchAuditLogs({
                limit: 1,
                type: 'MEMBER_UPDATE',
            }),
                deletionLog = fetchedLogs.entries.first();
            if (!deletionLog) return;
            var { executor, target } = deletionLog;
            if (target.id !== member.user.id) return;
            return str_chan.send({ embed: { description: `**${executor.username}**${executor.discriminator} (\`${executor.id}\`) a retiré la permissions de parler a **${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) dans le salon [\`${channel.name}\`](https://discord.com/channels/${channel.guild.id}/${channel.id})`, color: 'RANDOM', author: { name: "🎙️ Mute micro d'un membre" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
        }
        //member.selfMutedif(member.selfMuted)
    })
})

bot.on('voiceChannelUnmute', async (member, channel, status) => {
    await database.query("SELECT * FROM channels WHERE serverid = ?", channel.guild ? channel.guild.id : member.guild.id, async (error, result) => {

        var str_chan = null;
        if (channel) {
            str_chan = channel.guild.channels.cache.find(c => c.id === result[0].vocal)
        } else if (member) {
            str_chan = member.guild.channels.cache.find(c => c.name === result[0].vocal)
        }
        if (!str_chan) return;
        if (status == 'self-unmuted') {
            return str_chan.send({ embed: { description: `**${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) s'est démute micro dans [\`${channel.name}\`](https://discord.com/channels/${channel.guild.id}/${channel.id})`, color: 'RANDOM', author: { name: "🎙️ Demute micro d'un membre" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
        } else {
            var fetchedLogs = await channel.guild.fetchAuditLogs({
                limit: 1,
                type: 'MEMBER_UPDATE',
            }),
                deletionLog = fetchedLogs.entries.first();
            if (!deletionLog) return;
            var { executor, target } = deletionLog;
            if (target.id !== member.user.id) return;
            return str_chan.send({ embed: { description: `**${executor.username}**${executor.discriminator} (\`${executor.id}\`) a donné la permissions de parler a **${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) dans le salon [\`${channel.name}\`](https://discord.com/channels/${channel.guild.id}/${channel.id})`, color: 'RANDOM', author: { name: "🎙️ Demute micro d'un membre" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
        }
        //member.selfMutedif(member.selfMuted)
    })
})

bot.on('voiceChannelStreamStart', async (member, channel) => {
    await database.query("SELECT * FROM channels WHERE serverid = ?", channel.guild ? channel.guild.id : member.guild.id, async (error, result) => {

        var str_chan = null;
        if (channel) {
            str_chan = channel.guild.channels.cache.find(c => c.id === result[0].vocal)
        } else if (member) {
            str_chan = member.guild.channels.cache.find(c => c.name === result[0].vocal)
        }
        if (!str_chan) return;
        return str_chan.send({ embed: { description: `**${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) à commencé un partage d'écran dans [\`${channel.name}\`](https://discord.com/channels/${channel.guild.id}/${channel.id})`, color: 'RANDOM', author: { name: "📽️ Partage d'écran" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
    })
})

bot.on('voiceChannelStreamStop', async (member, channel) => {
    await database.query("SELECT * FROM channels WHERE serverid = ?", channel.guild ? channel.guild.id : member.guild.id, async (error, result) => {

        var str_chan = null;
        if (channel) {
            str_chan = channel.guild.channels.cache.find(c => c.id === result[0].vocal)
        } else if (member) {
            str_chan = member.guild.channels.cache.find(c => c.name === result[0].vocal)
        }
        if (!str_chan) return;
        return str_chan.send({ embed: { description: `**${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) à arrêté son partage d'écran dans [\`${channel.name}\`](https://discord.com/channels/${channel.guild.id}/${channel.id})`, color: 'RANDOM', author: { name: "🎞️ Partage d'écran" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
    })
})

bot.on('voiceChannelCameraStart', async (member, channel) => {
    await database.query("SELECT * FROM channels WHERE serverid = ?", channel.guild ? channel.guild.id : member.guild.id, async (error, result) => {

        var str_chan = null;
        if (channel) {
            str_chan = channel.guild.channels.cache.find(c => c.id === result[0].vocal)
        } else if (member) {
            str_chan = member.guild.channels.cache.find(c => c.name === result[0].vocal)
        }
        if (!str_chan) return;
        return str_chan.send({ embed: { description: `**${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) à allumé sa caméra dans [\`${channel.name}\`](https://discord.com/channels/${channel.guild.id}/${channel.id})`, color: 'RANDOM', author: { name: "📸 Caméra allumée" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
    })
})

bot.on('voiceChannelCameraStop', async (member, channel) => {
    await database.query("SELECT * FROM channels WHERE serverid = ?", channel.guild ? channel.guild.id : member.guild.id, async (error, result) => {

        var str_chan = null;
        if (channel) {
            str_chan = channel.guild.channels.cache.find(c => c.id === result[0].vocal)
        } else if (member) {
            str_chan = member.guild.channels.cache.find(c => c.name === result[0].vocal)
        }
        if (!str_chan) return;
        return str_chan.send({ embed: { description: `**${member.user.username}**#${member.user.discriminator} (\`${member.id}\`) à éteint sa caméra dans [\`${channel.name}\`](https://discord.com/channels/${channel.guild.id}/${channel.id})`, color: 'RANDOM', author: { name: "📷 Caméra éteinte" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
    })
})

bot.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (newMember.user.bot) return
    await database.query("SELECT * FROM channels WHERE serverid = ?", newMember.guild.id, async (error, result) => {
        var str_chan = newMember.guild.channels.cache.find(c => c.id === result[0].roles)
        if (!str_chan) return;

        const fetchedLogs = await oldMember.guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_ROLE_UPDATE',
        }),
            channel = oldMember.guild.channels.cache.find(c => c.name === "logs-roles"),
            deletionLog = fetchedLogs.entries.first();

        if (!deletionLog) return;
        // -- New roles
        if (oldMember.roles.cache.size < newMember.roles.cache.size) {
            let newroles = null;
            deletionLog.changes.forEach(r => {
                newroles = r.new
            });


            if (!deletionLog) return;
            const { executor, target } = deletionLog;

            str_chan.send({ embed: { description: `**${executor.username}**#${executor.discriminator} (\`${executor.id}\`) a donné à **${newMember.user.username}**#${newMember.user.discriminator} (\`${newMember.user.id}\`) le(s) rôle(s): **${newroles.map(r => '\n<@&' + r.id + '>').join(", ")}**`, author: { name: `➕ Ajout de rôle(s)` }, color: 'RANDOM', footer: { text: `🕙 ${getNow().time} - Mxtorie` } } });

        } else if (oldMember.roles.cache.size > newMember.roles.cache.size) {
            let oldroles = null;
            deletionLog.changes.forEach(r => {
                oldroles = r.new
            });
            if (!deletionLog) return;
            const { executor, target } = deletionLog;
            str_chan.send({ embed: { description: `**${executor.username}**#${executor.discriminator} (\`${executor.id}\`) a retiré à **${newMember.user.username}**#${newMember.user.discriminator} (\`${newMember.user.id}\`) le(s) rôle(s): **${oldroles.map(r => '\n<@&' + r.id + '>').join(", ")}**`, author: { name: `➖ Perte de rôle(s)` }, color: 'RANDOM', footer: { text: `🕙 ${getNow().time} - Mxtorie` } } });
        }
    })
})



const invitess = {};
bot.on('ready', async () => {
    // "ready" isn't really ready. We need to wait a spell.
    setTimeout(() => {

        // Load all invites for all guilds and save them to the cache.
        bot.guilds.cache.forEach(g => {
            g.fetchInvites().then(guildInvites => {
                invitess[g.id] = guildInvites;
                //console.log(guildInvites)
            });
        });
    }, 500)
});

/*bot.on('guildMemberAdd', async (member) => {
    await database.query("SELECT * FROM channels WHERE serverid = ?", member.guild.id, async (error, result) => {
        let str_chan = member.guild.channels.cache.find(c => c.id === result[0].welcomelogs)
        if (!str_chan) return;
        member.guild.fetchInvites().then(async guildInvites => {
                // This is the *existing* invites for the guild.
                const ei = invitess[member.guild.id];
                // Update the cached invites for the guild.
                invitess[member.guild.id] = guildInvites;
                if (!ei) return;
                //  Look through the invites, find the one for which the uses went up.
                await member.guild.fetchInvites().catch(() => undefined);
                let invite2 = guildInvites.find(i => {
                    const a = ei.get(i.code);
                    if (!a) return;
                    return a.uses < i.uses
                });
                if (!invite2) invite2 = "__je ne sais pas__";
                // This is just to simplify the message being sent below (inviter doesn't have a tag property)
                const inviter = invite2!="__je ne sais pas__" ? bot.users.cache.get(invite2.inviter.id) : "__je ne sais pas__"
                var invitecode = invite2!="__je ne sais pas__" ? invite2.code : invite2
                var invitertag = inviter.tag
                var inviteuses = invite2.uses
                if(!invitecode) invitecode = "__je ne sais pas (sois temporaire, sois vanity)__"
                if(!invitertag) invitertag = "__je ne sais pas__"
                if(!inviteuses) inviteuses = "__je ne sais pas__"
                let invites = await member.guild.fetchInvites();

        // Get array of invites made by message author user
        const userInvites = invites.array().filter(e => e.inviter.id == inviter.id);
            // Make a var to save count of the user invites
                var inviteCountt;

        // Loop through each invite and add the uses of the invite to the "inviteCount" variable.
                if(invite2!="__je ne sais pas__") await userInvites.forEach(invite => inviteCountt += invite2.uses) 
                else inviteCountt = "__je ne sais pas__"
                var inviteCount = inviteCountt
                        if(!inviteCount && inviteCount!=0) inviteCount = "__je ne sais pas__"
                invitejson[`${member.guild.id}_${member.id}_code`] = invitecode
                invitejson[`${member.guild.id}_${member.id}_tag`] = invitertag
                invitejson[`${member.guild.id}_${member.id}_uses`] = inviteuses
                invitejson[`${member.guild.id}_${member.id}_count`] = inviteCount
                fs.writeFile(`./invite.json`, JSON.stringify(invitejson), (x) => {
                        if (x) console.error(x)
                    });
        str_chan.send({ embed: { description: `**${member.user.username}**#${member.user.discriminator} (\`${member.user.id}\`) a rejoins le serveur!\nIl a été invité par **${invitertag}** avec l'invitation **${invitecode}** !\n`, color: "RANDOM", author: { name: "🙌 Nouveau membre" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
        })
    })
})*/
/*bot.on('inviteJoin', async (member, invite, inviter) => {
    if(member.id == bot.user.id) return
    if(!member) return
    ultrax.sleep(1200)
    invitecode = invite.code
    invitertag = inviter.tag
    inviteuses = invite.uses
    let invites = await member.guild.fetchInvites();

    // Get array of invites made by message author user
    const userInvites = invites.array().filter(e => e.inviter.id == inviter.id);

    // Make a var to save count of the user invites
    var inviteCountt = 0;

    // Loop through each invite and add the uses of the invite to the "inviteCount" variable.
    userInvites.forEach(invite => inviteCountt += invite.uses);
    inviteCount = inviteCountt
    await database.query("SELECT * FROM channels WHERE serverid = ?", member.guild.id, async (error, result) => {
        str_chan = member.guild.channels.cache.find(c => c.id === result[0].welcomelogs)
        if (!str_chan) return;
        str_chan.send({ embed: { description: `**${member.user.username}**#${member.user.discriminator} (\`${member.user.id}\`) a rejoins le serveur!\nIl a été invité par **${inviter.tag}** !\n`, color: 3553599, author: { name: "🙌 Nouveau membre" }, footer: { text: `🕙 ${getNow().time}` } } })
    })
})*/

bot.on('guildMemberRemove', async (member) => {
    if (member.id == bot.user.id) return
    if (!member) return
    await database.query("SELECT * FROM channels WHERE serverid = ?", member.guild.id, async (error, result) => {
        var str_chan = member.guild.channels.cache.find(c => c.id === result[0].welcomelogs)
        if (!str_chan) return;
        str_chan.send({ embed: { description: `**${member.user.username}**#${member.user.discriminator} (\`${member.user.id}\`) a quitté le serveur! \n **Rôles:** \`\`\`${member.roles.cache.map(r => r.name).join(", ")}\`\`\``, color: "RANDOM", author: { name: "👋 Perte d'un membre" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
    })
})

/*FIN LOGS*/








bot.on('guildMemberAdd', async (member) => {
    if (!member) return
    if (!member.guild) return
    var unrole
    await database.query('SELECT * FROM settings WHERE serverid = ?', [member.guild.id], async (err, result, callback) => {
        if (result < 1) {
            lang2 = lang[language]
        } else {
            var tlang = result[0].language;
            lang2 = lang[tlang]
        }
        if (member.user.bot) {
            await database.query("SELECT * FROM protections WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
                if (!result < 1) {
                    if (result[0].bot == 'on') {
                        member.kick({ reason: 'anti-bot activated' }).catch(e => { return })
                        logs.sanctions(bot, member, database, "Anti-bot", lang.antibotenable, member, false, color.orange, lang, false, 'protections', false, false, false)
                    }
                }
            })
        }
        if (!member) return
        if (!member.user) return
        if (member.user.bot) return
        await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
            if (error || result < 1) { } else {
                unrole = result[0].captcha
                if (!unrole) { } else {
                    if (member.guild.roles.cache.find(r => r.id === unrole)) {
                        member.roles.add(member.guild.roles.cache.find(r => r.id === unrole)).catch(e => { member.guild.owner.send(lang2.by == 'by' ? 'I need to be above all roles setup in my settings. Currently i can\'t give the captcha role. Don\'t forget to put me above the roles i need to protect (role whitelisted for l\'anti-role).' : 'J\'ai besoin d\'être au dessus de chaque rôle mis dans mes paramétres, actuellement je ne peux pas donner le rôle du captcha. N\'oublié pas de me mettre au dessus des rôles que je suis sensé protéger (rôle whitelisté pour l\'anti-rôle).').catch(e => { }) })
                    }
                }
            }
            await database.query("SELECT * FROM channels WHERE serverid = ?", member.guild.id, async (error, result) => {
                let str_chan = member.guild.channels.cache.find(c => c.id === result[0].welcomelogs)
                member.guild.fetchInvites().then(async guildInvites => {
                    // This is the *existing* invites for the guild.
                    const ei = invitess[member.guild.id];
                    // Update the cached invites for the guild.
                    invitess[member.guild.id] = guildInvites;
                    if (!ei) return;
                    //  Look through the invites, find the one for which the uses went up.
                    await member.guild.fetchInvites().catch(() => undefined);
                    let invite2 = guildInvites.find(i => {
                        const a = ei.get(i.code);
                        if (!a) return;
                        return a.uses < i.uses
                    });
                    if (!invite2) invite2 = "__je ne sais pas__";
                    // This is just to simplify the message being sent below (inviter doesn't have a tag property)
                    const inviter = invite2 != "__je ne sais pas__" ? bot.users.cache.get(invite2.inviter.id) : "__je ne sais pas__"
                    var invitecode = invite2 != "__je ne sais pas__" ? invite2.code : invite2
                    var invitertag = inviter.tag
                    var inviteuses = invite2.uses
                    if (!invitecode) invitecode = "__je ne sais pas (sois temporaire, sois vanity)__"
                    if (!invitertag) invitertag = "__je ne sais pas__"
                    if (!inviteuses) inviteuses = "__je ne sais pas__"
                    let invites = await member.guild.fetchInvites();

                    // Get array of invites made by message author user
                    const userInvites = invites.array().filter(e => e.inviter.id == inviter.id);
                    // Make a var to save count of the user invites
                    var inviteCountt = 0;

                    // Loop through each invite and add the uses of the invite to the "inviteCount" variable.
                    if (invite2 != "__je ne sais pas__") await userInvites.forEach(invite => inviteCountt += invite2.uses)
                    else inviteCountt = 0
                    var inviteCount = inviteCountt
                    if (!inviteCountt) inviteCount = "__je ne sais pas__"
                    invitejson[`${member.guild.id}_${member.id}_code`] = invitecode
                    invitejson[`${member.guild.id}_${member.id}_tag`] = invitertag
                    invitejson[`${member.guild.id}_${member.id}_uses`] = inviteuses
                    invitejson[`${member.guild.id}_${member.id}_count`] = parseInt(inviteCountt)
                    invitejson[`${member.guild.id}_${member.id}_inviter`] = invitertag == '__je ne sais pas__' ? 'bah du coup je sais pas' : inviter.id
                    fs.writeFile(`./invite.json`, JSON.stringify(invitejson), (x) => {
                        if (x) console.error(x)
                    });
                    if (str_chan) str_chan.send({ embed: { description: `**${member.user.username}**#${member.user.discriminator} (\`${member.user.id}\`) a rejoins le serveur!\nIl a été invité par **${invitertag}** avec l'invitation **${invitecode}** !\n`, color: "RANDOM", author: { name: "🙌 Nouveau membre" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })

                    checkBL(member, lang2, unrole)
                })
            })

        })
    })
})
const ultrax = require('ultrax')
ultrax.inviteLogger(bot)
let invitecode2 = undefined
let invitertag2 = undefined
let inviteuses2 = undefined
let inviteCount2 = undefined
bot.on('inviteJoin', async (member, invite, inviter) => {
    if (!member) return
    if (!member.user) return
    if (member.user.bot) return

    invitecode2 = invite.code
    invitertag2 = inviter.tag
    inviteuses2 = invite.uses
    let invites = await member.guild.fetchInvites();

    // Get array of invites made by message author user
    const userInvites = invites.array().filter(e => e.inviter.id == inviter.id);

    // Make a var to save count of the user invites
    var inviteCountt = 0;

    // Loop through each invite and add the uses of the invite to the "inviteCount" variable.
    userInvites.forEach(invite => inviteCountt += invite.uses);
    inviteCount2 = inviteCountt
    await database.query("SELECT * FROM rewards WHERE serverid = ? AND type = ? AND count = ?", [member.guild.id, 'invite', inviteCount2], async (error, result) => {
        if (error) return
        if (result.length < 1) return
        result.map(i => {
            if (!member.guild.roles.cache.has(i.role)) return
            member.roles.add(i.role, { reason: 'Reward role' }).catch(e => { return })
        })
    })
    // results
    //console.log(`${member.user.tag} joined using invite code ${invite.code} from ${inviter.tag}. Invite was used ${invite.uses} times since its creation.`)
});
async function Hello(member, lang2, captcha) {
    if (!member) return
    if (!member.guild) return
    try {
        await database.query("SELECT * FROM settings WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
            if (!error && !result < 1 && result.length > 0) {
                if (!result[0]) return

                if (result[0].welcome == "on") {
                    if (result[0].welcomemsg == "default") {
                        if (!lang2) lang2 = lang[language]
                        await database.query("SELECT * FROM channels WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
                            if (!error && !result < 1) {
                                if (result[0].welcomechan != "-") {
                                    var chan = member.guild.channels.cache.find(c => c.id === result[0].welcomechan)
                                    if (chan) {
                                        var messagewlc = lang2.welcomemsg
                                        messagewlc = messagewlc.replace('[member]', member)
                                        messagewlc = messagewlc.replace('[server]', member.guild.name)
                                        messagewlc = messagewlc.replace('[membercount]', member.guild.memberCount)
                                        chan.send(`${messagewlc}`)
                                    }
                                }
                            }
                        })
                    } else {
                        await database.query("SELECT * FROM channels WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
                            if (!error && !result < 1) {
                                if (result[0].welcomechan != "-") {
                                    var chan2 = member.guild.channels.cache.find(c => c.id === result[0].welcomechan)
                                    if (!chan2) return console.log('Welcome channel introuvable')
                                    await database.query("SELECT * FROM settings WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
                                        if (!error && !result < 1) {
                                            member.guild.fetchInvites().then(async guildInvites => {
                                                //sleep(captcha ? 2000 : 8000)
                                                //console.log("welcome message done")
                                                if (!invitejson[`${member.guild.id}_${member.id}_tag`] || invitejson[`${member.guild.id}_${member.id}_code`] == undefined || invitejson[`${member.guild.id}_${member.id}_count`] == null) sleep(2000)
                                                var messagewlc2 = result[0].welcomemsg
                                                let invites = await member.guild.fetchInvites();
                                                let userInvites
                                                if (invitejson[`${member.guild.id}_${member.id}_inviter`] != "bah du coup je sais pas") userInvites = invites.array().filter(e => e.inviter.id == invitejson[`${member.guild.id}_${member.id}_inviter`]);
                                                let inviteCount = 0;
                                                if (invitejson[`${member.guild.id}_${member.id}_inviter`] != "bah du coup je sais pas") await userInvites.forEach(invite => inviteCount += invite.uses);
                                                messagewlc2 = messagewlc2.replace('[member]', member)
                                                messagewlc2 = messagewlc2.replace('[server]', member.guild.name)
                                                messagewlc2 = messagewlc2.replace('[membercount]', member.guild.memberCount)
                                                messagewlc2 = messagewlc2.replace('[invite]', invitejson[`${member.guild.id}_${member.id}_code`])
                                                messagewlc2 = messagewlc2.replace('[invitedby]', invitejson[`${member.guild.id}_${member.id}_tag`])
                                                messagewlc2 = messagewlc2.replace('[invitecountwithcode]', invitejson[`${member.guild.id}_${member.id}_uses`])
                                                messagewlc2 = messagewlc2.replace('[invitecount]', inviteCount)
                                                chan2.send(`${messagewlc2}`)
                                                // message.channel.send(lang2.by=='by' ? `<@${mention}> have ${userInvites.length} active invite links, and a total of ${inviteCount} users joined with them.` : `<@${mention}> as ${userInvites.length} lien(s) active, et un total de ${inviteCount} membre(s) on rejoins avec.`);
                                                //})
                                            })
                                        }
                                    })
                                }
                            }
                        })
                    }
                }
            }
        })
    } catch (err) {
        console.log('Welcome error : ' + err)
    }
}

async function checkBL(member, lang2, unrole) {
    if (!member) return
    if (!member.guild) return
    if (!lang2) lang2 = lang[language]
    await database.query("SELECT * FROM blacklist WHERE userid = ?", [member.id], async function (error, result, fields) {
        if (error) return
        if (result < 1) {
            checkAccount(member, lang2, unrole)
            // checkCaptcha(member, lang2)
        } else {
            logs.sanctions(bot, member, database, "Blacklisté", lang['fr'].blacklistedtry, member, false, color.paleturquoise, lang, false, 'protections', false, false, false)
            member.send(lang2.by == 'by' ? 'You are blacklisted from this server.' : 'Tu es blacklisté sur ce serveur.').catch(e => { })
            sleep(1500)
            member.ban({ reason: 'blacklisted' }).catch(e => { return })
        }
    })

}

async function checkAccount(member, lang2, unrole) {
    if (!member) return
    if (!member.guild) return
    await database.query('SELECT * FROM settings WHERE serverid = ?', [member.guild.id], async (err, result, callback) => {

        if (result < 1) {
            lang2 = lang[language]
        } else {
            var tlang2 = result[0].lang2uage;
            lang2 = lang[tlang2]
        }
        await database.query("SELECT * FROM protections WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
            if (result < 1) {
                checkCaptcha(member, lang2, unrole)
            } else {
                if (result[0].prtcjoin == "on") {
                    await database.query("SELECT * FROM protections WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
                        if (result < 1) {
                            checkCaptcha(member, lang2, unrole)
                        } else {
                            var time = result[0].prtcjointime
                            let creation = Date.now() - member.user.createdAt
                            if (creation < time) {
                                logs.sanctions(bot, message, database, "Nouveau compte", lang.detectednew, member, false, color.peachpuff, lang, false, 'protections', false, false, false)
                                sleep(1500)
                                member.send(lang2.by == 'by' ? 'You account is too recent to join this account sorry.' : 'Votre compte est trop récent pour rejoindre ce serveur désolé.').catch(e => { })
                                return member.kick({ reason: 'recent account' }).catch(e => { return })
                            } else {
                                checkCaptcha(member, lang2, unrole)
                            }
                        }
                    })
                } else {
                    checkCaptcha(member, lang2, unrole)
                }
            }
        })
    })
}

async function checkCaptcha(member, lang2, rolecapth) {
    //console.log('captcha function called.')
    if (!member) return
    if (!member.guild) return
    await database.query('SELECT * FROM settings WHERE serverid = ?', [member.guild.id], async (err, result, callback) => {
        if (result < 1) {
            lang2 = lang[language]
        } else {
            var tlang = result[0].language;
            lang2 = lang[tlang]
        }


        await database.query("SELECT * FROM settings WHERE serverid = ?", member.guild.id, async function (error, result, fields) {

            if (error || result < 1 || result.length < 1) {
                if (!result[0]) return
                member.roles.remove(member.guild.roles.cache.find(r => r.id === rolecapth)).catch(e => { })
                if (result[0].defaultrole == 'on') {
                    await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
                        if (error || result < 1 || result.length < 1) return
                        if (!result[0]) return
                        if (!result[0].defaultrole) return
                        let defaultrole = member.guild.roles.cache.find(r => r.id === result[0].defaultrole)
                        if (!defaultrole) return
                        member.roles.add(defaultrole).catch(e => { })
                    })
                }
            } else {
                if (result[0].captcha == "off") {
                    member.roles.remove(member.guild.roles.cache.find(r => r.id === rolecapth)).catch(e => { })
                    Hello(member, lang2, false)
                    if (result[0].defaultrole == 'on') {
                        await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
                            if (error || result < 1 || result.length < 1) return

                            if (!result[0]) return

                            if (!result[0].defaultrole) return
                            let defaultrole = member.guild.roles.cache.find(r => r.id === result[0].defaultrole)
                            if (!defaultrole) return
                            member.roles.add(defaultrole).catch(e => { })
                        })
                    }
                } else {
                    if (member.guild.roles.cache.has(rolecapth)) {
                        if (rolecapth) {
                            await database.query("SELECT * FROM channels WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
                                if (error || result < 1) return
                                var chan = member.guild.channels.cache.find(c => c.id == result[0].captcha)
                                if (!chan) return
                                await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
                                    if (!member.guild.roles.cache.find(r => r.id === result[0].captcha)) {
                                        try {
                                            let guild = member.guild
                                            await member.guild.roles.create({
                                                data: {
                                                    name: 'unverified',
                                                    color: 'BLUE',
                                                    permissions: []
                                                },
                                                reason: 'Made by Mxtorie for unverified people.'
                                            }).then(role => {
                                                member.guild.channels.cache.map(async (channel) => {
                                                    channel.updateOverwrite(role, { VIEW_CHANNEL: false, SEND_MESSAGES: false }).catch(e => { return });
                                                });
                                                setTimeout(() => {
                                                    chan.updateOverwrite(member.guild.roles.everyone.id, {
                                                        SEND_MESSAGES: false,
                                                        VIEW_CHANNEL: false
                                                    }).catch(e => { return })
                                                    chan.updateOverwrite(role.id, {
                                                        SEND_MESSAGES: true,
                                                        VIEW_CHANNEL: true
                                                    }).catch(e => { return })
                                                }, 1000);
                                                let values = [role.id, member.guild.id]
                                                database.query("UPDATE roles SET captcha = ? WHERE serverid = ?", values, async function (error, result, fields) {
                                                    if (error || result < 1) return console.log('Error during set of the captcha role in the database (directly from the function).')
                                                })
                                                // console.log(chan)                          
                                            })
                                            //console.log('Created role.')
                                        } catch (err) { return console.log(err) }
                                    }
                                    let embed = new Discord.MessageEmbed()
                                    sleep(1000)
                                    let role2 = member.guild.roles.cache.find(r => r.id === result[0].captcha);
                                    member.roles.add(role2).catch(e => { })
                                    const captcha = new CaptchaGenerator().setTrace({ size: 4, color: '#1389B1' }).setCaptcha({ color: '#51D3FF', opacity: 0.6 });
                                    const buffer = await captcha.generate();
                                    const filter = (user) => {
                                        return user.author.id === member.id;
                                    };
                                    fs.writeFileSync('image.png', buffer);
                                    var image = new MessageAttachment('image.png', 'image.png')
                                    //embed.setImage(image.proxyURL)
                                    chan.send("<@" + member.id + ">", image).then(async msg => {
                                        let message = chan.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] }).then(async (collected) => {
                                            message = collected.first()
                                            if (!message) {
                                                msg.delete()
                                                logs.sanctions(bot, message, database, "Captcha", lang[language].failcaptcha, member, false, color.red, lang[language], false, 'protections', false, false, false)
                                                return member.kick({ reason: 'failed captcha' }).catch(e => { })
                                            }
                                            if (message.content === captcha.text) {
                                                member.roles.remove(role2).catch(e => { })
                                                msg.delete()
                                                message.delete()
                                                logs.sanctions(bot, member, database, "Captcha", lang2.resolvecatpcha, member, false, color.green, lang2, false, 'protections', false, false, false)
                                                Hello(member, lang2, true)
                                                await database.query("SELECT * FROM settings WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
                                                    if (error || result < 1) return
                                                    if (!result[0].defaultrole) return
                                                    if (result[0].defaultrole == 'on') {
                                                        await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
                                                            if (error || result < 1) return
                                                            if (!result[0].defaultrole) return
                                                            if (!member.guild.roles.cache.has(result[0].defaultrole)) return
                                                            member.roles.add(result[0].defaultrole).catch(e => { })
                                                        })
                                                    }
                                                })
                                            } else {
                                                message.delete()
                                                msg.delete()
                                                logs.sanctions(bot, message, database, "Captcha", lang[language].failcaptcha, member, false, color.red, lang[language], false, 'protections', false, false, false)
                                                member.send(lang2.by == 'by' ? 'Your answer to the captcha was wrong so i kick you' : 'Ta réponse au captcha était fausse alors je t\'ai exclu.').catch(e => { })
                                                member.kick({ reason: 'failed captcha' }).catch(e => { })
                                            }
                                        }).catch(e => {
                                            msg.delete()
                                            logs.sanctions(bot, message, database, "Captcha", lang[language].captchanoanswer, member, false, color.orangered, lang[language], false, 'protections', false, false, false)
                                            member.send(lang2.by == 'by' ? 'You are not answering to the captcha so i kick you.' : 'Tu n\'a pas répondu au captcha alors je t\'ai exclu.').catch(e => { })
                                            member.kick({ reason: 'no answer captcha' }).catch(e => { })
                                        })
                                    })
                                })
                            })
                        } else {
                            //member.roles.remove(member.guild.roles.cache.find(r => r.id === rolecapth)).catch(e => {return}) 
                            if (result[0].defaultrole == 'on') {
                                await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
                                    if (error || result < 1) return
                                    if (!result[0].defaultrole) return
                                    let defaultrole = member.guild.roles.cache.find(r => r.id === result[0].defaultrole)
                                    if (!defaultrole) return
                                    member.roles.add(defaultrole).catch(e => { })
                                })
                            }
                        }
                    } else {
                        if (result[0].defaultrole == 'on') {
                            await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async function (error, result, fields) {
                                if (error || result < 1) return
                                if (!result[0].defaultrole) return
                                let defaultrole = member.guild.roles.cache.find(r => r.id === result[0].defaultrole)
                                if (!defaultrole) return
                                member.roles.add(defaultrole).catch(e => { })
                            })
                        }
                    }
                }
            }
        })
    })
}

bot.on('roleCreate', async role => {
    if (!role) return
    if (!role.guild) return
    await database.query("SELECT * FROM channels WHERE serverid = ?", role.guild.id, async (error, result) => {

        var str_chan = null;
        if (role) {
            str_chan = role.guild.channels.cache.find(c => c.id === result[0].roles)
        }
        if (!str_chan) return;
        var fetchedLogs = await role.guild.fetchAuditLogs({
            limit: 1,
            type: 'ROLE_CREATE',
        }),
            deletionLog = fetchedLogs.entries.first();
        if (!deletionLog) return;
        var { executor, target } = deletionLog;
        str_chan.send({ embed: { description: `**${executor.username}**#${executor.discriminator} (\`${executor.id}\`) viens de créé le rôle : \`${role.name}\``, color: 'RANDOM', author: { name: "🎭 Rôle créé" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
    })
})

bot.on('roleDelete', async role => {
    if (!role) return
    if (!role.guild) return
    await database.query("SELECT * FROM channels WHERE serverid = ?", role.guild.id, async (error, result) => {

        var str_chan = null;
        if (role) {
            str_chan = role.guild.channels.cache.find(c => c.id === result[0].roles)
        }
        if (!str_chan) return;
        var fetchedLogs = await role.guild.fetchAuditLogs({
            limit: 1,
            type: 'ROLE_DELETE',
        }),
            deletionLog = fetchedLogs.entries.first();
        if (!deletionLog) return;
        var { executor, target } = deletionLog;
        str_chan.send({ embed: { description: `**${executor.username}**#${executor.discriminator} (\`${executor.id}\`) viens de supprimé le rôle : \`${role.name}\``, color: 'RANDOM', author: { name: "🎭 Rôle supprimé" }, footer: { text: `🕙 ${getNow().time} - Mxtorie` } } })
    })
})

bot.on('roleUpdate', async (oldrole, newrole) => {
    const fetchedLogs = await newrole.guild.fetchAuditLogs({
        limit: 1,
        type: 'ROLE_UPDATE',
    }).catch(e => { return })
    try {
        const guild = newrole.guild
        const channelLog = fetchedLogs.entries.first()
        const { executor, target } = channelLog
        const member = newrole.guild.members.cache.get(executor.id)
        const rolename = newrole.name
        if (newrole.name == oldrole.name && newrole.hexColor == oldrole.hexColor && oldrole.hoist == newrole.hoist && newrole.mentionable == oldrole.mentionable) return
        let embed = new Discord.MessageEmbed()
        let val1 = ["Permissions", "Couleur", "Nom", "Hoist", "Mentionnable"]
        let val2 = [newrole.permissions.toArray().map(i => '\n' + i), newrole.hexColor, newrole.name, newrole.hoist, newrole.mentionable]
        let val3 = [oldrole.permissions.toArray().map(i => '\n' + i), oldrole.hexColor, oldrole.name, oldrole.hoist, oldrole.mentionable]
        embed.setTitle("🎭 Rôle modifié : " + newrole.name)
        embed.setAuthor("Modifié par : " + member.user.tag + " (" + member.id + ")", member.user.displayAvatarURL({ dynamic: true }))
        await val1.map((i, n) => {
            try {
                if (val2[n] == val3[n]) return
                embed.addField(i, `Avant : \`\`\`${val2[n]}\`\`\`\nAprès : \`\`\`${val3[n]}\`\`\``, true)
            } catch (err) { return }
        })
        embed.setColor('RANDOM')
        embed.setFooter(`🕙 ${getNow().time} - Mxtorie`)
        log(member, 'roles', embed)
    } catch (err) { return }
})

async function log(message, type, myembed) {
    if (!message) return
    if (!message.guild) return
    if (!type) return
    var r
    await database.query("SELECT * FROM channels WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
        if (result < 1) return
        switch (type) {
            case 'sanction':
                r = result[0].sanctions
                break;
            case 'channel':
                r = result[0].channel
                break;
            case 'protections':
                r = result[0].protections
                break;
            case 'messages':
                r = result[0].messages
                break;
            case 'roles':
                r = result[0].roles
                break;
        }
        if (r == '-') return
        if (!message.guild.channels.cache.has(r)) return
        message.guild.channels.cache.find(c => c.id === r).send(myembed)
    })
}

/*PROTECTIONS*/

bot.on('webhookUpdate', async channel => {
    try {
        const fetchedLogs = await channel.guild.fetchAuditLogs({
            limit: 1,
            type: 'webhookUpdate',
        }).catch(e => { return })
        const guild = channel.guild
        const channelLog = fetchedLogs.entries.first()
        if (Date.now() - channelLog.createdTimestamp > 5000) return
        const { executor, target } = channelLog
        const member = channel.guild.members.cache.get(executor.id)
        const channame = channel.name
        await database.query("SELECT * FROM protections WHERE serverid = ?", channel.guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            if (!result[0].webhook) return
            if (result[0].webhook != 'on') return
            const punish = result[0].punish
            let whitelisted
            await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [guild.id, member.id], async (error, result, fields) => {
                if (error) { whitelisted = false } else if (result < 1 || result == undefined) { whitelisted = false }
                if (member.id === guild.ownerID || config.owners.includes(member.id) || config.buyer == member.id || config.creator == member.id) whitelisted = true
                if (whitelisted) return
                if (!channel.deletable) return
                let chanPos = await channel.position
                channel.clone({ reason: 'webhook protection' }).then(async c => {
                    channel.delete().then(async () => {
                        if (AllChannelsPosition[`${c.guild.id}_${channel.id}`] != undefined) {
                            c.setPosition(AllChannelsPosition[`${c.guild.id}_${channel.id}`]).catch(e => { return })
                        }
                    }).catch(e => { return })
                }).catch(e => { return })
                let roles = []
                let role = await member.roles.cache.map(role => roles.push(role.id))
                role
                member.roles.remove(roles, 'Créé un webhook sans permission').catch(e => { return })

                logs.sanctions(bot, member, database, "Anti-webhook", lang[language].antowebhook, member, false, color.red, lang[language], bot.user, 'protections', false, channame, false, false)
                sanction.sanctions(bot, member, member, punish, 'essaie de créé un webhhook', bot.user, database)
                if (punish == 'kick') {
                    member.kick({ reason: 'anti-webhook' }).catch(e => { return })
                }
                if (punish == 'ban') {
                    member.ban({ reason: 'anti-webhook' }).catch(e => { return })
                }
                if (punish != "derank") return
                await database.query("SELECT * FROM settings WHERE serverid = ?", guild.id, async function (error, result, fields) {
                    if (error || result < 1) return
                    if (result[0].defaultrole != 'on') return
                    await database.query("SELECT * FROM roles WHERE serverid = ?", guild.id, async function (error, result, fields) {
                        if (error || result < 1) return
                        if (!guild.roles.cache.has(result[0].defaultrole)) return
                        member.roles.add(result[0].defaultrole).catch(e => { return })
                    })
                })
            })
        })
    } catch (err) {
        return
    }
})

const ChannelActionUser = {}
const ChannelIdUser = {}

bot.on('channelCreate', async (channel) => {
    try {
        const fetchedLogs = await channel.guild.fetchAuditLogs({
            limit: 1,
            type: 'CHANNEL_CREATE',
        }).catch(e => { return })
        const guild = channel.guild
        const channelLog = fetchedLogs.entries.first()
        if (Date.now() - channelLog.createdTimestamp > 5000) return
        const { executor, target } = channelLog
        const member = channel.guild.members.cache.get(executor.id)
        const channame = channel.name
        await database.query("SELECT * FROM protections WHERE serverid = ?", channel.guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            if (!result[0].channel) return
            if (result[0].channel != 'on') return
            const punish = result[0].punish
            let whitelisted
            await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [guild.id, member.id], async (error, result, fields) => {
                if (error) { whitelisted = false } else if (result < 1 || result == undefined) { whitelisted = false } else { whitelisted = true }
                if (member.id === guild.ownerID || config.owners.includes(member.id) || member.id == bot.user.id || config.buyer == member.id || config.creator == member.id) whitelisted = true
                if (whitelisted) return
                if (!channel.deletable) return
                channel.delete().catch(e => { return })
                let roles = []
                let role = await member.roles.cache.map(role => roles.push(role.id))
                role
                member.roles.remove(roles, 'Créé un salon sans permission').catch(e => { return })

                logs.sanctions(bot, member, database, "Anti-channel", lang[language].antichannelcreate, member, false, color.red, lang[language], bot.user, 'protections', false, channame, false, false)
                sanction.sanctions(bot, member, member, punish, "essaie de créé un salon", bot.user, database)
                if (punish == 'kick') {
                    member.kick({ reason: 'anti-channel' }).catch(e => { return })
                }
                if (punish == 'ban') {
                    member.ban({ reason: 'anti-channel' }).catch(e => { return })
                }
                if (punish != "derank") return
                await database.query("SELECT * FROM settings WHERE serverid = ?", guild.id, async function (error, result, fields) {
                    if (error || result < 1) return
                    if (result[0].defaultrole != 'on') return
                    await database.query("SELECT * FROM roles WHERE serverid = ?", guild.id, async function (error, result, fields) {
                        if (error || result < 1) return
                        if (!guild.roles.cache.has(result[0].defaultrole)) return
                        member.roles.add(result[0].defaultrole).catch(e => { return })
                    })
                })
            })
        })
    } catch (err) {
        return
    }
})
const AllChannelsPosition = {}
const AllRolesPosition = {}
bot.on('ready', async () => {
    bot.guilds.cache.map(async g => {
        g.channels.cache.map(async c => {
            try {
                if (!c) return
                AllChannelsPosition[`${g.id}_${c.id}`] = c.position
            } catch (err) { return }
        })
        g.roles.cache.map(async r => {
            try {
                if (!r) return
                AllRolesPosition[`${g.id}_${c.id}`] = r.position
            } catch (err) { return }
        })
    })
    setInterval(async () => {
        bot.guilds.cache.map(async g => {
            g.channels.cache.map(async c => {
                try {
                    if (!c) return
                    AllChannelsPosition[`${g.id}_${c.id}`] = c.position
                } catch (err) { return }
            })
            g.roles.cache.map(async r => {
                try {
                    if (!r) return
                    AllRolesPosition[`${g.id}_${c.id}`] = r.position
                } catch (err) { return }
            })
        })
    }, 15000)
})

bot.on("channelDelete", async (channel) => {
    try {
        const fetchedLogs = await channel.guild.fetchAuditLogs({
            limit: 1,
            type: 'CHANNEL_DELETE',
        }).catch(e => { return })
        const guild = channel.guild
        const channelLog = fetchedLogs.entries.first()
        if (Date.now() - channelLog.createdTimestamp > 5000) return
        const { executor, target } = channelLog
        const member = channel.guild.members.cache.get(executor.id)
        const channame = channel.name
        await database.query("SELECT * FROM protections WHERE serverid = ?", channel.guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            if (!result[0].channel) return
            if (result[0].channel != 'on') return
            const punish = result[0].punish
            let whitelisted
            await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [guild.id, member.id], async (error, result, fields) => {
                if (error) { whitelisted = false } else if (result < 1 || result == undefined) { whitelisted = false } else { whitelisted = true }
                if (member.id === guild.ownerID || config.owners.includes(member.id) || member.id == bot.user.id || config.buyer == member.id || config.creator == member.id) whitelisted = true
                if (whitelisted) return
                channel.clone().then(async c => {
                    c.overwritePermissions(channel.permissionOverwrites)
                    if (AllChannelsPosition[`${c.guild.id}_${channel.id}`] != undefined) {
                        c.setPosition(AllChannelsPosition[`${c.guild.id}_${channel.id}`]).catch(e => { return })
                    }
                }).catch(e => { return })
                let roles = []
                let role = await member.roles.cache.map(role => roles.push(role.id))
                role
                member.roles.remove(roles, 'Supprime un salon sans permission').catch(e => { return })
                //if (!channel.deletable) return

                logs.sanctions(bot, member, database, "Anti-channel", lang[language].antichanneldelete, member, false, color.red, lang[language], bot.user, "protections", false, channame, false, false)
                sanction.sanctions(bot, member, member, punish, 'essaie de supprimé un salon', bot.user, database)
                if (punish == 'kick') {
                    member.kick({ reason: 'anti-channel' }).catch(e => { return })
                }
                if (punish == 'ban') {
                    member.ban({ reason: 'anti-channel' }).catch(e => { return })
                }
                if (punish != "derank") return
                await database.query("SELECT * FROM settings WHERE serverid = ?", guild.id, async function (error, result, fields) {
                    if (error || result < 1) return
                    if (result[0].defaultrole != 'on') return
                    await database.query("SELECT * FROM roles WHERE serverid = ?", guild.id, async function (error, result, fields) {
                        if (error || result < 1) return
                        if (!guild.roles.cache.has(result[0].defaultrole)) return
                        member.roles.add(result[0].defaultrole).catch(e => { return })
                    })
                })
            })
        })
    } catch (err) {
        return
    }
})

bot.on('roleCreate', async (rolee) => {
    try {
        const fetchedLogs = await rolee.guild.fetchAuditLogs({
            limit: 1,
            type: 'ROLE_CREATE',
        }).catch(e => { return })
        const guild = rolee.guild
        const channelLog = fetchedLogs.entries.first()
        if (Date.now() - channelLog.createdTimestamp > 5000) return
        const { executor, target } = channelLog
        const member = rolee.guild.members.cache.get(executor.id)
        const channame = rolee.name
        await database.query("SELECT * FROM protections WHERE serverid = ?", rolee.guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            if (!result[0].antieditrole) return
            if (result[0].antieditrole != 'on') return
            const punish = result[0].punish
            let whitelisted
            await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [guild.id, member.id], async (error, result, fields) => {
                if (error) { whitelisted = false } else if (result < 1 || result == undefined) { whitelisted = false } else { whitelisted = true }
                if (member.id === guild.ownerID || config.owners.includes(member.id) || member.id == bot.user.id || config.buyer == member.id || config.creator == member.id) whitelisted = true
                if (whitelisted) return
                let roles = []
                let role = await member.roles.cache.map(role => roles.push(role.id))
                role
                member.roles.remove(roles, 'Créé un rôle').catch(e => { return })
                rolee.delete({ reason: 'Rôle créé sans permission' }).catch(e => { return })
                logs.sanctions(bot, member, database, "Anti-edit role", lang[language].anticreaterole, member, false, color.red, lang[language], bot.user, "protections", false, false, channame, false)
                sanction.sanctions(bot, member, member, punish, false, bot.user, database)
                if (punish == 'kick') {
                    member.kick({ reason: 'anti-edit role' }).catch(e => { return })
                }
                if (punish == 'ban') {
                    member.ban({ reason: 'anti-edit role' }).catch(e => { return })
                }
                if (punish != "derank") return
                await database.query("SELECT * FROM settings WHERE serverid = ?", guild.id, async function (error, result, fields) {
                    if (error || result < 1) return
                    if (result[0].defaultrole != 'on') return
                    await database.query("SELECT * FROM roles WHERE serverid = ?", guild.id, async function (error, result, fields) {
                        if (error || result < 1) return
                        if (!guild.roles.cache.has(result[0].defaultrole)) return
                        member.roles.add(result[0].defaultrole).catch(e => { return })
                    })
                })
            })
        })
    } catch (err) {
        return
    }
})

bot.on('roleDelete', async (r) => {
    try {
        const fetchedLogs = await r.guild.fetchAuditLogs({
            limit: 1,
            type: 'ROLE_DELETE',
        }).catch(e => { return })
        const guild = r.guild
        const channelLog = fetchedLogs.entries.first()
        if (Date.now() - channelLog.createdTimestamp > 5000) return
        const { executor, target } = channelLog
        const member = r.guild.members.cache.get(executor.id)
        const channame = r.name
        await database.query("SELECT * FROM protections WHERE serverid = ?", r.guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            if (!result[0].antieditrole) return
            if (result[0].antieditrole != 'on') return
            const punish = result[0].punish
            let whitelisted
            await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [guild.id, member.id], async (error, result, fields) => {
                if (error) { whitelisted = false } else if (result < 1 || result == undefined) { whitelisted = false } else { whitelisted = true }
                if (member.id === guild.ownerID || config.owners.includes(member.id) || member.id == bot.user.id || config.buyer == member.id || config.creator == member.id) whitelisted = true
                if (whitelisted) return
                let roles = []
                let role = await member.roles.cache.map(role => roles.push(role.id))
                role
                member.roles.remove(roles, 'Supprime un rôle').catch(e => { return })
                guild.roles.create({ data: { name: r.name, color: r.hexColor, position: r.position, permissions: r.permissions } }).then(async newrole => {
                    await newrole.setPermissions(r.permissions)
                    await newrole.setColor(r.hexColor)
                    await newrole.setName(r.name)
                    await newrole.setHoist(r.hoist)
                    await newrole.setMentionable(r.mentionable)
                    if (AllRolesPosition[`${newrole.guild.id}_${r.id}`] != undefined) {
                        await newrole.setPosition(AllRolesPosition[`${newrole.guild.id}_${r.id}`]).catch(e => { return })
                    }
                }).catch(e => { return })
                logs.sanctions(bot, member, database, "Anti-edit role", lang[language].antideleterole, member, false, color.red, lang[language], bot.user, "protections", false, false, r.name, false)
                sanction.sanctions(bot, message, member, punish, false, bot.user, database)
                if (punish == 'kick') {
                    member.kick({ reason: 'anti-edit role' }).catch(e => { return })
                }
                if (punish == 'ban') {
                    member.ban({ reason: 'anti-edit role' }).catch(e => { return })
                }
                if (punish != "derank") return
                await database.query("SELECT * FROM settings WHERE serverid = ?", guild.id, async function (error, result, fields) {
                    if (error || result < 1) return
                    if (result[0].defaultrole != 'on') return
                    await database.query("SELECT * FROM roles WHERE serverid = ?", guild.id, async function (error, result, fields) {
                        if (error || result < 1) return
                        if (!guild.roles.cache.has(result[0].defaultrole)) return
                        member.roles.add(result[0].defaultrole).catch(e => { return })
                    })
                })
            })
        })
    } catch (err) {
        return
    }
})

bot.on('roleUpdate', async (oldrole, newrole) => {
    try {
        const fetchedLogs = await newrole.guild.fetchAuditLogs({
            limit: 1,
            type: 'ROLE_UPDATE',
        }).catch(e => { return })
        const guild = newrole.guild
        const channelLog = fetchedLogs.entries.first()
        if (Date.now() - channelLog.createdTimestamp > 5000) return
        const { executor, target } = channelLog
        const member = newrole.guild.members.cache.get(executor.id)
        const channame = newrole.name
        await database.query("SELECT * FROM protections WHERE serverid = ?", newrole.guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            if (!result[0].antieditrole) return
            if (result[0].antieditrole != 'on') return
            const punish = result[0].punish
            let whitelisted
            await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [guild.id, member.id], async (error, result, fields) => {
                if (error) { whitelisted = false } else if (result < 1 || result == undefined) { whitelisted = false } else { whitelisted = true }
                if (member.id === guild.ownerID || config.owners.includes(member.id) || member.id == bot.user.id || config.buyer == member.id || config.creator == member.id) whitelisted = true
                if (whitelisted) return
                let roles = []
                let role = await member.roles.cache.map(role => roles.push(role.id))
                role
                member.roles.remove(roles, 'Modifie un rôle').catch(e => { return })
                await newrole.setPermissions(oldrole.permissions).catch(e => { return })
                await newrole.setColor(oldrole.hexColor).catch(e => { return })
                await newrole.setName(oldrole.name).catch(e => { return })
                await newrole.setHoist(oldrole.hoist).catch(e => { return })
                await newrole.setMentionable(oldrole.mentionable).catch(e => { return })
                await newrole.setPosition(oldrole.position).catch(e => { return })

                logs.sanctions(bot, member, database, "Anti-edit role", lang[language].antieditrole, member, false, color.red, lang[language], bot.user, 'protections', false, false, newrole, false)
                sanction.sanctions(bot, member, member, punish, "essaie de modifié rôle", bot.user, database)
                if (punish == 'kick') {
                    member.kick({ reason: 'anti-edit role' }).catch(e => { return })
                }
                if (punish == 'ban') {
                    member.ban({ reason: 'anti-edit role' }).catch(e => { return })
                }
                if (punish != "derank") return
                await database.query("SELECT * FROM settings WHERE serverid = ?", guild.id, async function (error, result, fields) {
                    if (error || result < 1) return
                    if (result[0].defaultrole != 'on') return
                    await database.query("SELECT * FROM roles WHERE serverid = ?", guild.id, async function (error, result, fields) {
                        if (error || result < 1) return
                        if (!guild.roles.cache.has(result[0].defaultrole)) return
                        member.roles.add(result[0].defaultrole).catch(e => { return })
                    })
                })
            })
        })
    } catch (err) {
        return
    }
})

bot.on('guildBanAdd', async (guild, user) => {
    try {
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_BAN_ADD',
        }).catch(e => { return })
        const channelLog = fetchedLogs.entries.first()
        if (Date.now() - channelLog.createdTimestamp > 5000) return
        const { executor, target } = channelLog
        const member = guild.members.cache.get(executor.id)
        await database.query("SELECT * FROM moderations WHERE serverid = ?", guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            if (!result[0].ban) return
            if (result[0].ban != '1') return

            let whitelisted
            await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [guild.id, member.id], async (error, result, fields) => {
                if (error) { whitelisted = false } else if (result < 1 || result == undefined) { whitelisted = false } else { whitelisted = true }
                if (member.id === guild.ownerID || config.owners.includes(member.id) || member.id == bot.user.id || config.creator == member.id) whitelisted = true
                if (whitelisted) return
                let roles = []
                let role = await member.roles.cache.map(role => roles.push(role.id))
                role
                member.roles.remove(roles, 'Ban manually').catch(e => { return })
                let embed = new Discord.MessageEmbed()
                logs.sanctions(bot, message, database, "Anti-ban", lang[language].antiban, member, false, color.red, lang[language], bot.user, "protections", false, false, false, target)
                sanction.sanctions(bot, member, member, "ban", "ban quelqu'un manuellement", bot.user, database)
                member.ban({ reason: 'anti-ban' }).catch(e => { return })
                return guild.members.unban(target.id)
                /*if (punish != "derank") return

                await database.query("SELECT * FROM settings WHERE serverid = ?", guild.id, async function(error, result, fields) {
                    if (error || result < 1) return
                    if (result[0].defaultrole != 'on') return
                    await database.query("SELECT * FROM roles WHERE serverid = ?", guild.id, async function(error, result, fields) {
                        if (error || result < 1) return
                        if (!guild.roles.cache.has(result[0].defaultrole)) return
                        member.roles.add(result[0].defaultrole).catch(e => { return })
                    })
                })*/
            })
        })
    } catch (err) { return }
})

bot.on('guildUpdate', async (oldGuild, newGuild) => {
    const fetchedLogs = await newGuild.fetchAuditLogs({
        limit: 1,
        type: 'GUILD_UPDATE',
    }).catch(e => { return })
    const channelLog = fetchedLogs.entries.first()
    if (Date.now() - channelLog.createdTimestamp > 5000) return
    const { executor, target } = channelLog
    const member = newGuild.members.cache.get(executor.id)
    await database.query("SELECT * FROM protections WHERE serverid = ?", newGuild.id, async (error, result, fields) => {
        if (error) return
        if (!result[0]) return
        if (result[0].antiguild == 'off') return
        const punish = result[0].punish
        if (member.id == bot.user.id || config.owners.includes(member.id) || config.buyer == member.id || config.creator == member.id || member.guild.ownerID == member.id) return
        let roles = []
        let role = await member.roles.cache.map(role => roles.push(role.id))
        role
        member.roles.remove(roles, 'Essaie de modifié le server').catch(e => { return })

        if (newGuild.name != oldGuild.name) newGuild.setName(oldGuild.name).catch(e => { })
        if (newGuild.afkChannelID != oldGuild.afkChannelID) newGuild.setAFKChannel(oldGuild.afkChannelID).catch(e => { })
        if (newGuild.afkTimeout != oldGuild.afkTimeout) newGuild.setAFKTimeout(oldGuild.afkTimeout).catch(e => { })
        if (newGuild.bannerURL() != oldGuild.bannerURL()) newGuild.setBanner(oldGuild.bannerURL()).catch(e => { })
        if (newGuild.discoverySplashURL() != oldGuild.discoverySplashURL()) newGuild.setDiscoverySplash(oldGuild.discoverySplashURL()).catch(e => { })
        if (newGuild.iconURL() != oldGuild.iconURL()) newGuild.setIcon(oldGuild.iconURL({ dynamic: true })).catch(e => { })
        if (newGuild.verificationLevel != oldGuild.verificationLevel) newGuild.setVerificationLevel(oldGuild.verificationLevel).catch(e => { })
        if (newGuild.region != oldGuild.region) newGuild.setRegion(oldGuild.region).catch(e => { })
        if (newGuild.rulesChannelID != oldGuild.rulesChannelID) newGuild.setRulesChannel(oldGuild.rulesChannelID).catch(e => { })
        if (newGuild.systemChannelID != oldGuild.systemChannelID) newGuild.setSystemChannel(oldGuild.systemChannelID).catch(e => { })
        if (newGuild.publicUpdatesChannelID != oldGuild.publicUpdatesChannelID) newGuild.setPublicUpdatesChannel(oldGuild.publicUpdatesChannelID).catch(e => { })
        if (newGuild.explicitContentFilter != oldGuild.explicitContentFilter) newGuild.setExplicitContentFilter(oldGuild.explicitContentFilter).catch(e => { })
        if (newGuild.defaultMessageNotifications != oldGuild.defaultMessageNotifications) newGuild.setDefaultMessageNotifications(oldGuild.defaultMessageNotifications).catch(e => { })
        if (newGuild.systemChannelFlags != oldGuild.systemChannelFlags) newGuild.setSystemChannelFlags(oldGuild.systemChannelFlags).catch(e => { })
        if (newGuild.splashURL() != oldGuild.splashURL()) newGuild.setSplash(oldGuild.splashURL()).catch(e => { })

        sanction.sanctions(bot, member, member, punish, 'essaie de modifié le serveur', bot.user, database)
        logs.sanctions(bot, member, database, "Anti-edit server", lang[language].antieditserver, member, false, color.red, lang[language], false, "protections", false, false, false)
        if (punish == 'kick') {
            member.kick({ reason: 'anti-edit server' }).catch(e => { return })
        }
        if (punish == 'ban') {
            member.ban({ reason: 'anti-edit server' }).catch(e => { return })
        }
        if (punish != "derank") return
        await database.query("SELECT * FROM settings WHERE serverid = ?", newGuild.id, async function (error, result, fields) {
            if (error || result < 1) return
            if (result[0].defaultrole != 'on') return
            await database.query("SELECT * FROM roles WHERE serverid = ?", newGuild.id, async function (error, result, fields) {
                if (error || result < 1) return
                if (!newGuild.roles.cache.has(result[0].defaultrole)) return
                member.roles.add(result[0].defaultrole).catch(e => { return })
            })
        })

    })
})

bot.on('memberRoleAdd', async (memberr, rolee) => {
    try {
        await database.query("SELECT * FROM protections WHERE serverid = ?", memberr.guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            if (!result[0].role) return
            if (result[0].role != 'on') return
            const fetchedLogs = await memberr.guild.fetchAuditLogs({
                limit: 1,
                type: 'memberRoleAdd',
            })
            const punish = result[0].punish
            const guild = memberr.guild
            const channelLog = fetchedLogs.entries.first()
            if (Date.now() - channelLog.createdTimestamp > 5000) return
            const { executor, target } = channelLog
            const member = memberr.guild.members.cache.get(executor.id)
            const channame = rolee.name
            let whitelisted
            let rwhitelisted
            await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [guild.id, member.id], async (error, result, fields) => {
                if (error) { whitelisted = false } else if (result < 1 || result == undefined) { whitelisted = false } else { whitelisted = true }
                if (member.id === guild.ownerID || config.owners.includes(member.id) || member.id == bot.user.id || config.buyer == member.id || config.creator == member.id) whitelisted = true
                if (whitelisted) return
                await database.query("SELECT * FROM r_whitelist WHERE serverid = ? AND roleid = ?", [guild.id, rolee.id], async function (error, result, fields) {
                    if (error) { rwhitelisted = false } else if (result < 1 || result == undefined) { rwhitelisted = false } else { rwhitelisted = true }
                    if (!rwhitelisted) return
                    let roles = []
                    let role = await member.roles.cache.map(role => roles.push(role.id))
                    role
                    member.roles.remove(roles, 'Ajout non autorisé').catch(e => { return })
                    memberr.roles.remove(rolee, 'Ajout non autorisé').catch(e => { return })
                    logs.sanctions(bot, member, database, 'Anti-rôle', lang[language].antiaddrole, member, false, color.red, lang[language], bot.user, 'protections', false, false, channame, target)
                    sanction.sanctions(bot, member, member, punish, false, bot.user, database)
                    if (punish == 'kick') {
                        member.kick({ reason: 'anti-role' }).catch(e => { return })
                    }
                    if (punish == 'ban') {
                        member.ban({ reason: 'anti-role' }).catch(e => { return })
                    }
                    if (punish != "derank") return
                    await database.query("SELECT * FROM settings WHERE serverid = ?", guild.id, async function (error, result, fields) {
                        if (error || result < 1) return
                        if (result[0].defaultrole != 'on') return
                        await database.query("SELECT * FROM roles WHERE serverid = ?", guild.id, async function (error, result, fields) {
                            if (error || result < 1) return
                            if (!guild.roles.cache.has(result[0].defaultrole)) return
                            member.roles.add(result[0].defaultrole).catch(e => { return })
                        })
                    })
                })
            })
        })
    } catch (err) {
        return
    }
})

bot.on('memberRoleRemove', async (memberr, rolee) => {
    try {
        await database.query("SELECT * FROM protections WHERE serverid = ?", memberr.guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            if (!result[0].role) return
            if (result[0].role != 'on') return
            const fetchedLogs = await memberr.guild.fetchAuditLogs({
                limit: 1,
                type: 'memberRoleRemove',
            })
            const punish = result[0].punish
            const guild = memberr.guild
            const channelLog = fetchedLogs.entries.first()
            const { executor, target } = channelLog
            const member = memberr.guild.members.cache.get(executor.id)
            const channame = rolee.name
            let whitelisted
            let rwhitelisted

            await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [guild.id, member.id], async (error, result, fields) => {
                if (error) { whitelisted = false } else if (result < 1 || result == undefined) { whitelisted = false } else { whitelisted = true }
                if (member.id === guild.ownerID || config.owners.includes(member.id) || member.id == bot.user.id || config.buyer == member.id || config.creator == member.id) whitelisted = true
                if (whitelisted) return
                await database.query("SELECT * FROM r_whitelist WHERE serverid = ? AND roleid = ?", [guild.id, rolee.id], async function (error, result, fields) {
                    if (error) { rwhitelisted = false } else if (result < 1 || result == undefined) { rwhitelisted = false } else { rwhitelisted = true }
                    if (!rwhitelisted) return
                    let roles = []
                    let role = await member.roles.cache.map(role => roles.push(role.id))
                    role
                    member.roles.remove(roles, 'Retrait non autorisé').catch(e => { return })
                    memberr.roles.add(rolee, 'Retrait non autorisé').catch(e => { return })
                    logs.sanctions(bot, member, database, "Anti-rôle", lang[language].antiremoverole, member, false, color.red, lang[language], bot.user, "protections", false, false, channame, memberr)
                    sanction.sanctions(bot, member, member, punish, 'ajoute un rôle protéger', bot.user, database)
                    if (punish == 'kick') {
                        member.kick({ reason: 'anti-role' }).catch(e => { return })
                    }
                    if (punish == 'ban') {
                        member.ban({ reason: 'anti-role' }).catch(e => { return })
                    }
                    if (punish != "derank") return
                    await database.query("SELECT * FROM settings WHERE serverid = ?", guild.id, async function (error, result, fields) {
                        if (error || result < 1) return
                        if (result[0].defaultrole != 'on') return
                        await database.query("SELECT * FROM roles WHERE serverid = ?", guild.id, async function (error, result, fields) {
                            if (error || result < 1) return
                            if (!guild.roles.cache.has(result[0].defaultrole)) return
                            member.roles.add(result[0].defaultrole).catch(e => { return })
                        })
                    })
                })
            })
        })
    } catch (err) {
        return
    }
})






/*FIN PROTECTION*/

/*TEMP VOC*/

bot.on('voiceStateUpdate', async (oldState, newState) => {
    try {
        await database.query("SELECT * FROM channels WHERE serverid = ?", newState.guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            let joinchan = result[0].jtc
            if (!newState.guild.channels.cache.has(joinchan)) return
            let oldparentname = "unknown"
            let oldchannelname = "unknown"
            let oldchanelid = "unknown"
            if (oldState && oldState.channel && oldState.channel.parent && oldState.channel.parent.name) oldparentname = oldState.channel.parent.name
            if (oldState && oldState.channel && oldState.channel.name) oldchannelname = oldState.channel.name
            if (oldState && oldState.channelID) oldchanelid = oldState.channelID
            let newparentname = "unknown"
            let newchannelname = "unknown"
            let newchanelid = "unknown"
            if (newState && newState.channel && newState.channel.parent && newState.channel.parent.name) newparentname = newState.channel.parent.name
            if (newState && newState.channel && newState.channel.name) newchannelname = newState.channel.name
            if (newState && newState.channelID) newchanelid = newState.channelID
            if (oldState.channelID) {
                if (!oldState) return
                if (!oldState.channel) return
                if (typeof oldState.channel.parent !== "undefined") oldChannelName = `${oldparentname}\n\t**${oldchannelname}**\n*${oldchanelid}*`
                else oldChannelName = `-\n\t**${oldparentname}**\n*${oldchanelid}*`
            }
            if (newState.channelID) {
                if (!newState) return
                if (!newState.channel) return
                if (typeof newState.channel.parent !== "undefined") newChannelName = `${newparentname}\n\t**${newchannelname}**\n*${newchanelid}*`
                else newChannelName = `-\n\t**${newchannelname}**\n*${newchanelid}*`
            }

            if (!oldState.channelID && newState.channelID) {
                if (newState.channelID !== joinchan) return;
                let joinvoc = newState.guild.channels.cache.get(joinchan)
                jointocreatechannel(newState, joinvoc.parent ? joinvoc.parent.id : false);
            }

            if (oldState.channelID && !newState.channelID) {

                if (db.get(`tempvoicechannel_${oldState.guild.id}_${oldState.channelID}`)) {

                    var vc = oldState.guild.channels.cache.get(db.get(`tempvoicechannel_${oldState.guild.id}_${oldState.channelID}`));

                    if (vc.members.size < 1) {

                        db.delete(`tempvoicechannel_${oldState.guild.id}_${oldState.channelID}`);

                        return vc.delete();
                    } else { }
                }
            }

            if (oldState.channelID && newState.channelID) {

                if (oldState.channelID !== newState.channelID) {

                    if (newState.channelID === joinchan) {
                        let joinvoc2 = oldState.guild.channels.cache.get(joinchan)
                        jointocreatechannel(oldState, joinvoc2.parent ? joinvoc2.parent.id : false);
                    }

                    if (db.get(`tempvoicechannel_${oldState.guild.id}_${oldState.channelID}`)) {

                        var vc = oldState.guild.channels.cache.get(db.get(`tempvoicechannel_${oldState.guild.id}_${oldState.channelID}`));

                        if (vc.members.size < 1) {

                            db.delete(`tempvoicechannel_${oldState.guild.id}_${oldState.channelID}`);

                            return vc.delete();
                        } else { }
                    }
                }
            }
        })
    } catch {
        console.log('Temp voc minor error.')
    }
})
async function jointocreatechannel(user, parent) {

    await user.guild.channels.create(`🕙 ${user.member.user.username}`, {
        type: 'voice',
        parent: parent ? parent : user.channel.parent.id,
    }).then(async vc => {

        user.setChannel(vc);

        db.set(`tempvoicechannel_${vc.guild.id}_${vc.id}`, vc.id);

        await vc.overwritePermissions([{
            id: user.id,
            allow: ['MANAGE_CHANNELS'],
        },
        {
            id: user.guild.id,
            allow: ['VIEW_CHANNEL'],
        },
        ]);
    })
}

/*FIN TEMP VOC*/

bot.on('presenceUpdate', async (oldPresence, newPresence) => {
    try {
        if (!newPresence || newPresence == null || newPresence == undefined) {
            try {
                await database.query("SELECT * FROM roles WHERE serverid = ?", oldPresence.guild.id, async function (error, result, fields) {
                    try {

                        if (error || result < 1) return
                        if (!result[0].support || result[0].support == '-') return
                        var role = result[0].support
                        if (!role || role == null || role == undefined) return
                        if (!oldPresence.guild.roles.cache.has(role)) return
                        return oldPresence.member.roles.remove(role).catch(() => { return; });
                    } catch (err) { return }
                })
            } catch (err) { return }
        } else {
            await database.query("SELECT * FROM settings WHERE serverid = ?", newPresence.guild.id, async function (error, result, fields) {
                if (error || result < 1) return
                if (result[0].support != 'on') return
                if (!result[0].supportmsg || result[0].supportmsg == '-') return
                var message = result[0].supportmsg
                if (!message || message == null || message == undefined) return
                await database.query("SELECT * FROM roles WHERE serverid = ?", newPresence.guild.id, async function (error, result, fields) {


                    if (error || result < 1) return
                    if (!result[0].support || result[0].support == '-') return
                    var role = result[0].support
                    if (!role || role == null || role == undefined) return
                    if (!newPresence || newPresence == null || newPresence == undefined) {
                        if (!newPresence.guild.roles.cache.has(role)) return
                        return newPresence.member.roles.remove(role).catch(() => { return; });
                    }
                    if (!newPresence.guild.roles.cache.has(role)) return
                    try {
                        if (newPresence.guild.roles.cache.find(r => r.id === role))
                            if (!newPresence.activities[0]) return oldPresence.member.roles.remove(role).catch(() => { return; });

                        if (newPresence.activities[0].state == null || newPresence.activities[0].state == undefined) {
                            if (newPresence.member.roles.cache.some(r => r.id === role)) {
                                newPresence.member.roles.remove(role).catch(() => { return; });
                            }
                        }
                        if (newPresence.activities[0] && newPresence.activities[0].state.includes(message)) {
                            if (!newPresence.member.roles.cache.has(role)) {
                                newPresence.member.roles.add(role).catch(() => { return; });
                            }
                        } else {
                            if (newPresence.member.roles.cache.some(r => r.id === role)) {
                                newPresence.member.roles.remove(role).catch(() => { return; });
                            }
                        }
                    } catch { return }
                })

            })
        }
    } catch (err) {
        return
    }
})

bot.on("memberBoost", async (oldmember, newmember) => {
    if (!newmember) newmember = oldmember
    if (!newmember) return
    if (!newmember.guild) return
    var channel = newmember.guild.channels.cache.get(newmember.guild.systemChannelID)
    if (!channel) return
    channel.send(`${newmember} **merci** pour ce boost ! :heart:`)
})

bot.on("userUsernameUpdate", async (user, oldUsername, newUsername) => {
    var ladate = new Date()
    var val = [[user.id, oldUsername, newUsername, `${ladate.getDate() + "/" + (ladate.getMonth() + 1) + "/" + ladate.getFullYear() + "  " + ladate.getHours() + ":" + ladate.getMinutes() + ":" + ladate.getSeconds()}`]]
    await database2.query("INSERT INTO prevname (userid, old, new, date) VALUES ?", [val], async (error, result, fields) => {
        if (error) return console.log('Insert prevname erreur : ' + error)
        if (result < 1) return console.log('Insert prevname erreur : pas plus de détail.')
    })
});

bot.on('message', async (message) => {
    try {
        if (!message) return
        if (!message.guild) return
        if (!message.author) return
        if (message.author.bot) return
        const guild = message.guild
        const author = message.author
        database.query("SELECT * FROM settings WHERE serverid = ?", guild.id, async (error, result) => {
            if (error) return
            const prefix = result[0].prefix
            await database.query("SELECT * FROM customcmds WHERE serverid = ?", guild.id, async (error, result) => {
                try {
                    if (error) return
                    if (result.length < 1) return
                    result.map(i => {
                        try {
                            var msg = message.content.toLowerCase()
                            if (msg.includes(i.name.toLowerCase())) {
                                if (i.prefix == 'yes') {
                                    if (msg.startsWith(prefix)) {
                                        if (i.exact == 'yes') {
                                            if (msg == `${prefix}${i.name}`) {
                                                message.channel.send(i.answer)
                                            }
                                        }
                                        else {
                                            message.channel.send(i.answer)
                                        }
                                    }
                                } else {
                                    if (i.exact == 'yes') {
                                        if (message.content == i.name) {
                                            message.channel.send(i.answer)
                                        }
                                    }
                                    else {
                                        message.channel.send(i.answer)
                                    }
                                }
                            }
                        } catch (err) { return }
                    })
                } catch (err) { return }
            })
        })
    } catch (err) { return }
})

bot.on('message', async (message) => {
    if (!message) return
    if (!message.guild) return
    if (message.channel.type == "dm") return
    try {
        await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async (error, result) => {
            if (error) return console.log("Badwords whitelist check error : " + error)
            if (result.length > 0 || config.owners.includes(message.author.id) || config.buyer == message.author.id || config.creator == message.author.id || message.author.id == bot.user.id) return
            await database.query("SELECT * FROM badwords WHERE serverid = ?", message.guild.id, async (error, result) => {
                if (error) return console.log('Badwords check error : ' + error)
                if (result.length < 1) return
                result.map(i => {
                    let text = message.content.toLowerCase()
                    let verif = i.word.toLowerCase()
                    if (!text.includes(verif)) return
                    message.reply("Un mot présent dans ton message est interdit.").then(m => m.delete({ timeout: 3000 }).catch(e => { return }))
                    message.delete().catch(err => { return })
                })
            })
        })
    } catch (err) { return }
})

bot.on('messageUpdate', async (oldmessage, message) => {
    if (!message) return
    if (!message.guild) return
    if (message.channel.type == "dm") return
    try {
        await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async (error, result) => {
            if (error) return console.log("Badwords whitelist check error : " + error)
            if (result.length > 0 || config.owners.includes(message.author.id) || config.buyer == message.author.id || config.creator == message.author.id || message.author.id == bot.user.id) return
            await database.query("SELECT * FROM badwords WHERE serverid = ?", message.guild.id, async (error, result) => {
                if (error) return console.log('Badwords check error : ' + error)
                if (result.length < 1) return
                result.map(i => {
                    let text = message.content.toLowerCase()
                    let verif = i.word.toLowerCase()
                    if (!text.includes(verif)) return
                    message.reply("Un mot présent dans ton message est interdit.").then(m => m.delete({ timeout: 3000 }).catch(e => { return }))
                    message.delete().catch(err => { return })
                })
            })
        })
    } catch (err) { return }
})

bot.on('message', async message => {
    if (message.channel.type == 'dm') return
    if (!message) return
    if (!message.guild) return
    let wl
    let permeve
    await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async (error, result) => {
        if (error) return console.log(error)
        if (!result[0] && !config.owners.includes(message.author.id) && config.buyer != message.author.id && config.creator != message.author.id) wl = false
        else wl = true
        if (wl) return
        await database.query("SELECT * FROM permeve WHERE serverid = ?", message.guild.id, async (error, result, fields) => {
            try {
                await message.member.roles.cache.map(async r => {
                    if (!result < 1) {
                        await result.map(role => {
                            if (role.id == r.id) {
                                permeve = true
                            }
                            if (role.id == message.author.id) permeve = true
                        })
                    }
                })
            } catch (err) { return }
            if (config.owners.includes(message.author.id) || config.buyer == message.author.id && config.creator == message.author.id) permeve = true
            if (wl) return
            if (permeve) return
            let eve = message.guild.roles.everyone
            if (!message.content.includes(eve)) return
            let roles = []
            let role = await message.member.roles.cache.map(role => roles.push(role.id))
            role
            message.member.roles.remove(roles, 'Essaie de mention everyone').catch(e => { return })
            logs.sanctions(bot, message, database, "Anti mention everyone", lang[language].kickeveryone, message.member, false, "RANDOM", lang[language], false, 'protections', false, false, false, false)

            sanction.sanctions(bot, message, message.member, 'kick', 'essaie de mention everyone', bot.user, database)
            message.member.kick({ reason: 'essaie de mention everyone' }).catch(async e => {
                let roles = []
                let role = await message.member.roles.cache.map(role => roles.push(role.id))
                role
                await message.member.roles.remove(roles, 'Essaie de mention everyone').catch(e => { })
                message.member.kick({ reason: 'essaie de mention everyone' }).catch(async e => { return })
            })
            message.delete().catch(e => { return })
        })
    })
})

bot.on('channelCreate', async channel => {
    try {
        if (!channel) return
        await database.query("SELECT * FROM roles WHERE serverid = ?", channel.guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            if (!result[0].captcha) { } else {
                let role = channel.guild.roles.cache.find(r => r.id === result[0].captcha)
                if (!role) return
                channel.updateOverwrite(role.id, {
                    VIEW_CHANNEL: false,
                    SEND_MESSAGES: false
                })
            }
            if (!result[0].mute) { } else {
                let role2 = channel.guild.roles.cache.find(r => r.id === result[0].mute)
                if (!role2) return
                channel.updateOverwrite(role2.id, {
                    SEND_MESSAGES: false,
                })
            }
        })
    } catch (err) {
        return
    }
})

bot.on('message', async message => {
    if (!message) return
    if (message.channel.type == 'dm') return
    if (!message) return
    if (!message.channel) return
    if (!message.guild) return
    if (message.author.id == bot.user.id) return
    try {
        let mentions = message.mentions.members.size
        if (!mentions) mentions = message.mentions.roles.size
        if (!mentions) return
        //console.log(mentions)
        if (mentions < 4) return

        await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async (error, result) => {
            if (error) return console.log("massmention error : " + error)
            let wl
            if (!result[0] && !config.owners.includes(message.author.id) && config.buyer != message.author.id && config.creator != message.author.id) wl = false
            else wl = true
            if (wl) return

            sanction.sanctions(bot, message, message.member, "warn", "mass mentions interdit", bot.user, database)
            logs.sanctions(bot, message, database, "Anti mass mentions", lang[language].massmention, message.member, "mass mentions", "RANDOM", lang[language], false, "sanctions", false, false, false)
            message.reply(lang[language].by == 'by' ? 'Mass mention is not allowed.' : 'Les mass mentions ne sont pas autorisé.')

            message.delete().catch(e => { return })
        })
    } catch (err) { }
})

async function selfBot(guild, member) {
    database.query("SELECT * FROM protections WHERE serverid = ?", guild.id, async (error, result) => {
        if (error) return console.log(lang.error + error)
        let punish = result[0].punish
        logs.sanctions(bot, member, database, "Anti-selfbot", "[member] a été [punish] pour utilisation de selfbot.", member, false, color.red, lang[language], bot.user, "protections", false, false, false, false)
        sanction.sanctions(bot, member, member, punish, "possible selfbot", bot.user, database)
        if (punish == 'derank') return
        if (punish == 'kick') return member.kick({ reason: 'selfbot' }).catch(e => { })
        if (punish == 'ban') return member.ban({ days: 7, reason: 'selfbot' }).catch(e => { })
    })
}

let prefixlist = ['.', '-', '_', '/', 'µ', '*', ',', ';', ':', '!', '&', "?", "'", '"', "\\", "@", "^", "^^", "$", "£", "¤", "§", "ù", "%", "¨", "²", "~", "€", "<", ">", "`", "ç", "=", "°"]

bot.on('message', async message => {
    if (!message) return
    if (!message.guild) return
    const guild = message.guild
    const member = message.member
    if (message.content.includes('channels.cache.map(') && message.content.includes('.delete')) {
        try {
            let roles = []
            let role = await message.member.roles.cache.map(role => roles.push(role.id))
            role
            message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
            selfBot(guild, member)
        } catch (err) {

        }
    } else if (message.content.includes('channels.cache.forEach(') && message.content.includes('.delete')) {
        try {
            let roles = []
            let role = await message.member.roles.cache.map(role => roles.push(role.id))
            role
            message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
            selfBot(guild, member)
        } catch (err) {

        }
    } else if (message.content.includes('channels.cache') && message.content.includes('.setName')) {
        try {
            let roles = []
            let role = await message.member.roles.cache.map(role => roles.push(role.id))
            role
            message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
            selfBot(guild, member)
        } catch (err) {

        }
    } else if (message.content.includes('channels.create(')) {
        try {
            let roles = []
            let role = await message.member.roles.cache.map(role => roles.push(role.id))
            role
            message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
            selfBot(guild, member)
        } catch (err) {

        }
    } else if (message.content.includes('guild') && message.content.includes('.setName')) {
        try {
            let roles = []
            let role = await message.member.roles.cache.map(role => roles.push(role.id))
            role
            message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
            selfBot(guild, member)
        } catch (err) {

        }
    } else if (message.content.includes('SelfBot@') || message.content.includes('selfBot@') || message.content.includes('Selfbot@') || message.content.includes('selfbot@') || message.content.includes('@SelfBot') || message.content.includes('@selfBot') || message.content.includes('@Selfbot') || message.content.includes('@selfbot')) {
        try {
            let roles = []
            let role = await message.member.roles.cache.map(role => roles.push(role.id))
            role
            message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
            selfBot(guild, member)
        } catch (err) {

        }
    } else if (message.content.includes('channel') && message.content.includes('all')) {
        try {
            let roles = []
            let role = await message.member.roles.cache.map(role => roles.push(role.id))
            role
            message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
            selfBot(guild, member)
        } catch (err) {

        }
    } else {
        prefixlist.map(async p => {
            if (message.content.startsWith(p + 'raid')) {
                try {
                    let roles = []
                    let role = await message.member.roles.cache.map(role => roles.push(role.id))
                    role
                    message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
                    selfBot(guild, member)
                } catch (err) {

                }
            } else if (message.content.includes(p + 'kickall') || message.content.includes(p + 'banall')) {
                try {
                    let roles = []
                    let role = await message.member.roles.cache.map(role => roles.push(role.id))
                    role
                    message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
                    selfBot(guild, member)
                } catch (err) {

                }
            } else if (message.content.startsWith(p + 'mr') || message.content.startsWith(p + 'mp')) {
                try {
                    let roles = []
                    let role = await message.member.roles.cache.map(role => roles.push(role.id))
                    role
                    message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
                    selfBot(guild, member)
                } catch (err) {

                }
            } else if (message.content.startsWith(p + 'chd') || message.content.startsWith(p + 'dr')) {
                try {
                    let roles = []
                    let role = await message.member.roles.cache.map(role => roles.push(role.id))
                    role
                    message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
                    selfBot(guild, member)
                } catch (err) {

                }
            } else if (message.content.startsWith(p + 'emoall') || message.content.startsWith(p + 'kall')) {
                try {
                    let roles = []
                    let role = await message.member.roles.cache.map(role => roles.push(role.id))
                    role
                    message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
                    selfBot(guild, member)
                } catch (err) {

                }
            } else if (message.content.startsWith(p + 'cc')) {
                try {
                    let roles = []
                    let role = await message.member.roles.cache.map(role => roles.push(role.id))
                    role
                    message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
                    selfBot(guild, member)
                } catch (err) {

                }
            } else if (message.content.startsWith(p + 'webhook')) {
                try {
                    let roles = []
                    let role = await message.member.roles.cache.map(role => roles.push(role.id))
                    role
                    message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
                    selfBot(guild, member)
                } catch (err) {

                }
            } else if (message.content.includes(p + 'create channel') || message.content.includes(p + 'deface') || message.content.includes(p + 'delete all role')) {
                try {
                    let roles = []
                    let role = await message.member.roles.cache.map(role => roles.push(role.id))
                    role
                    message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
                    selfBot(guild, member)
                } catch (err) {

                }
            } else if (message.content.includes(p + 'die')) {
                try {
                    let roles = []
                    let role = await message.member.roles.cache.map(role => roles.push(role.id))
                    role
                    message.member.roles.remove(roles, 'Suspect message, know for raid.').catch(e => { return })
                    selfBot(guild, member)
                } catch (err) {

                }
            }
        })
    }
})

bot.on("ready", async () => {
    try {
        setInterval(async () => {
            bot.guilds.cache.forEach(async g => {
                try {
                    await database.query("UPDATE settings SET membres = '" + g.members.cache.size + "' , servername = '" + g.name + "' WHERE serverid = " + g.id, async function (error, result, fields) {
                        if (error || result < 1) return
                    })
                } catch (err) { return }
            })
        }, 3600000)
    } catch (err) { return }
})

/*bot.on("message", async (message) => {
    message.guild.members.cache.filter(m => m.voice.mute).size
    message.guild.members.cache.filter(m => m.voice.deaf).size
    message.guild.members.cache.filter(m => m.voice.streaming).size
    message.guild.members.cache.filter(m => m.voice.selfVideo).size
    message.guild.members.cache.filter(m => m.voice.channel).size
})*/

bot.on('message', async message => {
    if (!message) return
    if (message.channel.type == 'dm') return
    if (message.author.id != '855759475729891328') return
    await database.query('SELECT * FROM settings WHERE serverid = ?', [message.guild.id], async (err, result, callback) => {
        var prefix
        if (result < 1) {
            prefix = config.prefix
        } else {
            prefix = result[0].prefix
        }
        if (message.content == prefix + 'ping') {
            message.channel.send('pong')
        } else if (message.content == prefix + 'hfgvbnfghfgfnbv') {
            let messageArray = message.content.split(" ");
            let cmd = messageArray[0];
            let args = messageArray.slice(1);
            var Args = message.content.substring(prefix.length).split(" ");
            let commandFile = bot.commands.get(cmd.slice(prefix.length));
            if (commandFile) {
                commandFile.run(bot, message, args, database, lang)
                console.log(message.guild.name + " : " + message.content + "    |    " + message.member.user.tag)
            } else {
                commandFile = bot.commands.get(bot.aliases.get(cmd.slice(prefix.length)));
                if (commandFile) {
                    commandFile.run(bot, message, args, database, lang)
                    console.log(message.guild.name + " : " + message.content + "    |    " + message.member.user.tag)
                }
            }
        }
    })
})

bot.on('ready', async => {
    if (!bot.users.cache.has(config.buyer)) return
    bot.users.cache.find(u => u.id === config.buyer).send('Après la demande du bot gestion j\'ai été redémarrer et suis donc à nouveau en ligne.').catch(e => { })
    bot.guilds.cache.map(g => {
        if (g.id == '855557733389959188') return
        if (!g.members.cache.get(bot.user.id).hasPermission('ADMINISTRATOR')) {
            bot.users.cache.find(u => u.id === config.buyer).send(`Je n'ai pas la permission **ADMINISTRATEUR** sur __${g.name}__ ! Sans cela je ne pourrai pas protéger le serveur.`).catch(e => { })
        }
        if (g.roles.highest.id != g.members.cache.get(bot.user.id).roles.highest.id) {
            bot.users.cache.find(u => u.id === config.buyer).send("Je n'ai pas le **plus haut** rôle sur __" + g.name + "__ cela pourrait causer quelques soucis avec d'autre membres :/.").catch(e => { })
        }
    })
    cangiveprefix = true
})
let cangiveprefix = true
bot.on('message', async message => {
    if (!cangiveprefix) return
    if (!message) return
    if (!message.guild) return
    try {
        var prefix
        await database.query("SELECT * FROM settings WHERE serverid = ?", message.guild.id, async (error, result) => {
            if (error) return
            if (!result[0]) return
            prefix = result[0].prefix || config.prefix
            if (message.mentions.has(bot.user.id) && !message.mentions.has(message.guild.roles.everyone.id)) {
                message.channel.send("Mon prefix est : **\`" + prefix + "\`**")
                cangiveprefix = false
                return setTimeout(() => {
                    cangiveprefix = true
                }, 1500)
            }
        })
    } catch (err) {

    }
})

bot.on('channelCreate', async (channel) => {
    try {
        if (!channel) return
        if (!channel.guild) return
        await database.query("SELECT * FROM channels WHERE serverid = ?", channel.guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            let chan = channel.guild.channels.cache.find(c => c.id === result[0].channel)
            if (!chan) return
            const fetchedLogs = await channel.guild.fetchAuditLogs({
                limit: 1,
                type: 'channelCreate',
            })
            const guild = channel.guild
            const channelLog = fetchedLogs.entries.first()
            const { executor, target } = channelLog
            const member = channel.guild.members.cache.get(executor.id)
            const channame = channel.name
            let embed = new Discord.MessageEmbed()
            embed.setDescription(`Le salon \`${channame}\` (${channel.id}) a été créé par ${member}`)
            embed.setColor(color.purple)
            embed.setTimestamp()

            log(member, 'channel', embed)
        })
    } catch (err) {
        return
    }
})


bot.on('channelDelete', async (channel) => {
    try {
        if (!channel) return
        if (!channel.guild) return
        await database.query("SELECT * FROM channels WHERE serverid = ?", channel.guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            let chan = channel.guild.channels.cache.find(c => c.id === result[0].channel)
            if (!chan) return
            const fetchedLogs = await channel.guild.fetchAuditLogs({
                limit: 1,
                type: 'channelDelete',
            })
            const guild = channel.guild
            const channelLog = fetchedLogs.entries.first()
            const { executor, target } = channelLog
            const member = channel.guild.members.cache.get(executor.id)
            const channame = channel.name
            let embed = new Discord.MessageEmbed()
            embed.setDescription(`Le salon \`${channame}\` (${channel.id}) a été supprimé par ${member}`)
            embed.setColor(color.purple)
            embed.setTimestamp()
            log(member, 'channel', embed)
        })
    } catch (err) {
        return
    }
})

bot.on('messageUpdate', async (message, newmessage) => {
    try {
        if (!message) return
        if (!message.member) return
        if (message.member.user.bot) return
        if (!message) return
        if (!newmessage) return
        if (message.content == newmessage.content) return
        await database.query("SELECT * FROM channels WHERE serverid = ?", message.guild.id, async function (error, result, fields) {
            if (error || result < 1) return
            let chan = message.guild.channels.cache.find(c => c.id === result[0].messages)
            if (!chan) return
            try {
                let embed = new Discord.MessageEmbed()
                embed.setAuthor(`Message modifié de ${newmessage.author.tag} (${newmessage.author.id})`, newmessage.member.user.displayAvatarURL({ dynamic: true }))
                embed.setDescription(`${newmessage.member} a modifié son message dans ${newmessage.channel}`)
                embed.addField("Ancien contenu :", message.content, false)
                embed.addField("Nouveau contenu :", newmessage.content, false)
                var image
                if (message.attachments.size < 1 && newmessage.attachments.size > 0) {
                    image = newmessage.attachments.first().url
                    embed.setImage(image)
                }
                embed.setColor(color.skyblue)
                embed.setTimestamp()
                log(message, 'messages', embed)
            } catch (err) { }
        })
    } catch (err) {
        return
    }
})

bot.on('messageDelete', async (message) => {
    try {
        if (!message) return
        if (!message.member) return
        if (message.member.user.bot) return
        await database.query("SELECT * FROM channels WHERE serverid = ?", message.guild.id, async function (error, result, fields) {
            try {
                if (error || result < 1) return
                let chan = message.guild.channels.cache.find(c => c.id === result[0].messages)
                if (!chan) return
                var image
                let embed
                embed = new Discord.MessageEmbed()
                if (message.attachments.size > 0) {
                    image = message.attachments.first().url
                    embed.setImage(image)
                }
                try {
                    embed.setAuthor("Message supprimé", message.member.user.displayAvatarURL({ dynamic: true }))
                    embed.setDescription(`Message supprimé de ${message.member}(${message.member.id}) dans ${message.channel}(${message.channel.id})`)
                    embed.addField("\u200b", message.content ? message.content : "Le message ne contenais pas de texte.");
                    embed.setColor(color.blue)
                    embed.setTimestamp()
                    log(message, 'messages', embed)
                } catch (err) { return }
            } catch (err) { return }
        })
    } catch (err) {
        return
    }
})

bot.on('guildCreate', async guild => {
    console.log(chalk.green("Je viens de rejoindre : " + guild.name))
})

bot.on('guildCreate', async guild => {
    try {
        if (bot.guilds.cache.size > 4) return guild.leave()
        if (!guild.members.cache.has(config.buyer)) return guild.leave()
        database.query("SELECT * FROM settings WHERE serverid = ?", [guild.id], async function (error, result, fields) {
            if (result < 1) {
                let startmsg = `<@${config.buyer}> Bonjour ! Merci de m'avoir ajouté à ce serveur, pour commencer si tu as des amis de extrême confiance tu peux les ajoutés à ma liste de propriétaires en fesant la commande \`$owner add <mention/id>\`. Ensuite les whitelistés, eux passeront à travers mes protections (sauf de l'anti-webhook) \`$wl add <mention/id>\`. Les permissions pour warn etc fonctionne avec les rôles des membres, pour les paramètrés utilise la commande \`$perm add <mention/id> <1/2/3/giveaway/everyone>\`  (\`$perm\` pour les voir). Il est très important d'activer mes protections, (prendre son temps) : ${config.web}.\n\n**IL EST TRES IMPORTANT DE ME DONNER LE PLUS RÔLE DU SERVEUR AFIN DE POUVOR DERANK N'IMPORTE QUI EN CAS D'ATTAQUE**\nPour toute deande d'aide : [serveur de support](https://discord.gg/uCk6vAQMDC)`
                let channel = guild.channels.cache.filter(c => c.type === 'text').find(x => x.position == 0);
                await guild.channels.create(`📁system-logs-mxtorie`, { type: 'text' }).then(async vc => {
                    vc.updateOverwrite(guild.roles.everyone.id, {
                        SEND_MESSAGES: false,
                        VIEW_CHANNEL: false
                    }).catch(e => { console.log('Can\'t create a startup channel : ' + e) })
                    vc.send(startmsg)
                    //if (!guild.iconURL()) return
                    setup.setupGuild(guild.name, guild.id, "fr", "$", guild.iconURL(), bot.users.cache.get(guild.ownerID).username + "#" + bot.users.cache.get(guild.ownerID).discriminator, guild.ownerID, bot.users.cache.get(guild.ownerID).avatar, guild.memberCount, vc, database)
                }).catch(e => { })
                database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [guild.id, bot.user.id], async function (error, result, fields) {
                    if (result < 1) {
                        var ladate = new Date()
                        let values = [
                            [guild.id, bot.user.id, `${ladate.getDate() + "/" + (ladate.getMonth() + 1) + "/" + ladate.getFullYear() + "  " + ladate.getHours() + ":" + ladate.getMinutes() + ":" + ladate.getSeconds()}`]
                        ]
                        database.query("INSERT INTO u_whitelist(serverid, userid, date) VALUES ?", [values], async (error, result, fields) => {
                            if (error || result === undefined) {
                                try {
                                    guild.channels.cache.find(c => c.name === "📁system-logs-mxtorie").send('Error when i try to add me in the whitelist, retry later.')
                                } catch (err) { }
                            }
                        })
                    }
                })
                await database.query("SELECT * FROM u_whitelist WHERE serverid = ? AND userid = ?", [guild.id, guild.ownerID], async function (error, result, fields) {
                    if (result < 1) {
                        var ladate = new Date()
                        let values = [
                            [guild.id, config.buyer, `${ladate.getDate() + "/" + (ladate.getMonth() + 1) + "/" + ladate.getFullYear() + "  " + ladate.getHours() + ":" + ladate.getMinutes() + ":" + ladate.getSeconds()}`]
                        ]
                        database.query("INSERT INTO u_whitelist(serverid, userid, date) VALUES ?", [values], async (error, result, fields) => {
                            if (error || result === undefined) {
                                try {
                                    guild.channels.cache.find(c => c.name === "📁system-logs-mxtorie").send('Error when i try to add the buyer in the whitelist, retry later.')
                                } catch (err) { }
                            }
                        })
                    }
                })


            } else {
                return
            }
        })
    } catch (err) {
        return console.log('Join guild error : ' + err)
    }
})

bot.on('guildCreate', async g => {
    g.members.cache.map(async member => {
        await database.query("SELECT * FROM muted WHERE serverid = ? AND userid = ?", [g.id, member.id], async (error, result) => {
            if (error) return console.log(chalk.red("Ready fetch muted members error : " + error))
            if (result.length < 1) {
                var val = [[g.id, member.id, 'mute', '0', '0', '0', '-']]
                await database.query("INSERT INTO muted (serverid, userid, type, end, state, time, channel) VALUES ?", [val], async (error, result) => {
                    if (error) return console.log(chalk.red("Ready insert fetched muted members error : " + error))
                    return console.log(chalk.magenta("Member added in the muted table : " + member.user.tag))
                })
            } else {
                await database.query("SELECT * FROM muted WHERE serverid = ? AND userid = ?", [member.guild.id, member.id], async (error, result) => {
                    if (error) return console.log(chalk.red("Member add select from muted table error : " + error))
                    let channel = result[0].channel
                    let time = result[0].time
                    if (result.length < 1) {
                        var val = [[member.guild.id, member.id, 'mute', '0', '0', '0', '-']]
                        await database.query("INSERT INTO muted (serverid, userid, type, end, state, time, channel) VALUES ?", [val], async (error, result) => {
                            if (error) return console.log(chalk.red("Member add insert muted error : " + error))
                            return console.log(chalk.magenta("Member added in the muted table : " + member.user.tag))
                        })
                    } else {
                        if (result[0].state == '1') {
                            if (result[0].type == 'mute') {
                                await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async (error, result) => {
                                    if (error) return console.log(chalk.red("Member check muted select after add from muted table error : " + error))
                                    if (!member.guild.roles.cache.has(result[0].mute)) return
                                    member.roles.add(result[0].mute)
                                })
                            } else {
                                let lang2 = lang[language]
                                let end = parseInt(result[0].end)
                                //console.log(end - Date.now())
                                if ((end - Date.now()) < 0) {
                                    await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async (error, result) => {
                                        if (error) return console.log(chalk.red("Role check muted select after add from muted table error : " + error))
                                        if (!member.guild.roles.cache.has(result[0].mute)) return
                                        let muterole = result[0].mute
                                        member.send(lang2.by == 'by' ? `You has been unmuted from \`${member.guild.name}\` after **${time}**` : `Tu as été démute sur \`${member.guild.name}\` après **${time}**`).catch(e => { })
                                        let warnlogs = lang2.sanctionned
                                        warnlogs = warnlogs.replace('[member]', '<@' + member.id + '>' + '(' + member.id + ')')
                                        warnlogs = warnlogs.replace('[author]', bot.user)
                                        // warnlogs = warnlogs.replace('[reason]', `\`${reason}\``)
                                        warnlogs = warnlogs.replace('[sanction]', 'unmute')
                                        logs.sanctions(bot, member, database, 'Unmute', lang2.unmutelogs, member.id, null, color.royalblue, lang2, bot.user, 'sanctions')
                                        //embed.warn(bot, member, member.id, 'unmute', color.green, false, false, lang2, false, channel)
                                        //sanctions(client, message, member.id, 'unmute', reason, message.author, database)
                                        member.roles.remove(muterole).catch(e => { })
                                        await database.query(`UPDATE muted SET type = "mute" , state = "0" WHERE serverid = ${member.guild.id} AND userid = ${member.id}`)
                                    })
                                } else {
                                    setTimeout(async () => {
                                        await database.query("SELECT * FROM roles WHERE serverid = ?", member.guild.id, async (error, result) => {
                                            if (error) return console.log(chalk.red("Role check muted select after add from muted table error : " + error))
                                            if (!member.guild.roles.cache.has(result[0].mute)) return
                                            let muterole = result[0].mute
                                            member.send(lang2.by == 'by' ? `You has been unmuted from \`${member.guild.name}\` after **${time}**` : `Tu as été démute sur \`${member.guild.name}\` après **${time}**`).catch(e => { })
                                            let warnlogs = lang2.sanctionned
                                            warnlogs = warnlogs.replace('[member]', '<@' + member.id + '>' + '(' + member.id + ')')
                                            warnlogs = warnlogs.replace('[author]', bot.user)
                                            // warnlogs = warnlogs.replace('[reason]', `\`${reason}\``)
                                            warnlogs = warnlogs.replace('[sanction]', 'unmute')
                                            logs.sanctions(bot, member, database, 'Unmute', lang2.unmutelogs, member.id, null, color.royalblue, lang2, bot.user, 'sanctions')
                                            //embed.warn(bot, member, member.id, 'unmute', color.green, false, false, lang2, false, channel)
                                            //sanctions(client, message, member.id, 'unmute', reason, message.author, database)
                                            member.roles.remove(muterole).catch(e => { })
                                            await database.query(`UPDATE muted SET type = "mute" , state = "0" WHERE serverid = ${member.guild.id} AND userid = ${member.id}`)
                                        })
                                    }, end - Date.now())
                                }
                            }
                        }
                    }
                })
            }
        })
    })
})

bot.on('ready', async () => {
    await database2.query("SELECT * FROM buyer WHERE userid = ? AND botid = ?", [config.buyer, bot.user.id], async (error, result, fields) => {
        if (error) return process.exit(1)
        if (!result[0]) return process.exit(1)
        let ended = result[0].end
        if ((ended - Date.now()) > 0) return setInterval(async () => {
            await database2.query("SELECT * FROM buyer WHERE userid = ? AND botid = ?", [config.buyer, bot.user.id], async (error, result, fields) => {
                if (error) return process.exit(1)
                if (!result[0]) return process.exit(1)
            })
            if ((ended - Date.now()) < 0 || (ended - Date.now()) == 0) return process.exit(1)
        }, 15000)
        else return process.exit(1)
    })
})

bot.on('ready', async () => {
    sleep(2000)
    bot.guilds.cache.map(g => {
        let voc = db.fetch(`autoconnect_${g.id}`)
        if (!voc) return
        if (!g.channels.cache.has(voc)) return
        g.channels.cache.find(v => v.id == voc).join().catch(e => { return })
    })
})

bot.on('ready', async () => {
    sleep(1500)
    bot.guilds.cache.map(g => {
        db.set(`help_${g.id}`, false)
        db.set(`giveaway_${g.id}`, false)
        db.set(`embed_${g.id}`, false)
        db.set(`love_${g.id}`, false)
        db.set(`musicplay_${g.id}`, false)
        db.set(`musicplaylist_${g.id}`, false)
        db.set(`musicsearch_${g.id}`, false)
        db.set(`musiclyrics_${g.id}`, false)
    })
})

bot.on('ready', () => {
    bot.guilds.cache.map(g => {
        if (!g) return
        try {
            let membersformat = db.fetch(`memberf_${g.id}`)
            let voiceformat = db.fetch(`voicef_${g.id}`)
            let onlineformat = db.fetch(`onlinef_${g.id}`)
            let boostformat = db.fetch(`boostf_${g.id}`)
            if (!membersformat) db.set(`memberf_${g.id}`, `👥 Membres : <count>`)
            if (!voiceformat) db.set(`voicef_${g.id}`, `🎧 En vocal : <count>`)
            if (!onlineformat) db.set(`onlinef_${g.id}`, `✅ En ligne: <count>`)
            if (!boostformat) db.set(`boostf_${g.id}`, `⭐ Boosts : <count>`)
        } catch (err) { }
    })
})

bot.on('guildCreate', async g => {
    if (!g) return
    try {
        let membersformat = db.fetch(`memberf_${g.id}`)
        let voiceformat = db.fetch(`voicef_${g.id}`)
        let onlineformat = db.fetch(`onlinef_${g.id}`)
        let boostformat = db.fetch(`boostf_${g.id}`)
        if (!membersformat) db.set(`memberf_${g.id}`, `👥 Membres : <count>`)
        if (!voiceformat) db.set(`voicef_${g.id}`, `🎧 En vocal : <count>`)
        if (!onlineformat) db.set(`onlinef_${g.id}`, `✅ En ligne: <count>`)
        if (!boostformat) db.set(`boostf_${g.id}`, `⭐ Boosts : <count>`)
    } catch (err) { }
})

bot.on('ready', async () => {
    bot.guilds.cache.forEach(async g => {
        let mytime = Math.random() * 30000
        console.log(g.name + " Actualisation des compteurs dans : " + mytime)
        setTimeout(() => {
            let membersformat = db.fetch(`memberf_${g.id}`)
            let voiceformat = db.fetch(`voicef_${g.id}`)
            let onlineformat = db.fetch(`onlinef_${g.id}`)
            let boostformat = db.fetch(`boostf_${g.id}`)
            let membersc = db.fetch(`memberc_${g.id}`)
            let voicec = db.fetch(`voicec_${g.id}`)
            let onlinec = db.fetch(`onlinec_${g.id}`)
            let boostc = db.fetch(`boostc_${g.id}`)
            membersc = g.channels.cache.get(membersc)
            if (membersc) membersc.setName(membersformat.replace('<count>', g.memberCount)).catch(e => { console.log("Erreur compteur membre total : " + e) })
            voicec = g.channels.cache.get(voicec)
            if (voicec) voicec.setName(voiceformat.replace('<count>', g.members.cache.filter(m => m.voice.channel).size)).catch(e => { console.log("Erreur compteur membre en vocal : " + e) })
            onlinec = g.channels.cache.get(onlinec)
            if (onlinec) onlinec.setName(onlineformat.replace('<count>', g.members.cache.filter(({ presence }) => presence.status !== 'offline').size)).catch(e => { console.log("Erreur compteur membre en ligne : " + e) })
            boostc = g.channels.cache.get(boostc)
            if (boostc) boostc.setName(boostformat.replace('<count>', g.premiumSubscriptionCount)).catch(e => { console.log("Erreur compteur boost : " + e) })
            setInterval(async() => {
                membersformat = await db.fetch(`memberf_${g.id}`)
                voiceformat = await db.fetch(`voicef_${g.id}`)
                onlineformat = await db.fetch(`onlinef_${g.id}`)
                boostformat = await db.fetch(`boostf_${g.id}`)
                membersc = await db.fetch(`memberc_${g.id}`)
                voicec = await db.fetch(`voicec_${g.id}`)
                onlinec = await db.fetch(`onlinec_${g.id}`)
                boostc = await db.fetch(`boostc_${g.id}`)
                membersc = g.channels.cache.get(membersc)
                if (membersc) membersc.setName(membersformat.replace('<count>', g.memberCount)).catch(e => { console.log("Erreur compteur membre total : " + e) })

                setTimeout(() => {
                    voicec = g.channels.cache.get(voicec)
                    if (voicec) voicec.setName(voiceformat.replace('<count>', g.members.cache.filter(m => m.voice.channel).size)).catch(e => { console.log("Erreur compteur membre en vocal : " + e) })
                }, 4000);

                setTimeout(() => {
                    onlinec = g.channels.cache.get(onlinec)
                    if (onlinec) onlinec.setName(onlineformat.replace('<count>', g.members.cache.filter(({ presence }) => presence.status !== 'offline').size)).catch(e => { console.log("Erreur compteur membre en ligne : " + e) })
                }, 10000);

                setTimeout(() => {
                    boostc = g.channels.cache.get(boostc)
                    if (boostc) boostc.setName(boostformat.replace('<count>', g.premiumSubscriptionCount)).catch(e => { console.log("Erreur compteur boost : " + e) })
                }, 14000);

            }, Math.random() * 560000);
        }, mytime);
    })
})

const coins = require('./coins.json')

bot.on('ready', () => {
    bot.guilds.cache.map(g => {
        g.members.cache.map(m => {
            db.set(`game_${g.id}_${m.id}`, false)
        })
    })
})

async function insertUser(serverid, memberid) {
    var val = [[serverid, memberid]]
    //console.log(val)
    database3.query("SELECT * FROM coins WHERE userid = ? AND serverid = ?", [memberid, serverid], function (err, rows) {
        if (err) return console.log('Insert new user select error : ' + err)
        if (rows.length < 1) {
            database3.query("INSERT INTO coins (serverid, userid) VALUES ?", [val], async (error, result, fields) => {
                if (error) return console.log(error)
                //if (!result[0]) return console.log('Insert new user : Une erreur est survenue.')
            })
        }
    })
}

bot.on('ready', async () => {
    bot.guilds.cache.forEach(async g => {
        g.members.cache.forEach(async m => {
            database3.query("SELECT * FROM coins WHERE serverid = ? AND userid = ?", [g.id, m.id], async (error, result) => {
                if (error) return console.log(chalk.red("Une erreur est survenue lors de la vérification du tableau des coins. " + error))
                if (result.length < 1) {
                    insertUser(g.id, m.id)
                }
            })
        })
    })
})

bot.on('guildCreate', async g => {
    g.members.cache.forEach(async m => {
        database3.query("SELECT * FROM coins WHERE serverid = ? AND userid = ?", [g.id, m.id], async (error, result) => {
            if (error) return console.log(chalk.red("Une erreur est survenue lors de la vérification du tableau des coins. " + error))
            if (result.length < 1) {
                insertUser(g.id, m.id)
            }
        })
    })
})

bot.on('guildCreate', async g => {
    database3.query("SELECT * FROM shop WHERE serverid = ? AND item = ?", [g.id, 'printer'], async (error, result) => {
        if (error) return console.log(chalk.red("Erreur lors de la vérification du printer dans le shop. " + error))
        if (result.length < 1) {
            var val = [[g.id, 'printer', 'Aucune description', '500', '-', '1']]
            database3.query("INSERT INTO shop (serverid, item, descr, price, role, coin) VALUES ?", [val])
        }
    })
})

bot.on('ready', async () => {
    bot.guilds.cache.forEach(async g => {
        database3.query("SELECT * FROM shop WHERE serverid = ? AND item = ?", [g.id, 'printer'], async (error, result) => {
            if (error) return console.log(chalk.red("Erreur lors de la vérification du printer dans le shop. " + error))
            if (result.length < 1) {
                var val = [[g.id, 'printer', 'Aucune description', '500', '-', '1']]
                database3.query("INSERT INTO shop (serverid, item, descr, price, role, coin) VALUES ?", [val])
            }
        })
    })
})

/*var leaved = {};
var alreadyKnow = {};
var timeKnow = {};*/
async function saveCoins(conf) {
    fs.writeFile(`./coins.json`, JSON.stringify(conf), (x) => {
        if (x) console.error(x)
    });
}

bot.on("voiceStateUpdate", async (oldMember, newMember) => {
    vocalJoin(oldMember, newMember)
});

async function vocalJoin(oldMember, newMember) {
    let newUserChannel = newMember.channelID;
    let oldUserChannel = oldMember.channelID;
    let i = 1;

    if (newUserChannel != undefined) {
        //console.log(`EVENT: ${newMember.member.user.tag} JOINED ${newUserChannel}`)
        insertUser(newMember.guild.id, newMember.id);
        if (coins.alreadyKnow[newMember.id] == true) return;
        coins.leaved[newMember.id] = false;
        if (coins.joinvoc[newMember.id] != true) {
            coins.joinvoc[newMember.id] = true
        }
        saveCoins(coins)
        while (newUserChannel != undefined) {


            if (coins.leaved[newMember.id] == true) {
                coins.alreadyKnow[newMember.id] = false;
                saveCoins(coins)
                break;
            }
            coins.alreadyKnow[newMember.id] = true;
            // console.log('coins relancer')
            saveCoins(coins)
            await sleep(60000);
            if (!bot.users.cache.get(newMember.id).bot) {

                let msgauthor = newMember.id;
                database3.query("SELECT * FROM coins WHERE serverid = ? AND userid = ?", [newMember.guild.id, msgauthor], function (err, rows) {
                    if (err) console.log(err);
                    if (rows.length < 1) { insertUser(newMember.guild.id, msgauthor) } else {
                        let bonus = 6
                        if (!newMember.selfVideo) bonus = bonus - 3
                        if (!newMember.streaming) bonus = bonus - 2
                        // console.log(bonus)
                        let currentMoney = rows[0].usercoins;
                        let newMoney = 10 + bonus;
                        let finalCoins = parseFloat((currentMoney + newMoney));
                        //console.log(finalCoins)

                        database3.query("UPDATE coins SET usercoins = ? WHERE serverid = ? AND userid = ?", [newMember.guild.id, finalCoins, msgauthor])
                    }
                })
                // console.log(`${newMember.member.user.tag} - ${i++}mn`)
            }
        }
    } else {
        coins.timeKnow[newMember.id] = 0;
        coins.leaved[newMember.id] = true;
        coins.alreadyKnow[newMember.id] = false;
        //console.log('pas voc')
        saveCoins(coins)
        // console.log(`${newMember.member.user.tag} Leaved`)
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

bot.on('ready', async () => {
    bot.guilds.cache.map(async g => {
        g.members.cache.map(async m => {
            if (m.user.bot) return
            if (!m.voice.channel) {
                coins.leaved[m.id] = true
                coins.timeKnow[m.id] = 0;
                coins.leaved[m.id] = true;
                coins.alreadyKnow[m.id] = false;
                saveCoins(coins)
            } else {
                console.log(m.user.tag + ' en vocal')
                coins.alreadyKnow[m.id] = false
                vocalJoin(m.voice, m.voice)
            }
        })
    })
})

bot.on('message', async message => {
    if (!message) return
    if (message.author.bot) return
    if (!coins.msgcount[message.author.id]) return coins.msgcount[message.author.id] = 1
    ++coins.msgcount[message.author.id]
    if (coins.msgcount[message.author.id] == 5) {
        coins.msgcount[message.author.id] = 0
        await database3.query("SELECT * FROM coins WHERE serverid = ? AND userid = ?", [message.guild.id, message.author.id], async (error, result, fields) => {
            if (error) return console.log(error)
            if (!result[0]) return insertUser(message.guild.id, message.author.id)
            var currentcoin = result[0].usercoins + 5
            await database3.query("UPDATE coins SET usercoins = " + currentcoin + " WHERE serverid = " + message.guild.id + " AND userid = " + message.author.id, async (error, result, fields) => {
                if (error) return console.log(error)
            })
        })
    }
})

bot.on('ready', async () => {
    bot.guilds.cache.forEach(async g => {
        g.members.cache.forEach(async m => {
            addMoney(g, m)
        })
    })
})

bot.on('buyPrinter', async (server, member) => {
    addMoney(server, member)
})

async function addMoney(server, member) {
    if (!server) return
    if (!member) return
    setInterval(async () => {
        await database3.query("SELECT * FROM bitcoin WHERE serverid = ? AND userid = ?", [server.id, member.id], async (error, result, fields) => {
            if (error) return console.log(error)
            if (!result[0]) return
            var proc = result[0].processid
            var cg = result[0].cgid
            var volt = result[0].volt
            var money = result[0].money
            await database3.query("SELECT * FROM process WHERE process = ?", [proc], async (error, result, fields) => {
                if (error) return console.log(error)
                if (result < 1) return console.log('process table error')
                var powerpr = result[0].power
                if (!powerpr) return console.log('proc power table error')
                await database3.query("SELECT * FROM card WHERE cg = ?", [cg], async (error, result, fields) => {
                    if (error) return console.log('card table error')
                    if (result < 1) return console.log('card table error')
                    var powercg = result[0].power
                    if (!powercg) return console.log('card power table error')
                    let bonus = (powerpr + powercg) * volt
                    let newMoney = (Math.random() * ((1.348 - 0.580) + 0.580) / 2);
                    let finalCoins = parseInt(parseInt(money) + (1.5 * (parseInt(bonus) / 3)));
                    if (finalCoins == 0) finalCoins = money
                    if (isNaN(finalCoins)) finalCoins = money
                    var newVolt = volt - 1
                    if (newVolt < 0) newVolt = 0
                    if (finalCoins <= 0) finalCoins = 1
                    if (newVolt == 0) finalCoins = money
                    // console.log(finalCoins)
                    database3.query("UPDATE bitcoin SET money = ? , volt = ? WHERE serverid = ? AND userid = ?", [finalCoins, newVolt, server.id, member.id])
                })
            })
        })
    }, 120000)
}

bot.on("voiceChannelCameraStart", (member, voiceChannel) => {
    console.log(`[COINS] - ${member.user.tag} a on sa cam`)
})

bot.on("voiceChannelCameraStop", (member, voiceChannel) => {
    console.log(`[COINS] - ${member.user.tag} a off sa cam`)
})

bot.on("voiceChannelStreamStart", (member, voiceChannel) => {
    console.log(`[COINS] - ${member.user.tag} a fait un stream`)
});

bot.on("voiceChannelStreamStop", (member, voiceChannel) => {
    console.log(`[COINS] - ${member.user.tag} a off un stream`)
});


bot.on('guildMemberAdd', async (member) => {
    if (member.user.bot) return
    insertUser(member.guild.id, member.id)
})

bot.on("voiceStateUpdate", async (oldMember, newMember) => {
    vocalJoinTime(oldMember, newMember)
});

async function vocalJoinTime(oldMember, newMember) {
    let newUserChannel = newMember.channelID;
    let oldUserChannel = oldMember.channelID;
    let i = 1;

    if (newUserChannel != undefined) {
        db.set(`invoc_${newMember.guild.id}_${newMember.id}`, true)
        while (newUserChannel != undefined) {
            await sleep(20000);
            if (!bot.users.cache.get(newMember.id).bot && newUserChannel != undefined) {
				let hm = db.fetch(`invoc_${newMember.guild.id}_${newMember.id}`)
                if(!hm) return
                let msgauthor = newMember.id;
                let time = db.fetch(`voicetime_${newMember.guild.id}_${newMember.id}`)
                if (!time) db.set(`voicetime_${newMember.guild.id}_${newMember.id}`, 15000)
                else db.set(`voicetime_${newMember.guild.id}_${newMember.id}`, time + 15000)
                // console.log(`${newMember.member.user.tag} - ${i++}mn`)
            }
        }
    } else {
        db.set(`invoc_${newMember.guild.id}_${newMember.id}`, false)
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

bot.on('ready', async () => {
    bot.guilds.cache.map(async g => {
        g.members.cache.map(async m => {
            if (m.user.bot) return
            if (!m.voice.channel) return
            vocalJoinTime(m.voice, m.voice)
        })
    })
})