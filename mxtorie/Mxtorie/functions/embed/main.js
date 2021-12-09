const ping = require("./func/pingEmbed")
const permissionMissing = require("./func/permissionMissing")
const logs = require('./func/logs')
const perm = require('./func/perm')
const helpargs = require('./func/helpargs')
const permassigned = require('./func/permassigned')
const permunassigned = require('./func/permunassigned')
const commandassigned = require('./func/commandassigned')
const commandunassigned = require('./func/commandunassigned')
const commandremove = require('./func/commandremove')
const whitelist = require('./func/whitelist')
const whitelisted = require('./func/whitelisted')
const unwhitelisted = require('./func/unwhitelisted')
const warn = require('./func/warnreport')
const simple = require('./func/simple')
const functiondisable = require('./func/functiondisable')
module.exports = {
    ping,
    permissionMissing,
    logs,
    perm,
    helpargs,
    permassigned,
    permunassigned,
    commandassigned,
    commandunassigned,
    commandremove,
    whitelist,
    whitelisted,
    unwhitelisted,
    warn,
    simple,
    functiondisable
}