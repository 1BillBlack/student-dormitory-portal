const crypto = require('crypto');

const passwords = [
    "manager123",
    "admin123",
    "member123"
];

console.log("SHA256 Password Hashes:\n");
passwords.forEach(password => {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    console.log(`"${password}" -> ${hash}`);
});
