const express = require('express');
const app = express();
app.get('/', (req,res)=> res.send('BRAINY666 PRIVATE BOT 0594595912 LIVE'));
app.listen(process.env.PORT || 10000, ()=> console.log('✅ PORT OPEN'));

const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason, Browsers } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')

const BOT_NUMBER = '233594595912' // 0594595912 BOT
const ADMIN_NUMBERS = ['233249466393'] // 0249466393 ADMIN / BOSS

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    const sock = makeWASocket({
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:'silent'})) },
        browser: Browsers.macOS('Chrome'),
        logger: pino({level:'silent'})
    })

    if(!sock.authState.creds.registered) {
        console.log('⏳ Waiting 8 sec to request code for 0594595912...');
        await new Promise(r => setTimeout(r, 8000))
        try {
            let code = await sock.requestPairingCode(BOT_NUMBER)
            code = code?.match(/.{1,4}/g)?.join('-') || code
            console.log(`\n🔥🔥🔥 CODE FOR 0594595912 (BOT): ${code} 🔥🔥🔥\nAdmin 0249466393 will control am\n`);
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
            console.log('Closed', r, u.lastDisconnect?.error?.message)
            if(r === 401) { try{fs.rmSync('./auth',{recursive:true,force:true})}catch(e){} }
            setTimeout(startBot, 5000)
        }
        if(u.connection === 'open') console.log('✅✅✅ 0594595912 BOT CONNECTED - Admin 0249466393 IS BOSS ✅✅✅')
    })

    sock.ev.on('messages.upsert', async ({messages}) => {
        const m = messages[0]
        if(!m.message || m.key.fromMe) return
        const from = m.key.remoteJid
        const senderNum = from.split('@')[0]
        const text = (m.message.conversation || m.message.extendedTextMessage?.text || '')?.trim()
        console.log(`Msg from ${senderNum}: ${text}`)

        // PRIVATE - ONLY 0249466393 CAN USE
        if(!ADMIN_NUMBERS.some(n => senderNum.includes(n))) {
            console.log(`Blocked non-admin ${senderNum}`)
            return
        }

        if(text === '.ping') await sock.sendMessage(from, {text:'🏓 PONG!\nBot: 0594595912\nBoss: 0249466393 (You)\n🔒 Private Mode ON'})
        if(text === '.alive') await sock.sendMessage(from, {text:'✅ BOT 0594595912 ALIVE\n👑 Controlled by 0249466393'})
        if(text === '.menu') await sock.sendMessage(from, {text:'*BRAINY666 PRIVATE*\nBot: 0594595912\nBoss: 0249466393\n\nCommands:\n.ping\n.alive\n.menu'})
    })
}
startBot()
