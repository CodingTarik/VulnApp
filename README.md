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

## Used OWASP
OWASP Top 10 2017 was used to implement the vulnerabilities in the application. The following vulnerabilities were implemented in the application:

## FLAW 1: SQL Injection Vulnerability (Injection)
### Source Link:
[app.js#L58](https://github.com/CodingTarik/VulnApp/blob/main/vulnNodeApp/app.js#L58)

### Description:
The login route is vulnerable to SQL injection. This vulnerability occurs because the user input is directly concatenated into the SQL query without any sanitization or validation. An attacker can exploit this by injecting malicious SQL code through the input fields, which can manipulate the query to bypass authentication, retrieve sensitive data, or even modify the database. For example, an attacker could input `' OR '1'='1` as the username and password, which would result in a query that always returns true, allowing unauthorized access to the application.

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

## FLAW 2: Cross-Site Scripting (XSS) Vulnerability (XSS)
### Source Link:
[notes.ejs#L88](https://github.com/CodingTarik/VulnApp/blob/main/vulnNodeApp/app.js#L88)

### Description:
The application renders user-generated content without proper sanitization, allowing an attacker to inject malicious scripts that will be executed in the context of the user's browser. This vulnerability can be exploited by an attacker to perform actions such as stealing session cookies, redirecting users to malicious websites, or displaying fraudulent content. For example, an attacker could input a script tag in a form field, which would then be rendered and executed when another user views the content. This can lead to a range of attacks, including session hijacking and phishing.

### How to Fix:
Escape user-generated content before rendering it in the HTML to prevent the execution of malicious scripts.

### Fix:
```html
<!-- FIX: Escape output using EJS sanitization or use safer templating engines -->
<%= note.content %>
```

## FLAW 3: Arbitrary File Write Vulnerability (Broken Access Control)
### Source Link:
[app.js#L138](https://github.com/CodingTarik/VulnApp/blob/main/vulnNodeApp/app.js#L138)

### Description:
The application allows users to specify the name of the file to be written. This can lead to arbitrary file write vulnerabilities if the input is not properly sanitized. An attacker can exploit this vulnerability by providing a file name that includes path traversal characters (e.g., `../`), which can cause the application to write files outside the intended directory. This can result in overwriting critical system files, creating new files in sensitive locations, or executing arbitrary code. For example, an attacker could specify a file name like `../../../../etc/passwd`, which would cause the application to write to the system's password file, potentially leading to a complete system compromise.

### How to Fix:
Validate and sanitize the file name to ensure it does not contain any path traversal characters or other malicious input.

### Fix:
```javascript
// FIX: Validate input and restrict to allowed paths
const filePath = path.join(__dirname, 'uploads', path.basename(name) + '.txt');
```

## FLAW 4: Improper Output Neutralization for Logs
### Source Link:
[app.js#L67](https://github.com/CodingTarik/VulnApp/blob/main/vulnNodeApp/app.js#L67)

### Description:
The application logs user input directly into an HTML file without proper sanitization. This can lead to Cross-Site Scripting attacks if the logs are viewed in a browser. When user input is logged without escaping special characters, an attacker can inject malicious scripts into the logs. If an administrator or another user views these logs in a web browser, the malicious scripts can be executed in the context of their session. This can result in various attacks, such as stealing session cookies, redirecting users to malicious websites, or displaying fraudulent content. For example, an attacker could input a script tag in a form field, which would then be logged and executed when viewed in the browser, leading to potential session hijacking or other malicious actions.
Injecting HTML is also possible, which can lead to fake logs by injecting `<br>` tags or other HTML elements.


### How to Fix:
Escape user input before logging it to ensure that any HTML or script content is properly neutralized.

### Fix:
```javascript
// FIX: Escape output using EJS sanitization or use safer templating engines
const log = `<div>Invalid login attempt for user: ${sanitize(username)}</div>`;
```

### How to Fix:
Escape user input before logging it to ensure that any HTML or script content is properly neutralized.

### Fix:
```javascript
// FIX: Escape output using EJS sanitization or use safer templating engines
const log = `<div>Invalid login attempt for user: ${sanitize(username)}</div>`;
```

## FLAW 5: Sensitive Data Exposure
### Source Link:
[app.js#L157](https://github.com/CodingTarik/VulnApp/blob/main/vulnNodeApp/app.js#L157)

### Description:
The application exposes sensitive user data through an endpoint that can be accessed by any authenticated user, including non-admin users. This vulnerability arises because there is no proper access control mechanism in place to restrict access to this endpoint. As a result, any user who is logged into the application can retrieve sensitive information such as usernames, email addresses, and other personal details of all users in the system. This can lead to privacy violations and potential misuse of the exposed data. For example, an attacker who gains access to a regular user account can exploit this vulnerability to gather information about other users, which can be used for further attacks such as phishing or social engineering.

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

