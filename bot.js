require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// --- CONFIG & SETUP ---
process.env.NTBA_FIX_350 = 1;
process.noDeprecation = true;

const TOKEN = process.env.TELEGRAM_TOKEN; 
const DEBUG_LOG = process.env.DEBUG_LOG === 'true';
const BOT_USERNAME = process.env.BOT_USERNAME || '@UniGifConverterBot'; 

const TEMP_DIR = './temp';
const SOURCE_LINK = 'https://github.com/pynvox/';

if (!TOKEN) {
    console.error("ERROR: TELEGRAM_TOKEN missing in .env file!");
    process.exit(1);
}

if (!process.env.BOT_USERNAME) {
    console.warn("WARNING: BOT_USERNAME not found in .env, using default.");
}

const bot = new TelegramBot(TOKEN, { polling: true });

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// Custom logger
const log = (msg) => { if (DEBUG_LOG) console.log(`[LOG] ${msg}`); };

// --- AUTOMATIC CLEANUP (Garbage Collector) ---
setInterval(() => {
    fs.readdir(TEMP_DIR, (err, files) => {
        if (err) return;
        files.forEach(file => {
            const filePath = path.join(TEMP_DIR, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                const now = Date.now();
                const fileAge = (now - stats.mtimeMs) / 1000 / 60;
                if (fileAge > 15) {
                    fs.unlink(filePath, () => {}); // Silent delete
                }
            });
        });
    });
}, 10 * 60 * 1000);

// --- START COMMAND ---
bot.onText(/\/start/, (msg) => {
    const message = `
<b>👋 Welcome to UniGif!</b>

I can convert your media into lightweight Telegram GIFs.

<b>✨ Features:</b>
▪️ <b>Photos</b> → GIFs (Animated)
▪️ <b>Videos</b> → GIFs (Max 12s)
▪️ <b>Links</b> → Discord, Tenor, Giphy supported

<i>Just send me a file or a link to start!</i>

🔗 <a href="${SOURCE_LINK}">Open Source Project</a>
    `;
    
    bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML', disable_web_page_preview: true });
});

// --- CORE FUNCTIONS ---

async function downloadFile(url, filepath) {
    const writer = fs.createWriteStream(filepath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://discord.com/' 
        }
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

//FFmpeg Function
const convertToTelegramGif = (inputPath, outputPath, isStaticImage = false) => {
    return new Promise((resolve, reject) => {
        let command = ffmpeg(inputPath);

        if (isStaticImage) {
            command.inputOptions(['-f image2', '-loop 1']);
            command.outputOptions(['-t 3']);
        } else {
            command.outputOptions(['-t 12']); //12 sec video
        }

        command
            .outputOption('-c:v', 'libx264')
            .outputOption('-an')
            .outputOption('-preset', 'ultrafast')
            .outputOption('-pix_fmt', 'yuv420p')
            .outputOption('-movflags', '+faststart')
            .outputOption('-vf', "scale='if(lt(iw,640),640,iw)':-2:flags=lanczos")
            .outputOption('-crf', '20')
            .toFormat('mp4')
            .on('start', (cmd) => log(`FFmpeg Command: ${cmd}`))
            .on('end', () => resolve(outputPath))
            .on('error', (err) => {
                console.error('FFmpeg Error:', err);
                reject(err);
            })
            .save(outputPath);
    });
};

const safeDelete = (files) => {
    setTimeout(() => {
        files.forEach(file => {
            if (fs.existsSync(file)) fs.unlink(file, () => {});
        });
    }, 2000); 
};

// --- EVENT HANDLERS ---

// 1. Photos
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const procMsg = await bot.sendMessage(chatId, "🎨 Processing...");

    try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);
        const inputPath = `${TEMP_DIR}/p_${fileId}.jpg`;
        const outputPath = `${TEMP_DIR}/out_${fileId}.mp4`;

        await downloadFile(fileLink, inputPath);
        await convertToTelegramGif(inputPath, outputPath, true);

        await bot.sendAnimation(chatId, fs.createReadStream(outputPath), { caption: `Via ${BOT_USERNAME}` });
        
        bot.deleteMessage(chatId, procMsg.message_id);
        safeDelete([inputPath, outputPath]);
    } catch (error) {
        bot.editMessageText("❌ Error processing image.", { chat_id: chatId, message_id: procMsg.message_id });
    }
});

