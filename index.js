const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')

// 🔒 YOUR PRIVATE NUMBERS - ONLY YOU + ADMINS
const OWNER_NUMBERS = ['233249466393'] // 0249466393 - YOU ONLY OWNER
const BOT_NUMBER = '233594595912' // 0594595912

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
            if (shouldReconnect) startBot()
        } else if (connection === 'open') {
            console.log('✅ BRAINY666 GROUP PRIVATE CONNECTED!')
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

        // 🔒🔒🔒 PRIVATE CHECK - GROUP ADMIN ONLY 🔒🔒🔒
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
                // BLOCK IF NOT ADMIN AND NOT OWNER
                if (!isAdmin && !isOwner) {
                    console.log(`🚫 BLOCKED non-admin: ${senderNum} in ${remoteJid}`)
                    return
                }
                console.log(`✅ ALLOWED Admin/Owner: ${senderNum}`)
            } catch (e) {
                console.log('Group metadata error:', e)
                if (!isOwner) return
            }
        } else {
            // PRIVATE CHAT - ONLY OWNER
            if (!isOwner) {
                console.log(`🚫 BLOCKED private non-owner: ${senderNum}`)
                return
            }
        }

        // ✅ COMMANDS - ONLY ADMINS REACH HERE
        const cmd = msgBody.toLowerCase().trim()

        if (cmd === '.ping' || cmd.startsWith('.ping')) {
            await sock.sendMessage(remoteJid, { text: `*PONG!* ⚡\n\n✅ Brainy666 Group Private Active\n👑 Admin Only Mode\n📍 Group: ${isGroup ? 'Yes' : 'No'}\n👤 You: ${isAdmin ? 'Admin ✅' : isOwner ? 'Owner 👑' : 'User'}` }, { quoted: m })
        }

        if (cmd === '.menu' || cmd.startsWith('.menu')) {
            await sock.sendMessage(remoteJid, { 
                text: `*BRAINY666 GROUP PRIVATE BOT* 🔒

*OWNER:* 0249466393 (You)
*BOT:* 0594595912

*🔒 MODE:* Group Admin Only!

*COMMANDS:*
.ping - Check bot
.menu - This menu
.kick @user - Kick (Admin)
.mute - Mute group
.unmute - Unmute
.promote @user - Make admin
.demote @user - Remove admin
.tagall - Tag all members
.hidetag - Hide tag

*✅ Only Group Admins can use me!*
Non-admins are blocked!`
            }, { quoted: m })
        }

        if (cmd.startsWith('.kick')) {
            if (!isGroup) return
            const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid
            if (mentioned) {
                await sock.groupParticipantsUpdate(remoteJid, mentioned, "remove")
                await sock.sendMessage(remoteJid, { text: `✅ Kicked by Admin` }, { quoted: m })
            }
        }
    })
}

startBot()
