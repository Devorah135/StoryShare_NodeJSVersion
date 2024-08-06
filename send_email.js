
const express = require('express');
const mysql = require('mysql');
// const bodyParser = require('body-parser'); // Added for handling form data
const nodemailer = require('nodemailer');

const app = express();
const port = 3009;

app.use(express.static('public'));

app.get('/form', (req, res) => {
    const name = req.query.name;
    const email = req.query.email;
    const message = req.query.message;

    const emailContent = `Name: ${name || 'N/A'}\nEmail: ${email}\nMessage: ${message}`;

    res.send(emailContent);

// function handleFormSubmission(req, res) {
// const { name, email, message } = req.body; // Extract data from request body

    //send email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'storyshare385@gmail.com', // Actual email
            pass: 'wxnbfcpwbyguoznw' // Password
        }
    });

    const mailOptions = {
        from: 'storyshare385@gmail.com',
        to: 'storyshare385@gmail.com',
        subject: 'StoryShare Contact Us Submission',
        text: emailContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error sending email. Please try again later.');  // Send error response
        } else {
            console.log('Email sent! ' + info.response);
            res.status(200).send('Form submitted successfully!'); // Send success response
        }
    });
});

// app.get('/', (req, res) => {
//     const { name, email, message } = req.body;
//     res.send('Name = ' + name + ', email = ' + email + ', message = ' + message + '.');
// });
//
// app.post('/submit', handleFormSubmission);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});