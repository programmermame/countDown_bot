import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch'; // Use import instead of require
import dotenv from 'dotenv';  // Use import for dotenv
import http from 'http'; // Node.js HTTP module
import express from 'express'; // Express to handle HTTP requests
import cron from 'node-cron'; // Import node-cron for scheduling tasks

dotenv.config(); // Load environment variables

// Load Telegram Bot token and user ID from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const adminUserId = process.env.YOUR_USER_ID;  // Admin user ID from .env
const groupId = process.env.GROUP_CHAT_ID;

// Set up the Express app
const app = express();

// Create a Telegram bot instance with webhook setup
const bot = new TelegramBot(token);
const port = process.env.PORT || 10000; // Ensure a port is set for Render

// Exit Exam Date
const examDate = new Date("2025-02-07T11:30:00Z");

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
function sendReminderMessage(groupId) {
    const { days, hours, minutes } = getRemainingTime();
    let message = "⏰ *Reminder!* 📝\n\n";

    if (days > 11) {
        message += `Your Exit Exam is in *${days} days*, *${hours} hours*, and *${minutes} minutes*! 📚📖\n\nTime to study hard! 🔥📚`;
    } else if (days === 11) {
        message += `Only *11 days* left until the Exit Exam! Time to get serious with your preparation. Let's go! 💪📖`;
    } else if (days === 10) {
        message += `Just *10 days* until your Exit Exam! It’s time to focus and make a study schedule. 🗓️📚`;
    } else if (days === 9) {
        message += `*9 days* remaining! Now’s the time to dive into your practice tests and review key concepts! 💡✏️`;
    } else if (days === 8) {
        message += `*${days} days*, *${hours} hours*, and *${minutes} minutes* left! Keep going with your revision and make sure to keep track of important topics. 🧠📑`;
    } else if (days === 7) {
        message += `Only *${days} days*, *${hours} hours*, and *${minutes} minutes* until your Exit Exam! It’s crunch time now—stay focused and keep reviewing. 🕒📖`;
    } else if (days === 6) {
        message += `*${days} days*, *${hours} hours*, and *${minutes} minutes* to go Don’t forget to take short breaks while studying to stay sharp! 🧠⚡️`;
    } else if (days === 5) {
        message += `Just *${days} days*, *${hours} hours*, and *${minutes} minutes* left! Keep reviewing your notes and practice more problems. You’ve got this! 💥📝`;
    } else if (days === 4) {
        message += `*${days} days*, *${hours} hours*, and *${minutes} minutes* remaining! Review past exams and focus on any weak areas. 🧐📚`;
    } else if (days === 3) {
        message += `Only *${days} days*, *${hours} hours*, and *${minutes} minutes*  left until the big day! Review key concepts and start simulating the exam environment.

Remember, you can flag any questions you leave unanswered to easily return to them later⏳📘`;
    } else if (days === 2) {
        message += `Just *${days} days*, *${hours} hours*, and *${minutes} minutes* to go! You’re almost there, keep up the hard work! 🙌📖`;
    } else if (days === 1) {
        message += `Tomorrow is the day! Only *${days} days*, *${hours} hours*, and *${minutes} minutes*  left until your Exit Exam. Make sure to rest and stay calm tonight. 💤📚`;
    } else if (days === 0 && hours > 0) {
        message += `Your Exit Exam is today! Only *${hours} hours* and *${minutes} minutes* left! Stay calm, and do your best! 💪📘`;
    } else if (days === 0 && hours === 0 && minutes > 0) {
        message += `Your Exit Exam is in *${minutes} minutes*! 💥 It’s almost time—good luck! 🍀📚`;
    } else {
        message += `The Exit Exam has already passed. Good job for completing it! 🎓👏`;
    }

    bot.sendMessage(groupId, message, { parse_mode: 'Markdown' });
}

// Respond to "/start" command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Welcome to the Countdown Bot! I will remind you about the Exit Exam and give updates on the countdown.");
});
bot.onText(/\/year/, (msg) => {
    bot.sendMessage(groupId,"🎉 1 Year Alumni 🎉 Throwback word: #noclass Current goal: #salary");
});

// Respond to "/remind" command but restrict to admin user only
bot.onText(/\/remind/, (msg) => {
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
                sendReminderMessage(groupId);  // Send reminder to the group
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

// Automate the reminder every day at 17:40
cron.schedule('0 15 * * *', () => {
    console.log('Sending automated reminder...');
    sendReminderMessage(groupId); // Send reminder to the group
});