// 2. Videos
bot.on('video', async (msg) => {
    const chatId = msg.chat.id;
    const procMsg = await bot.sendMessage(chatId, "⚡️ Converting...");

    try {
        const fileId = msg.video.file_id;
        const fileLink = await bot.getFileLink(fileId);
        const inputPath = `${TEMP_DIR}/v_${fileId}.mp4`;
        const outputPath = `${TEMP_DIR}/out_${fileId}.mp4`;

        await downloadFile(fileLink, inputPath);
        await convertToTelegramGif(inputPath, outputPath, false);

        await bot.sendAnimation(chatId, fs.createReadStream(outputPath), { caption: `Via ${BOT_USERNAME}` });
        
        bot.deleteMessage(chatId, procMsg.message_id);
        safeDelete([inputPath, outputPath]);
    } catch (error) {
        bot.editMessageText("❌ Error processing video.", { chat_id: chatId, message_id: procMsg.message_id });
    }
});

// 3. Links (Discord, Tenor, Giphy)
bot.on('message', async (msg) => {
    if (!msg.text || !msg.text.startsWith('http')) return;
    
    const chatId = msg.chat.id;
    const url = msg.text;
    log(`Received URL: ${url}`);

    const procMsg = await bot.sendMessage(chatId, "🔗 Analyzing link...");

    try {
        let targetUrl = '';

        // regex for gif, mp4, webm, png, jpg, jpeg
        if (url.match(/\.(gif|mp4|webm|webp|png|jpg|jpeg)(\?.*)?$/i)) {
            targetUrl = url;
        } else {
            // Scrape metadata
            try {
                const { data } = await axios.get(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124' }
                });
                const $ = cheerio.load(data);
                
                targetUrl = $('meta[property="og:video"]').attr('content') || 
                            $('meta[property="og:image"]').attr('content');
                            
                if (!targetUrl) {
                    $('meta').each((i, el) => {
                        const content = $(el).attr('content');
                        if (content && content.includes('.gif')) targetUrl = content;
                    });
                }
            } catch (err) {
                targetUrl = url;
            }
        }

        if (!targetUrl) throw new Error("No media found");

        if (targetUrl.includes('format=webp')) targetUrl = targetUrl.replace('format=webp', 'format=gif');

        // Clean query params to get extension
        let ext = path.extname(targetUrl.split('?')[0]) || '.gif';
        
        // Fallback
        if (!ext) ext = '.gif';

        const id = Date.now();
        // Add _raw to avoid input/output conflict
        const inputPath = `${TEMP_DIR}/link_${id}_raw${ext}`;
        const outputPath = `${TEMP_DIR}/link_${id}.mp4`;

        log(`Downloading: ${targetUrl}`);
        await downloadFile(targetUrl, inputPath);

        const stats = fs.statSync(inputPath);
        if (stats.size < 100) throw new Error("Empty file");

        // Check if it needs looping (Static images)
        const isImage = ['.jpg', '.png', '.jpeg', '.webp'].some(x => ext.toLowerCase().includes(x));
        
        await convertToTelegramGif(inputPath, outputPath, isImage);

        await bot.sendAnimation(chatId, fs.createReadStream(outputPath), { caption: `Via ${BOT_USERNAME}` });

        bot.deleteMessage(chatId, procMsg.message_id);
        
        try {
            bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        } catch (e) {}
        
        safeDelete([inputPath, outputPath]);

    } catch (error) {
        log(`Error: ${error.message}`);
        // Only edit if message still exists
        bot.editMessageText(`⚠️ Could not process link.`, { chat_id: chatId, message_id: procMsg.message_id }).catch(() => {});
    }
});

if (DEBUG_LOG) console.log("Bot started in debug mode.");