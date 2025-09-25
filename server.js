const express = require('express');
const axios = require('axios');
const app = express();

// Your Telegram Configuration
const TELEGRAM_BOT_TOKEN = '7876427497:AAFCu9zbouiRNPh5Qg-bfAUF71MyOouDzUM';
const TELEGRAM_TARGETS = [919495165, -1001685005748]; // your personal + channel IDs
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Main webhook endpoint for TradingView
app.post('/webhook', async (req, res) => {
    try {
        console.log('Received webhook:', JSON.stringify(req.body, null, 2));
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        
        // TradingView can send data in different formats, let's handle all cases
        let message = '';
        
        // Check various possible message fields
        if (req.body.message) {
            message = req.body.message;
        } else if (req.body.text) {
            message = req.body.text;
        } else if (req.body.alert) {
            message = req.body.alert;
        } else if (typeof req.body === 'string') {
            message = req.body;
        } else {
            // If no recognized message field, use the entire body as message
            message = JSON.stringify(req.body);
        }
        
        // If still empty, create a test message
        if (!message || message.trim() === '' || message === '{}') {
            message = 'Test alert received from TradingView - message field was empty';
        }
        
        console.log('Processed message:', message);
        
        // Send to all your Telegram targets
        await sendToTelegram(message);
        
        res.status(200).json({ 
            success: true, 
            message: 'Alert sent to Telegram',
            receivedData: req.body,
            processedMessage: message,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    // Send to both your personal chat and channel
    for (const chatId of TELEGRAM_TARGETS) {
        try {
            const payload = {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            };
            
            await axios.post(url, payload);
            console.log(`✅ Message sent to chat ${chatId}`);
            
        } catch (error) {
            console.error(`❌ Error sending to chat ${chatId}:`, error.response?.data || error.message);
        }
    }
}

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'God Money Machine Webhook Server is Running! 💰',
        timestamp: new Date().toISOString(),
        endpoints: {
            webhook: '/webhook',
            health: '/health'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString() 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 God Money Machine server running on port ${PORT}`);
    console.log(`📡 Webhook endpoint: /webhook`);
    console.log(`💸 Ready to receive TradingView alerts!`);
});
