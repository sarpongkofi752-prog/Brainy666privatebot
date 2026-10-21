const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason, Browsers } = require('@whiskeysockets/baileys')
const pino = require('pino')

const ADMIN_NUMBERS = ['233594595912', '233249466393']
const BOT_NUMBER = '233249466393'
const BOT_NAME = 'BRAINY666 PRIVATE'

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    
    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({level:'silent'}))
        },
        browser: Browsers.macOS('Chrome'),
        logger: pino({level:'silent'}),
        markOnlineOnConnect: true
    })

    // Request pairing code ONLY if not registered
    if(!sock.authState.creds.registered) {
        console.log('⏳ NOT REGISTERED - Waiting 5 seconds to request pairing code for 0249466393...')
        setTimeout(async () => {
            try {
                console.log('📲 Requesting pairing code now...')
                let code = await sock.requestPairingCode(BOT_NUMBER)
                code = code?.match(/.{1,4}/g)?.join('-') || code
                console.log(`\n============================\n🔥 PAIRING CODE FOR 0249466393: ${code}\n============================\nOn 0249466393 phone:\nWhatsApp > Settings > Linked Devices > Link a device > Link with phone number\nEnter: ${code}\n============================\n`)
            } catch(e) {
                console.log('❌ Pairing failed:', e.message)
                console.log('Retrying in 10 seconds...')
                setTimeout(() => startBot(), 10000)
            }
        }, 5000)
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            console.log('Connection closed, reason:', reason, lastDisconnect?.error?.message)
            if(reason !== DisconnectReason.loggedOut) {
                console.log('Reconnecting...')
                setTimeout(startBot, 3000)
            } else {
                console.log('Logged out - delete auth folder manually')
            }
        }
        if(connection === 'open') {
            console.log(`✅✅✅ ${BOT_NAME} CONNECTED SUCCESS - 0249466393 LIVE PRIVATE MODE 🔒✅✅✅`)
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if(!m.message || m.key.fromMe) return
        const from = m.key.remoteJid
        const senderNum = from.split('@')[0]
        const text = (m.message.conversation || m.message.extendedTextMessage?.text || '').trim()

        // PRIVATE MODE
        const isAdmin = ADMIN_NUMBERS.some(n => senderNum.includes(n) || from.includes(n) || text.includes(n))
        // For testing, allow all first then restrict - comment next 4 lines if you want test
        const checkAdmin = ADMIN_NUMBERS.some(n => senderNum.includes(n))
        if(!checkAdmin) {
            console.log(`Blocked non-admin ${senderNum}: ${text}`)
            return
        }

        if(text.toLowerCase() === '.ping') {
            await sock.sendMessage(from, { text: `🏓 PONG! ${BOT_NAME}\n📱 0249466393 Private\n🔒 Only Admin can use\n👑 You be boss!` })
        }
        if(text.toLowerCase() === '.alive') {
            await sock.sendMessage(from, { text: `✅ ${BOT_NAME} ALIVE\n📱 0249466393\n🔒 Private Mode ON` })
        }
        if(text.toLowerCase() === '.menu') {
            await sock.sendMessage(from, { text: `*${BOT_NAME}*\n.ping\n.alive\n.menu\n\n🔒 Private for 0249466393` })
        }
        console.log(`[PRIVATE] ${senderNum}: ${text}`)
    })
}

startBot()
