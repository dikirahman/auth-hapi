const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const InvariantError = require('../../exceptions/InvariantError');
const AuthenticationError = require('../../exceptions/AuthenticationError');

class UsersService {
  constructor() {
    this._pool = new Pool();
  }

  async addUser({name, username, email, password}) {
    // verify username
    await this.verifyNewUsername(username);

    // verify email
    await this.verifyNewEmail(email);

    const id = `user-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = {
      text: 'INSERT INTO users (id, name, username, email, password, created_at, updated_at) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, name, username, email, hashedPassword, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Failed to add user.');
    }

    return result.rows[0].id;
  }

  // verify username
  async verifyNewUsername(username) {
    const query = {
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    };

    const result = await this._pool.query(query);

    // if username  already in database
    if (result.rows.length > 0) {
      throw new InvariantError('Failed to add user. username already used.')
    }
  }

  async verifyNewEmail(email) {
    const query = {
      text: 'SELECT email FROM users WHERE email = $1',
      values: [email],
    };

    const result = await this._pool.query(query);

    // if email  already in database
    if (result.rows.length > 0) {
      throw new InvariantError('Failed to add user. email already used.')
    }
  }

  async verifyUserCredential(username, password) {
    const query = {
      text: 'SELECT id, password FROM users WHERE username = $1 OR email = $1',
      values: [username],
    };

    const result = await this._pool.query(query);
    // if id and password not found
    if (!result.rows.length) {
      throw new AuthenticationError('The credentials you provided are wrong.');
    }

    const { id, password: hashedPassword } = result.rows[0];

    // compare hashedpassword value with password
    const match = await bcrypt.compare(password, hashedPassword);

    // if hashedpassword is different with password
    if (!match) {
      throw new AuthenticationError('The credentials you provided are wrong.');
    }

    // if the hashedpassword is the same as the password
    return id;
  }
}

module.exports = UsersService;
