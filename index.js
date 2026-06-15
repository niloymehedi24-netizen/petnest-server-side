const express = require('express');
const app = express();
const PORT = 8000;


app.get('/', (req, res) => {
    res.send('Server is running fine!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});