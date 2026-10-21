const express = require('express');
const app = express();
app.get('/', (req,res)=> res.send('BRAINY666 PRIVATE BOT 0249466393 LIVE 🔒'));
app.listen(process.env.PORT || 10000, ()=> console.log('✅ PORT OPEN - Web server live'));

const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason, Browsers } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')

const BOT_NUMBER = '233249466393'
const ADMIN_NUMBERS = ['233594595912', '233249466393']

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:'silent'})) },
        browser: Browsers.macOS('Chrome'),
        logger: pino({level:'silent'}),
        syncFullHistory: false
    })

    if(!sock.authState.creds.registered) {
        console.log('⏳ Waiting 5 sec to request code for 0249466393...');
        await new Promise(r => setTimeout(r, 5000))
        try {
            let code = await sock.requestPairingCode(BOT_NUMBER)
            code = code?.match(/.{1,4}/g)?.join('-') || code
            console.log(`\n🔥🔥🔥 NEW CODE FOR 0249466393: ${code} 🔥🔥🔥\nLink: WhatsApp > Linked Devices > Link with phone number > ${code}\n`);
        } catch(e) {
            console.log('❌ Pairing fail:', e.message)
            setTimeout(startBot, 10000)
            return
        }
    }

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            console.log('Closed:', reason)
            if(reason === 401 || reason === DisconnectReason.loggedOut) {
                try { fs.rmSync('./auth', {recursive:true, force:true}) } catch(e){}
                console.log('Auth cleared, restarting...')
            }
            setTimeout(startBot, 5000)
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
        if(!ADMIN_NUMBERS.some(n => senderNum.includes(n))) return
        if(text === '.ping') await sock.sendMessage(from, {text:`🏓 PONG! 0249466393 Private Active 🔒`})
        if(text === '.alive') await sock.sendMessage(from, {text:`✅ Alive`})
        if(text === '.menu') await sock.sendMessage(from, {text:`*PRIVATE BOT*\n.ping\n.alive\n.menu`})
    })
}
startBot()
