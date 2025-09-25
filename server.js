const express = require('express');
const axios = require('axios');
const app = express();

// Telegram Configuration - EXACTLY matching your working bot
const TELEGRAM_TOKEN = "7876427497:AAFCu9zbouiRNPh5Qg-bfAUF71MyOouDzUM";
const TELEGRAM_TARGETS = [919495165, -1001685005748]; // personal + channel IDs
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

// Main webhook endpoint for TradingView
app.post('/webhook', async (req, res) => {
    try {
        console.log('=== WEBHOOK RECEIVED ===');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body type:', typeof req.body);
        console.log('Body content:', JSON.stringify(req.body, null, 2));
        
        // TradingView sends webhook data in different formats
        let message = '';
        
        if (typeof req.body === 'string') {
            // Sometimes TradingView sends as plain text
            message = req.body;
        } else if (req.body && typeof req.body === 'object') {
            // Check various possible message fields
            message = req.body.message || 
                     req.body.text || 
                     req.body.alert ||
                     req.body.content ||
                     JSON.stringify(req.body);
        } else {
            message = 'Webhook received but no message content found';
        }
        
        // Clean up the message
        if (!message || message.trim() === '' || message === '{}' || message === 'null') {
            message = '🔥 Test alert from God Money Machine webhook! 🔥';
        }
        
        console.log('Processed message:', message);
        console.log('=========================');
        
        // Send to Telegram
        const telegramResult = await sendToTelegram(message);
        
        res.status(200).json({ 
            success: true, 
            message: 'Alert sent to Telegram',
            telegramResult: telegramResult,
            receivedData: req.body,
            processedMessage: message,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const results = [];
    
    // Send to both targets
    for (const chatId of TELEGRAM_TARGETS) {
        try {
            const payload = {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            };
            
            console.log(`📤 Sending to chat ${chatId}:`, message.substring(0, 100) + '...');
            
            const response = await axios.post(url, payload);
            console.log(`✅ Success for chat ${chatId}:`, response.data);
            
            results.push({
                chatId: chatId,
                success: true,
                response: response.data
            });
            
        } catch (error) {
            console.error(`❌ Error sending to chat ${chatId}:`, error.response?.data || error.message);
            results.push({
                chatId: chatId,
                success: false,
                error: error.response?.data || error.message
            });
        }
    }
    
    return results;
}

// Health check endpoints
app.get('/', (req, res) => {
    res.json({ 
        status: 'God Money Machine Webhook Server is Running! 💰',
        timestamp: new Date().toISOString(),
        endpoints: {
            webhook: '/webhook',
            health: '/health',
            test: '/test'
        },
        telegram: {
            token: TELEGRAM_TOKEN.substring(0, 10) + '...',
            targets: TELEGRAM_TARGETS
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

// Test endpoint
app.get('/test', async (req, res) => {
    try {
        const testMessage = '🧪 Test message from webhook server health check!';
        const results = await sendToTelegram(testMessage);
        res.json({
            success: true,
            message: 'Test message sent',
            results: results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 God Money Machine Webhook Server started on port ${PORT}`);
    console.log(`📡 Webhook endpoint: /webhook`);
    console.log(`🔧 Test endpoint: /test`);
    console.log(`💸 Telegram targets: ${TELEGRAM_TARGETS.join(', ')}`);
    console.log(`🤖 Bot token: ${TELEGRAM_TOKEN.substring(0, 10)}...`);
});
