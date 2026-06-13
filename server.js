const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to your Supabase project using safe environment variables
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.use(bodyParser.urlencoded({ extended: true }));
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

app.listen(PORT, () => {
    console.log(`NorthBeam running smoothly on port ${PORT}`);
});
