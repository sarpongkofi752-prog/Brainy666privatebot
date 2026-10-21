const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason, Browsers } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')

const ADMIN_NUMBERS = ['233594595912', '233249466393']
const BOT_NUMBER = '233249466393'

async function startBot() {
    // CLEAN BAD AUTH IF LOGGED OUT BEFORE
    try {
        if(fs.existsSync('./auth/creds.json')) {
            const creds = JSON.parse(fs.readFileSync('./auth/creds.json'))
            if(!creds.registered) {
                // Keep it, we need it for pairing
            }
        }
    } catch(e){}

    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    
    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({level:'silent'}))
        },
        browser: Browsers.macOS('Desktop'),
        logger: pino({level:'silent'}),
        syncFullHistory: false
    })

    if(!sock.authState.creds.registered) {
        console.log('⏳ NOT REGISTERED - Waiting 8 sec for 0249466393...');
        await new Promise(r => setTimeout(r, 8000))
        try {
            let code = await sock.requestPairingCode(BOT_NUMBER)
            code = code?.match(/.{1,4}/g)?.join('-') || code
            console.log(`\n🔥🔥🔥 CODE FOR 0249466393: ${code} 🔥🔥🔥\nLink now: WhatsApp > Linked Devices > Link with phone number > ${code}\n`);
        } catch(e) {
            console.log('❌ Pairing error:', e.message, ' - Retrying in 15s');
            setTimeout(startBot, 15000)
            return
        }
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode
            console.log(`Closed: ${code} - ${lastDisconnect?.error?.message}`)
            if(code === DisconnectReason.loggedOut || code === 401) {
                console.log('❌ LOGGED OUT - Deleting auth folder...')
                try { fs.rmSync('./auth', {recursive:true, force:true}) } catch(e){}
                console.log('Auth deleted, restarting for new code...')
                setTimeout(startBot, 3000)
            } else {
                setTimeout(startBot, 5000)
            }
        }
        if(connection === 'open') {
            console.log(`✅✅✅ 0249466393 CONNECTED - PRIVATE MODE LIVE ✅✅✅`)
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if(!m.message || m.key.fromMe) return
        const from = m.key.remoteJid
        const senderNum = from.split('@')[0]
        const text = (m.message.conversation || m.message.extendedTextMessage?.text || '')?.trim()

        if(!ADMIN_NUMBERS.some(n => senderNum.includes(n))) {
            console.log(`Blocked ${senderNum}: ${text}`)
            return
        }
        if(text === '.ping') await sock.sendMessage(from, {text:`🏓 PONG! 0249466393 Private Active 🔒`})
        if(text === '.alive') await sock.sendMessage(from, {text:`✅ Alive 0249466393`})
        if(text === '.menu') await sock.sendMessage(from, {text:`*PRIVATE BOT 0249466393*\n.ping\n.alive\n.menu`})
    })
}

startBot()
