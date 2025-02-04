const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const fs = require('fs');
const { DOMParser } = require('xmldom');
const xpath = require('xpath');

const path = require('path');
const multer = require('multer');

const app = express();
const db = new sqlite3.Database(':memory:');
const upload = multer({ dest: 'uploads/' });

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('secretcookiepassword!!isdfsdj993jdfgnDSJDGSJG#sddsj!')); // Sign cookies with a secret key
app.use(express.static('public'));

// CSRF protection disabled (VULNERABILITY)
// const csrfProtection = csrf({ cookie: true });
// app.use(csrfProtection);

// Database setup
db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");
    db.run("CREATE TABLE notes (id INTEGER PRIMARY KEY, user_id INTEGER, content TEXT, public INTEGER)");
    db.run("INSERT INTO users (username, password) VALUES ('admin', 'admin')"); // Weak password
});

// Start page
app.get('/', (req, res) => {
    res.render('index');
});

// Registration route
app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], (err) => {
        if (err) {
            return res.status(500).send('Error registering user');
        }
        res.redirect('/login');
    });
});

// Login route
app.get('/login', (req, res) => {
    res.render('login');
});

// Flaw 1 ##############################
// SQL Injection Vulnerability
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`, (err, user) => {
        if (user) {
            res.cookie('user', username, { signed: true }); // Sign the cookie
            res.redirect('/notes');
        } else {
            // Flaw 4 ##############################
            // Improper Output Neutralization for logs
            // save log as html
            const log = `<div>Invalid login attempt for user: ${username}</div>`;
            // append
            fs.appendFileSync('logs.html', log);
            // Fix: Escape output using EJS sanitization or use safer templating engines
            // const log = `<div>Invalid login attempt for user: ${sanitize(username)}</div>`;
            res.send('Invalid credentials');
        }
    });
});
// FIX: Use prepared statements
// db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {

// Logout route
app.get('/logout', (req, res) => {
    res.clearCookie('user');
    res.redirect('/');
});

// Flaw 2 ##############################
// XSS Vulnerability
app.get('/notes', (req, res) => {
    const user = req.signedCookies.user; // Use signed cookies
    db.all(`SELECT * FROM notes WHERE user_id = (SELECT id FROM users WHERE username = '${user}') OR public = 1`, (err, notes) => {
        res.render('notes', { notes, user });
    });
});
// FIX: Escape output using EJS sanitization or use safer templating engines
// res.render('notes', { notes: sanitize(notes) });

// Create note route
app.post('/notes', (req, res) => {
    const user = req.signedCookies.user;
    const { content, public } = req.body;
    const isPublic = public ? 1 : 0;
    db.run("INSERT INTO notes (user_id, content, public) VALUES ((SELECT id FROM users WHERE username = ?), ?, ?)", [user, content, isPublic], (err) => {
        if (err) {
            return res.status(500).send('Error creating note');
        }
        res.redirect('/notes');
    });
});

// Edit note route
app.post('/notes/edit/:id', (req, res) => {
    const { id } = req.params;
    const { content, public } = req.body;
    const isPublic = public ? 1 : 0;
    const user = req.signedCookies.user;
    db.run("UPDATE notes SET content = ?, public = ? WHERE id = ? AND user_id = (SELECT id FROM users WHERE username = ?)", [content, isPublic, id, user], (err) => {
        if (err) {
            return res.status(500).send('Error editing note');
        }
        res.redirect('/notes');
    });
});

// Delete note route
app.post('/notes/delete/:id', (req, res) => {
    const { id } = req.params;
    const user = req.signedCookies.user;
    db.run("DELETE FROM notes WHERE id = ? AND user_id = (SELECT id FROM users WHERE username = ?)", [id, user], (err) => {
        if (err) {
            return res.status(500).send('Error deleting note');
        }
        res.redirect('/notes');
    });
});

// Flaw 3 ##############################
// Arbitrary File Write Vulnerability
app.get('/download/:id/:name', (req, res) => {
    const { id, name } = req.params;
    const user = req.signedCookies.user;
    db.get("SELECT * FROM notes WHERE id = ? AND (user_id = (SELECT id FROM users WHERE username = ?) OR public = 1)", [id, user], (err, note) => {
        if (note) {
            const filePath = path.join(__dirname, 'uploads', `${name}.txt`);
            fs.writeFileSync(filePath, note.content);
            res.download(filePath);
        } else {
            res.status(404).send('Note not found');
        }
    });
});
// FIX: Validate input and restrict to allowed paths
// const filePath = path.join(__dirname, 'uploads', path.basename(note.content) + '.txt');


// Flaw 5 ##############################
// Sensitive Data Exposure
app.get('/users', (req, res) => {
    db.all('SELECT * FROM users', (err, users) => {
        res.send(users);
    });
});
// FIX: Restrict access to sensitive data
// app.get('/users', (req, res) => {
//     if (req.signedCookies.user === 'admin') {
//         db.all('SELECT * FROM users', (err, users) => {
//             res.send(users);
//         });
//     } else {
//         res.status(403).send('Unauthorized');
//     }
// });

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});