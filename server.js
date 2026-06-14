const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to your Supabase project using safe environment variables
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Safely pull the Coinbase Commerce API Key from your environment
const COINBASE_API_KEY = process.env.COINBASE_API_KEY;

// Middleware to parse both form data and JSON data from the checkout page
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); 
app.use(express.static('public'));

// Serve the front-end page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Back-end handler to create a new user account
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    
    const { data, error } = await supabase
        .from('users')
        .insert([{ email, password_hash: password }])
        .select();

    if (error) {
        return res.send(`<h2>Error: ${error.message}</h2><a href="/">Go Back</a>`);
    }
    res.redirect(`/?user=${email}&status=dashboard`);
});

/**
 * Route: Connects the frontend checkout action to Coinbase Commerce
 */
app.post('/create-charge', async (req, res) => {
    const customerEmail = req.body.email;

    if (!customerEmail) {
        return res.status(400).json({ error: 'Email address is required.' });
    }

    try {
        // Contact the payment gateway to request a unique Bitcoin invoice
        const response = await fetch('https://coinbase.com', {
            method: 'POST',
            headers: {
                'X-CC-Api-Key': COINBASE_API_KEY,
                'X-CC-Version': '2018-03-22',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Digital Product Pack v1',
                description: 'Instant access digital download pack.',
                local_price: {
                    amount: '25.00',
                    currency: 'USD'
                },
                pricing_type: 'fixed_price',
                metadata: {
                    customer_email: customerEmail
                },
                // Redirect user back to their dashboard portal after payment
                redirect_url: `http://localhost:${PORT}/?status=dashboard&user=${encodeURIComponent(customerEmail)}`,
                cancel_url: `http://localhost:${PORT}/`
            })
        });

        const data = await response.json();

        if (data.data && data.data.hosted_url) {
            // Send the checkout interface link back to the front-end script
            res.json({ hosted_url: data.data.hosted_url });
        } else {
            console.error('Payment gateway error response:', data);
            res.status(500).json({ error: 'Failed to generate payment invoice.' });
        }

    } catch (error) {
        console.error('Server Checkout Error:', error.message);
        res.status(500).json({ error: 'Internal system error processing order connection.' });
    }
});

app.listen(PORT, () => {
    console.log(`NorthBeam running smoothly on port ${PORT}`);
});

