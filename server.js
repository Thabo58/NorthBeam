const express = require('express');
const { createClient } = require('@supabase/supabase-client');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// BITCOIN PAYMENT SYSTEM
// Paste your Extended Public Key (xpub) or a static BTC address in your .env file
const BTC_ADDRESS = process.env.BTC_WALLET_ADDRESS; 

// Route to generate a Bitcoin payment request
app.post('/api/checkout', async (req, res) => {
    const { userId, plan } = req.body;
    
    // Hardcoded demo prices in BTC for a modern, simple checkout
    let price = 0.00015; 
    if (plan === 'yearly') price = 0.0012;

    try {
        // In a production app, you would use a service like BTCPay Server API here.
        // For a simple direct setup, we provide the user your wallet address and order details.
        res.json({
            success: true,
            address: BTC_ADDRESS,
            amount: price,
            message: `Please send exactly ${price} BTC to the address below.`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Webhook or manual trigger to assign VPN key after payment confirmation
app.post('/api/verify-payment', async (req, res) => {
    const { userId, txid } = req.body;

    if (!txid) {
        return res.status(400).json({ error: "Transaction ID required" });
    }

    // Generate a random mock VPN key for the user
    const generatedVpnKey = "NB-" + Math.random().toString(36).substring(2, 15).toUpperCase();

    // Update user profile in Supabase
    const { data, error } = await supabase
        .from('profiles')
        .update({ vpn_key: generatedVpnKey })
        .eq('id', userId);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true, vpnKey: generatedVpnKey });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`NorthBeam server running on port ${PORT}`));
