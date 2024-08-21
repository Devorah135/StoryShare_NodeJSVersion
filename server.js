const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mysql = require('mysql');
const session = require('express-session');

const app = express();

app.use(session({
    secret: 'we-love-358!',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // Add this if you expect JSON data


const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'stories'
});

function queryDatabase(query, params, callback) {
    pool.query(query, params, (err, results) => {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, results);
    });
}

app.get('/', (req, res) => {
    res.render('home', { title: 'Home Page' });
});

app.get('/home', (req, res) => {
    res.render('home', { title: 'Home Page' });
});

app.get('/submit_story', (req, res) => {
    getTopics((err, topics) => {
        if (err) {
            console.error("Error fetching topics:", err);
            return res.status(500).send("Error fetching topics");
        }

        getPositions((err, positions) => {
            if (err) {
                console.error("Error fetching positions:", err);
                return res.status(500).send("Error fetching positions");
            }

            res.render('submit_story',
                { title: 'Submit Story', topics, positions });
        });
    });
});

app.post('/results', (req, res) => {
   console.log(req.body);

    const { title, first_name, last_name, email, show_email, position, story } = req.body; // Access form data
    //console.log(req.body);

    const topics = req.body['topic[]'];
    console.log('Topics: ', topics);

    // Convert topicIds array to JSON string if using JSON storage
    const topicIdsJson = JSON.stringify(topics);
    console.log('Topic IDs JSON:', topicIdsJson);

     // Prepare the SQL query
    const query = `
        INSERT INTO stories (title, author, content, author_email, show_email, topic_ids, position_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // Execute the query
    pool.query(query, [title, `${first_name} ${last_name}`, story, email, show_email ? 1 : 0, topicIdsJson, position], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Error saving story to the database.');
        }
    });

    res.render('submit_results', {
        title: title
    });
});

function getTopics(callback) {
    queryDatabase("SELECT * FROM topics", [], (err, topics) => {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, topics);
    });
}

function getPositions(callback) {
    queryDatabase("SELECT * FROM positions", [], (err, positions) => {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, positions);
    });
}

app.get('/stories', (req, res) => {
    queryDatabase("SELECT * FROM stories", [], (err, stories) => {
        if (err) throw err;

        const processedStories = stories.map(story => {
            const { title, author, content, is_approved, show_email, author_email, topic_ids } = story;

            return new Promise((resolve, reject) => {
                let topicNames = [];
                if (topic_ids) {
                    const topicsQuery = `SELECT topic_name FROM topics WHERE topic_id IN (${topic_ids.split(',').map(() => '?').join(',')})`;
                    queryDatabase(topicsQuery, JSON.parse(topic_ids), (err, results) => {                        if (err) {
                            reject(err);
                        } else {
                            topicNames = results.map(row => row.topic_name);
                            resolve({ title, author, content, is_approved, show_email, author_email, topic_names: topicNames });
                        }
                    });
                } else {
                    resolve({ title, author, content, is_approved, show_email, author_email, topic_names: [] });
                }
            });
        });
        const username = req.session.username;
        Promise.all(processedStories)
            .then(stories => res.render('stories', { title: 'Browse Stories', stories, username }))
            .catch(err => {
                console.error('Error processing stories:', err);
                res.status(500).send('Error processing stories');
            });
    });
});

app.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact Us' });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Admin Login' });
});

app.get('/admin_stories', (req, res) => {
    const username = req.session.username;
    if (!username) {
        res.redirect('/login');
        return;
    }

    queryDatabase("SELECT * FROM stories", [], (err, stories) => {
        if (err) throw err;

        const processedStories = stories.map(story => {
            const { story_id, title, author, content, is_approved, show_email, author_email, topic_ids } = story;

            return new Promise((resolve, reject) => {
                let topicNames = [];
                if (topic_ids) {
                    const topicsQuery = `SELECT topic_name FROM topics WHERE topic_id IN (${topic_ids.split(',').map(() => '?').join(',')})`;
                    console.log("Topic IDs:", topic_ids);
                    console.log("Constructed SQL Query:", topicsQuery);
                    console.log("Query Parameters:", topic_ids.split(','));
                    queryDatabase(topicsQuery, JSON.parse(topic_ids), (err, results) => {                        if (err) {
                            reject(err);
                        } else {
                            topicNames = results.map(row => row.topic_name);
                            resolve({ story_id, title, author, content, is_approved, show_email, author_email, topic_names: topicNames });
                        }
                    });
                } else {
                    resolve({ story_id, title, author, content, is_approved, show_email, author_email, topic_names: [] });
                }
            });
        });

        Promise.all(processedStories)
            .then(stories => res.render('admin_stories', { title: 'Browse and Approve Stories', stories, username }))
            .catch(err => {
                console.error('Error processing stories:', err);
                res.status(500).send('Error processing stories');
            });
    });
});

app.post('/approve_story', (req, res) => {
    const storyId = req.body.story_id;
    const username = req.session.username;

    queryDatabase('UPDATE stories SET is_approved = 1 WHERE story_id = ?', [storyId], (err) => {
        if (err) {
            console.error('Error updating story approval:', err);
            res.status(500).send('Error approving story. Please try again later.');
            return;
        }

        res.redirect(`/admin_stories?username=${encodeURIComponent(username)}`);
    });
});

app.post('/disapprove_story', (req, res) => {
    const storyId = req.body.story_id;
    const username = req.session.username;

    queryDatabase('UPDATE stories SET is_approved = 0 WHERE story_id = ?', [storyId], (err) => {
        if (err) {
            console.error('Error updating story approval:', err);
            res.status(500).send('Error disapproving story. Please try again later.');
            return;
        }

        res.redirect(`/admin_stories?username=${encodeURIComponent(username)}`);
    });
});

app.post('/delete_story', (req, res) => {
    const storyId = req.body.story_id;
    const username = req.session.username;

    queryDatabase('DELETE FROM stories WHERE story_id = ?', [storyId], (err) => {
        if (err) {
            console.error('Error deleting story:', err);
            res.status(500).send('Error deleting story. Please try again later.');
            return;
        }

        res.redirect(`/admin_stories?username=${encodeURIComponent(username)}`);
    });
});

app.post('/admin_login', (req, res) => {
    const { username, password } = req.body;
    adminLogin(req, username, password, res);
});

app.post('/add_admin_submit', (req, res) => {
    const { username, password } = req.body;
    addAdmin(username, password, res);
});

app.post('/contact_form_submit', (req, res) => {
    const { name, email, message } = req.body;
    const emailContent = `Name: ${name || 'N/A'}\nEmail: ${email}\nMessage: ${message}`;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'storyshare358@gmail.com',
            pass: 'your_password' // Replace with actual password
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
            res.render('contact', { showResult: true, success: false });
        } else {
            console.log('Email sent: ' + info.response);
            res.render('contact', { showResult: true, success: true });
        }
    });
});

function showAdminList(res) {
    queryDatabase("SELECT username FROM authorizedusers", [], (err, results) => {
        if (err) {
            console.error('Error fetching admin list:', err);
            res.status(500).send('Error fetching admin list');
            return;
        }
        res.render('admin_list', { title: 'Admin List', admins: results });
    });
}

function adminLogin(req, username, password, res) {
    queryDatabase('SELECT * FROM authorizedusers WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) {
            console.error('Error during admin login:', err);
            res.status(500).send('Error during login');
            return;
        }

        if (results.length > 0) {
            req.session.username = username;
            res.redirect('/admin_stories');
        } else {
            res.render('login', { title: 'Admin Login', loginFailed: true });
        }
    });
}

function addAdmin(username, password, res) {
    queryDatabase('INSERT INTO authorizedusers (username, password) VALUES (?, ?)', [username, password], (err) => {
        if (err) {
            console.error('Error adding admin:', err);
            res.status(500).send('Error adding admin');
            return;
        }
        showAdminList(res);
    });
}

app.listen(7001, () => {
    console.log('Server is running on port 7001');
});
