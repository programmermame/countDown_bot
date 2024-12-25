import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch'; // Use import instead of require
import dotenv from 'dotenv';  // Use import for dotenv
import http from 'http'; // Node.js HTTP module
import express from 'express'; // Express to handle HTTP requests

dotenv.config(); // Load environment variables

// Load Telegram Bot token and user ID from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const adminUserId = process.env.YOUR_USER_ID;  // Admin user ID from .env

// Set up the Express app
const app = express();

// Create a Telegram bot instance with webhook setup
const bot = new TelegramBot(token);
const port = process.env.PORT || 10000; // Ensure a port is set for Render

// Exit Exam Date
const examDate = new Date("2025-02-03T05:30:00Z");

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
    let message = "⏰ *Reminder!* 📝\n\n";

    if (days > 0) {
        message += `Your Exit Exam is in *${days} days*, *${hours} hours*, and *${minutes} minutes*! 📚📖\n\nTime to study hard! 🔥📚`;
    } else if (days === 0 && hours > 0) {
        message += `Your Exit Exam is today! Only *${hours} hours* and *${minutes} minutes* left!`;
    } else if (days === 0 && hours === 0 && minutes > 0) {
        message += `Your Exit Exam is in *${minutes} minutes*! 💥 It's almost time, good luck! 🍀`;
    } else {
        message += `The Exit Exam has already passed. Good job for completing it! 🎓`;
    }

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

// Respond to "/start" command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Welcome to the Countdown Bot! I will remind you about the Exit Exam and give updates on the countdown.");
});

// Respond to "/remind" command but restrict to admin user only
bot.onText(/\/remind/, (msg) => {
    const groupId = process.env.GROUP_CHAT_ID;
    const userId = msg.from.id;

    // Check if the user is the admin (you)
    if (userId === parseInt(adminUserId)) {
        sendReminderMessage(groupId);  // Send reminder to the group
    } else {
        bot.sendMessage(userId, "Sorry, you don't have permission to use this command.");
    }
});

// Set webhook URL for Telegram bot
const webhookUrl = `${process.env.HOST_URL}/bot${token}`;
bot.setWebHook(webhookUrl);

// Create an HTTP server with Express to handle webhook requests
app.use(express.json()); // Parse incoming JSON requests

// Endpoint that Telegram will send POST requests to
app.post(`/bot${token}`, (req, res) => {
    const update = req.body;
    if (update.message) {
        const chatId = update.message.chat.id;

        // Handle incoming message
        if (update.message.text === '/start') {
            bot.sendMessage(chatId, "Welcome to the Countdown Bot! I will remind you about the Exit Exam and give updates on the countdown.");
        } else if (update.message.text === '/remind') {
            const userId = update.message.from.id;
            // Check if the user is the admin
            if (userId === parseInt(adminUserId)) {
                sendReminderMessage(chatId);  // Send reminder to the group
            } else {
                bot.sendMessage(chatId, "Sorry, you don't have permission to use this command.");
            }
        }
    }
    res.send('ok'); // Respond to Telegram that the request was successful
});

// Create a basic HTTP server to ensure port binding for Render
http.createServer(app).listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
