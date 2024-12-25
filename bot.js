import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';  // Use import instead of require
import dotenv from 'dotenv';  // Use import for dotenv
import http from 'http';  // Node.js HTTP module

dotenv.config();  // Load environment variables

// Load Telegram Bot token and user ID from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const adminUserId = process.env.YOUR_USER_ID;  // Admin user ID from .env

const bot = new TelegramBot(token, { polling: true });

// Exit Exam Date
const examDate = new Date("2025-02-03T08:30:00Z");

// Function to calculate the remaining time
function getRemainingTime() {
    const now = new Date();
    const timeDiff = examDate - now;

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
}

// Function to send reminder message
function sendReminderMessage(chatId) {
    const { days, hours, minutes } = getRemainingTime();
    let message = `⏰ *Reminder!* 📝\n\n`;

    if (days > 0) {
        message += `Your Exit Exam is in *${days} days*, *${hours} hours*, and *${minutes} minutes*! 📚📖`;
    } else if (days === 0 && hours > 0) {
        message += `Your Exit Exam is today! Only *${hours} hours* and *${minutes} minutes* left! Time to study hard! 🔥📚`;
    } else if (days === 0 && hours === 0 && minutes > 0) {
        message += `Your Exit Exam is in *${minutes} minutes*! 💥 It's almost time, good luck! 🍀`;
    } else {
        message += `The Exit Exam has already passed. Good job for completing it! 🎓`;
    }

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

// Periodically send countdown updates to the group (once a day)
setInterval(() => {
    const chatId = process.env.YOUR_USER_ID;  // Use the group chat ID from .env
    sendReminderMessage(chatId);
}, 1000 * 60 * 60 * 24);  // Send once a day

// Respond to "/start" command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Welcome to the Countdown Bot! I will remind you about the Exit Exam and give updates on the countdown.");
});

// Respond to "/remind" command but restrict to admin user only
bot.onText(/\/remind/, (msg) => {
    const chatId = process.env.YOUR_USER_ID;
    const userId = msg.from.id;

    // Check if the user is the admin (you)
    if (userId === parseInt(adminUserId)) {
        sendReminderMessage(chatId);
    } else {
        bot.sendMessage(chatId, "Sorry, you don't have permission to use this command.");
    }
});

// Handle errors
bot.on('polling_error', (error) => {
    console.log(error);  // You can log the error to a file or monitoring system
});

// Create a basic HTTP server to ensure port binding for Render
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running');
}).listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
