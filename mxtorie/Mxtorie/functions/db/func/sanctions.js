function Number(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = async(client, message, member, type, reason, author, database) => {
    try {
        var myid = Number(1, 100000)
        var ladate = new Date()
        let values = [
            [message.guild.id, member.id ? member.id : member, type, `${ladate.getDate() + "/" + (ladate.getMonth() + 1) + "/" + ladate.getFullYear() + "  " + ladate.getHours() + ":" + ladate.getMinutes() + ":" + ladate.getSeconds()}`, reason, author.id, myid]
        ]
        await database.query("INSERT INTO sanctions (serverid, userid, type, date, reason, author, id) VALUES ?", [values])
    } catch (err) { console.log(err) }
}