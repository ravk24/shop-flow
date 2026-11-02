const { users } = require('./users');

// Data-driven login failures. `name` completes the test title "rejects <name>".
const invalidLogins = [
  {
    name: 'a wrong password',
    username: users.standard.username,
    password: 'wrong_password',
    error: 'Epic sadface: Username and password do not match any user in this service',
  },
  {
    name: 'an empty username and password',
    username: '',
    password: '',
    error: 'Epic sadface: Username is required',
  },
  {
    name: 'an empty password',
    username: users.standard.username,
    password: '',
    error: 'Epic sadface: Password is required',
  },
];

module.exports = { invalidLogins };
