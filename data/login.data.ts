import { users } from './users';

export interface InvalidLoginCase {
  name: string;
  username: string;
  password: string;
  error: string;
}

// Data-driven login failures. `name` completes the test title "rejects <name>".
const invalidLogins: InvalidLoginCase[] = [
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

export { invalidLogins };
