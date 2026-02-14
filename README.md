# UniGif Converter Bot Telegram 🤖

My Bot https://t.me/UniGifConverterBot

> A powerful Node.js Telegram bot that universally converts media files and links into optimized Telegram GIFs.

![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-blue?style=flat&logo=telegram)
![NodeJS](https://img.shields.io/badge/Node.js-v24-green?style=flat&logo=node.js)
![FFmpeg](https://img.shields.io/badge/Dependency-FFmpeg-orange?style=flat&logo=ffmpeg)

## 📖 Overview

**UniGif Converter Bot** is designed to make sharing GIFs on Telegram easier. It takes various inputs—photos, short videos, static stickers, or media links from platforms like Discord, Tenor, and Giphy—and converts them into lightweight, muted MP4s that Telegram recognizes as GIFs.

It handles the heavy lifting using FFmpeg, ensuring files are correctly formatted, resized, and trimmed for the best Telegram experience.

## ✨ Features

* **📷 Photos & Stickers to GIF:** Converts static images (JPG, PNG, WebP) into a 3-second looped GIF.
* **🎥 Video to GIF:** Converts videos into GIFs. Automatically trims long videos to a maximum of 12 seconds.
* **🔗 Universal Link Support:**
    * Direct media links (Discord stickers/images, generic URLs).
    * Full support for **Tenor** and **Giphy** links.
* **⚡ Optimized Output:** Generates fast-loading, muted MP4s (`yuv420p`, h264) specifically tuned for Telegram.
* **🧹 Auto-Cleanup:** Includes a built-in garbage collector to automatically delete temporary files and save disk space.

## 🛠️ Prerequisites

The bot requires **Node.js** and **FFmpeg**. Choose the fastest method for your OS:

### **Windows (Fast way via Chocolatey)**
Run your terminal as **Administrator** and type:
```bash
# Install FFmpeg and Node.js automatically
choco install ffmpeg nodejs -y

```

### **Linux (Ubuntu/Debian via NodeSource)**

Run these commands to install **Node.js 24** and **FFmpeg**:

```bash
# Update and install tools
sudo apt update
sudo apt install -y ca-certificates curl gnupg ffmpeg

# Setup NodeSource for Node.js 24
curl -fsSL [https://deb.nodesource.com/setup_24.x](https://deb.nodesource.com/setup_24.x) | sudo -E bash -
sudo apt install -y nodejs

```

### **macOS (via Homebrew)**

```bash
brew install node ffmpeg

```

---

## 🚀 Installation and Setup

1. **Clone the repository:**
```bash
git clone https://github.com/Pynvox/Universal-Gif-Converter-Bot-Telegram.git
cd Universal-Gif-Converter-Bot-Telegram

```


2. **Install dependencies:**
```bash
npm install

```


3. **Configuration:**
Create a file named `.env` in the root folder (it will be ignored by git thanks to the included `.gitignore`). Add your actual Telegram bot token obtained from [@BotFather](https://t.me/BotFather):
```text
TELEGRAM_TOKEN=your_token_here
DEBUG_LOG=false
BOT_USERNAME=@UniGifConverterBot # Username Bot Credits

```


4. **Run the bot:**
```bash
node bot.js

```

---

## 🎮 Usage

Once the bot is running, simply open a chat with it on Telegram and send:

* **Photos/Stickers:** Just send any image or Discord link to get a looped GIF.
* **Videos:** Send a video file (it will be trimmed to 12s and muted).
* **Links:** Paste a link from Tenor, Giphy, or Discord.

The bot will process the media and reply with the converted GIF "Via @UniGifConverterBot".

## 🏗️ Built With

* [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) - Telegram Bot API framework.
* [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) - A fluent API for FFmpeg.
* [axios](https://github.com/axios/axios) - HTTP client for downloads.
* [dotenv](https://github.com/motdotla/dotenv) - Environment variables management.
* [cheerio](https://github.com/cheeriojs/cheerio) - Metadata scraping.

## 📄 License

This project is open-source and available under the [MIT License](https://www.google.com/search?q=LICENSE).
