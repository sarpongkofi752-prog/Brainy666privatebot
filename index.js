const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')

// === CONFIG - CHANGE THIS ===
const ADMIN_NUMBERS = ['233594595912'] // Your number only! No + , just country code + number
const PRIVATE_MODE = true // true = only admin can use
const BOT_NAME = 'BRAINY666 PRIVATE'
// ============================

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    
    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({level:'silent'}))
        },
        browser: Browsers.macOS('Chrome'),
        logger: pino({level:'silent'}),
        printQRInTerminal: false
    })

    // Pairing code link - if no auth file
    if(!sock.authState.creds.registered) {
        const phoneNumber = ADMIN_NUMBERS[0] // Your private bot number
        console.log(`Requesting pairing code for ${phoneNumber}...`)
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber)
                console.log(`\n🔥 PAIRING CODE: ${code}\nGo to WhatsApp > Linked Devices > Link with phone number > Enter code\n`)
            } catch(e){ console.log('Error:', e) }
        }, 3000)
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log(`✅ ${BOT_NAME} CONNECTED - PRIVATE MODE ON 🔒`)
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if(!m.message || m.key.fromMe) return
        
        const from = m.key.remoteJid
        const senderNum = from.split('@')[0]
        const isGroup = from.endsWith('@g.us')
        const text = m.message.conversation || m.message.extendedTextMessage?.text || ''

        // === PRIVATE MODE CHECK ===
        if(PRIVATE_MODE) {
            const isAdmin = ADMIN_NUMBERS.some(num => senderNum.includes(num) || from.includes(num))
            if(!isAdmin) {
                console.log(`❌ Blocked non-admin: ${senderNum} said: ${text}`)
                return // Ignore non-admins
            }
        }

        // === YOUR COMMANDS (only admin can reach here) ===
        if(text.toLowerCase() === '.ping') {
            await sock.sendMessage(from, { text: `🏓 Pong! ${BOT_NAME} Private Mode Active 🔒\nOnly you fit use me boss!` })
        }
        
        if(text.toLowerCase() === '.menu') {
            await sock.sendMessage(from, { text: `*${BOT_NAME} - PRIVATE BOT*\n\n.menu - Show this\n.ping - Test bot\n.alive - Bot alive?\n\n🔒 Only admin: ${ADMIN_NUMBERS.join(', ')}` })
        }

        console.log(`[PRIVATE] ${senderNum}: ${text}`)
    })
}

startBot()
