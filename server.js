const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mysql = require('mysql');

const app = express();

// tell server that we are using pug as our template engine
app.set('view engine', 'pug');

// serve static files from the public folder
app.use(express.static(__dirname + '/public'));

// Use body-parser to parse POST request body
app.use(bodyParser.urlencoded({ extended: false }));

// add a root route - home page
app.get('/', (req, res) => {
    // render the index.pug template and pass title variable
    res.render('home', {
        title:'Home Page'
    });
});

// route for home page
app.get('/home', (req, res) => {
    // render the index.pug template and pass title variable
    res.render('home', {
        title:'Home Page'
    });
});

// route for submit story
app.get('/submit_story', (req, res) => {
    res.render('submit_story', {
        title:'Submit Story'
    });
});

// route for browse stories
app.get('/stories', (req, res) => {

    const getStoriesQuery = "SELECT * FROM stories";

    const db = connectToDatabase();

        // 1. Display list from database
        db.query(getStoriesQuery, (err, story_result) => {
           if (err) throw err;
           console.log("Story List: ", story_result);

           if (story_result.length > 0) {
               let stories = story_result.map(story => {
                    const { title, author, content, is_approved,
                        show_email, author_email, topic_ids } = story;

                // Get topic names if topic_ids is not empty
                let topic_names = [];
                if (topic_ids) {
                    const topics_query = `SELECT topic_name FROM topics WHERE topic_id IN (${topic_ids})`;

                    db.query(topics_query, (err, topics_result) => {
                        if (err) {
                            console.error('Error executing topics query:', err);
                            return;
                        }

                        topic_names = topics_result.map(topic => topic.topic_name);
                    });
                }

                return {
                    title,
                    author,
                    content,
                    is_approved,
                    show_email,
                    author_email,
                    topic_names
                };
               });
                res.render('stories', {
                    title:'Browse Stories',
                    stories });
                } else {
                    res.render('stories', {
                        title:'Browse Stories',
                        stories: [] });
                }
        });
});

// route for contact
app.get('/contact', (req, res) => {
    res.render('contact', {
        title:'Contact Us'
    });
});

// route for login
app.get('/login', (req, res) => {
    res.render('login', {
        title:'Admin Login'
    });
});

 // Handle admin login
app.post('/admin_login', (req, res) => {
    const { username, password } = req.body;
    adminLogin(username, password, res);
});

// Handle form submission and update the list of admins
app.post('/add_admin_submit', (req, res) => {
    const { username, password } = req.body;
    addAdmin(username, password, res);
});

// Handle contact form submission
app.post('/contact_form_submit', (req, res) => {
    const { name, email, message } = req.body;

    const emailContent = `Name: ${name || 'N/A'}\nEmail: ${email}\nMessage: ${message}`;

    //send email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'storyshare358@gmail.com', // Actual email
            pass: 'tuls dlxj wwvr dwhy'         // Password
        }
    });

    const mailOptions = {
        from: 'storyshare358@gmail.com',
        to: 'storyshare358@gmail.com',
        subject: 'StoryShare Contact Us Submission',
        html: emailContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error sending email. Please try again later.');  // Send error response
        } else {
            console.log('Email sent: ' + info.response);
            res.status(200).send('Form submitted successfully!'); // Send success response
        }
    });
});

// set up site to run on port 7000
const server = app.listen(7001, () => {
    console.log(`Express running → PORT ${server.address().port}`);
});

// Function to display the list of admins
function showAdminList(res) {
    const con = connectToDatabase();
    const showAdminListQuery = "SELECT username FROM authorizedusers";

    con.query(showAdminListQuery, function (err, results) {
        if (err) {
            console.error('Error fetching admin list:', err);
            res.status(500).send('Error fetching admin list. Please try again later.');
            return;
        }
        res.render('admin_list', {
            adminList: results.map(row => row.username),
            title: 'Admin List'
        });
    });
}
// Function to handle admin login
function adminLogin(username, password, res) {
    const con = connectToDatabase();
    const query = 'SELECT * FROM authorizedusers WHERE username = ? AND password = ?';

    con.query(query, [username, password], function (err, results) {
        if (err) {
            console.error('Error executing admin login query:', err);
            res.status(500).send('Error during login. Please try again later.');
            return;
        }
        if (results.length > 0) {
            res.send('Login successful');
        } else {
            res.send('Invalid credentials');
        }
    });
}

// Function to handle adding a new admin
function addAdmin(username, password, res) {
    const con = connectToDatabase();
    const addAdminQuery = 'INSERT INTO authorizedusers (username, password) VALUES (?, ?)';

    con.query(addAdminQuery, [username, password], function (err, result) {
        if (err) {
            console.error('Error adding admin:', err);
            res.status(500).send('Error adding admin. Please try again later.');
            return;
        }

        console.log('Admin added successfully!');
        showAdminList(res); // Display the updated admin list
    });
}

function getStories(stories, res) {
    const getStoriesQuery = "SELECT * FROM stories";

    const db = connectToDatabase();

        // 1. Display list from database
        db.query(getStoriesQuery, (err, story_result) => {
           if (err) throw err;
           console.log("Story List: ", result);

           if (story_result.length > 0) {
               const stories = story_result.map(story => {
                    const { title, author, content, is_approved,
                        show_email, author_email, topic_ids } = story;

                // Get topic names if topic_ids is not empty
                let topic_names = [];
                if (topic_ids) {
                    const topics_query = `SELECT topic_name FROM topics WHERE topic_id IN (${topic_ids})`;

                    db.query(topics_query, (err, topics_result) => {
                        if (err) {
                            console.error('Error executing topics query:', err);
                            return;
                        }

                        topic_names = topics_result.map(topic => topic.topic_name);
                    });
                }

                return {
                    title,
                    author,
                    content,
                    is_approved,
                    show_email,
                    author_email,
                    topic_names
                };
               });
                res.render('stories', { stories });
                } else {
                    res.render('stories', { stories: [] });
                }
        });
}

function connectToDatabase() {
    const con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "stories",
    });

    con.connect((err) => {
        if (err) {
            console.error('Error connecting to database:', err);
            return;
        }
        console.log('Connected to database');
    });

    return con;
}