const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
    })
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});