const express = require('express');
const app = express();
app.get('/', (req,res)=> res.send('BRAINY666 PRIVATE 0249466393 LIVE'));
app.listen(process.env.PORT || 10000, ()=> console.log('✅ PORT OPEN'));

const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason, Browsers } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')

const BOT_NUMBER = '233249466393'

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:'silent'})) },
        browser: Browsers.macOS('Chrome'),
        logger: pino({level:'silent'})
    })

    if(!sock.authState.creds.registered) {
        console.log('⏳ Waiting 8 sec...');
        await new Promise(r => setTimeout(r, 8000))
        try {
            let code = await sock.requestPairingCode(BOT_NUMBER)
            code = code?.match(/.{1,4}/g)?.join('-') || code
            console.log(`\n🔥🔥🔥 CODE FOR 0249466393: ${code} 🔥🔥🔥\nTYPE IT NOW IN 20 SECONDS!\n`);
            console.log(`CODE: ${code}`);
        } catch(e) {
            console.log('Fail:', e.message)
            setTimeout(startBot, 15000)
            return
        }
    }

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async (u) => {
        if(u.connection === 'close') {
            const r = u.lastDisconnect?.error?.output?.statusCode
            console.log('Closed', r)
            if(r === 401) { try{fs.rmSync('./auth',{recursive:true,force:true})}catch(e){} }
            setTimeout(startBot, 5000)
        }
        if(u.connection === 'open') console.log('✅✅✅ 0249466393 CONNECTED ✅✅✅')
    })

    sock.ev.on('messages.upsert', async ({messages}) => {
        const m = messages[0]
        if(!m.message || m.key.fromMe) return
        const text = (m.message.conversation || m.message.extendedTextMessage?.text || '').trim()
        if(text === '.ping') await sock.sendMessage(m.key.remoteJid, {text:'🏓 PONG! 0249466393 LIVE 🔒'})
    })
}
startBot()
