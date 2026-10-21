const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const pino = require('pino')
const express = require('express')

// 🌐 FIX RENDER PORT ERROR
const app = express()
const PORT = process.env.PORT || 10000
app.get('/', (req, res) => {
    res.send('<h1>✅ BRAINY666 GROUP PRIVATE BOT ALIVE</h1><p>🔒 Mode: Group Admin Only</p><p>👑 Owner: 0249466393</p><p>🤖 Bot: 0594595912</p>')
})
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`))

// 🔒 YOUR PRIVATE NUMBERS
const OWNER_NUMBERS = ['233249466393'] // 0249466393 - YOU
const BOT_NUMBER = '233594595912' // 059

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    
    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        logger: pino({ level: "fatal" }),
        browser: ["Brainy666 Group Private", "Chrome", "1.0"],
        markOnlineOnConnect: true
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) {
                console.log('Reconnecting...')
                startBot()
            }
        } else if (connection === 'open') {
            console.log('✅✅✅ BRAINY666 GROUP PRIVATE CONNECTED! ADMIN ONLY MODE ACTIVE! 🔒')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return

        const remoteJid = m.key.remoteJid
        const isGroup = remoteJid.endsWith('@g.us')
        const senderId = isGroup ? m.key.participant : remoteJid
        const senderNum = senderId ? senderId.replace(/[^0-9]/g, '') : ''
        const msgBody = m.message.conversation || m.message.extendedTextMessage?.text || ""

        if (!msgBody.startsWith('.')) return

        // 🔒🔒🔒 GROUP ADMIN ONLY CHECK 🔒🔒🔒
        let isOwner = OWNER_NUMBERS.some(n => senderNum.includes(n) || n.includes(senderNum))
        let isAdmin = false

        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(remoteJid)
                const participants = groupMetadata.participants
                const senderParticipant = participants.find(p => p.id === senderId)
                if (senderParticipant) {
                    isAdmin = senderParticipant.admin === 'admin' || senderParticipant.admin === 'superadmin'
                }
                // 🚫 BLOCK NON-ADMINS
                if (!isAdmin && !isOwner) {
                    console.log(`🚫 BLOCKED non-admin: ${senderNum}`)
                    return
                }
                console.log(`✅ ALLOWED: ${senderNum} Admin:${isAdmin} Owner:${isOwner}`)
            } catch (e) {
                console.log('Group check error:', e.message)
                if (!isOwner) return
            }
        } else {
            // PRIVATE CHAT - ONLY OWNER
            if (!isOwner) {
                console.log(`🚫 BLOCKED private non-owner: ${senderNum}`)
                return
            }
        }

        const cmd = msgBody.toLowerCase().trim()

        if (cmd === '.ping') {
            await sock.sendMessage(remoteJid, { text: `*PONG!* ⚡\n\n✅ *BRAINY666 GROUP PRIVATE*\n🔒 Mode: Admin Only\n👤 You: ${isOwner ? 'Owner 👑' : isAdmin ? 'Admin ✅' : 'Member'}\n📍 Group: ${isGroup ? 'Yes' : 'No'}` }, { quoted: m })
        }

        if (cmd === '.menu') {
            await sock.sendMessage(remoteJid, { 
                text: `*🔒 BRAINY666 GROUP PRIVATE BOT*

*OWNER:* 0249466393
*BOT:* 0594595912
*MODE:* Admin Only 🔒

*COMMANDS (Admin Only):*
.ping - Check bot
.menu - This menu
.kick @user - Kick member
.mute - Close group
.unmute - Open group
.promote @user - Make admin
.demote @user - Remove admin
.tagall - Tag all
.hidetag - Hide tag all
.leave - Bot leave

*🚫 Non-admins blocked!*
*✅ Only Admins can use commands!*`
            }, { quoted: m })
        }

        // KICK COMMAND
        if (cmd.startsWith('.kick') && isGroup) {
            const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid
            if (mentioned && mentioned.length > 0) {
                await sock.groupParticipantsUpdate(remoteJid, mentioned, "remove")
                await sock.sendMessage(remoteJid, { text: `✅ Kicked by Admin` })
            }
        }
    })
}

startBot()
