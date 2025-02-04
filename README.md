# VulnApp

## LINK:
[Link to the repository](https://github.com/CodingTarik/VulnApp)

## Installation Instructions:
1. Clone the repository:
   ```sh
   git clone https://github.com/CodingTarik/VulnApp.git
   ```
2. Navigate to the project directory:
   ```sh
   cd VulnApp
   ```
3. Install node
    ```sh
    sudo apt install nodejs
    ```
   or download from [Node.js](https://nodejs.org/en/download/)
4. Install the dependencies:
   ```sh
   npm install
   ```
5. Start the application:
   ```sh
   node app.js
   ```

## FLAW 1: SQL Injection Vulnerability
### Source Link:
[app.js#L58](https://github.com/CodingTarik/VulnApp/blob/main/app.js#L58)

### Description:
The login route is vulnerable to SQL injection. The user input is directly concatenated into the SQL query, allowing an attacker to manipulate the query by injecting SQL code.

### How to Fix:
Use prepared statements to safely handle user input and prevent SQL injection.

### Fix:
```javascript
// FIX: Use prepared statements
db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
    if (user) {
        res.cookie('user', username, { signed: true }); // Sign the cookie
        res.redirect('/notes');
    } else {
        res.send('Invalid credentials');
    }
});
```

## FLAW 2: Cross-Site Scripting (XSS) Vulnerability
### Source Link:
[notes.ejs#L88](https://github.com/CodingTarik/VulnApp/blob/main/views/notes.ejs#L88)

### Description:
The application renders user-generated content without proper sanitization, allowing an attacker to inject malicious scripts that will be executed in the context of the user's browser.

### How to Fix:
Escape user-generated content before rendering it in the HTML to prevent the execution of malicious scripts.

### Fix:
```html
<!-- FIX: Escape output using EJS sanitization or use safer templating engines -->
<%= note.content %>
```

## FLAW 3: Arbitrary File Write Vulnerability
### Source Link:
[app.js#L138](https://github.com/CodingTarik/VulnApp/blob/main/app.js#L138)

### Description:
The application allows users to specify the name of the file to be written, which can lead to arbitrary file write vulnerabilities if not properly sanitized.

### How to Fix:
Validate and sanitize the file name to ensure it does not contain any path traversal characters or other malicious input.

### Fix:
```javascript
// FIX: Validate input and restrict to allowed paths
const filePath = path.join(__dirname, 'uploads', path.basename(name) + '.txt');
```

## FLAW 4: Improper Output Neutralization for Logs
### Source Link:
[app.js#L67](https://github.com/CodingTarik/VulnApp/blob/main/app.js#L67)

### Description:
The application logs user input directly into an HTML file without proper sanitization, which can lead to XSS attacks if the logs are viewed in a browser.

### How to Fix:
Escape user input before logging it to ensure that any HTML or script content is properly neutralized.

### Fix:
```javascript
// FIX: Escape output using EJS sanitization or use safer templating engines
const log = `<div>Invalid login attempt for user: ${sanitize(username)}</div>`;
```

## FLAW 5: Sensitive Data Exposure
### Source Link:
[app.js#L157](https://github.com/CodingTarik/VulnApp/blob/main/app.js#L157)

### Description:
The application exposes sensitive user data through an endpoint that can be accessed by any authenticated user, including non-admin users.

### How to Fix:
Restrict access to the sensitive data endpoint to only admin users.

### Fix:
```javascript
// FIX: Restrict access to sensitive data
app.get('/users', (req, res) => {
    if (req.signedCookies.user === 'admin') {
        db.all('SELECT * FROM users', (err, users) => {
            res.send(users);
        });
    } else {
        res.status(403).send('Unauthorized');
    }
});
```

