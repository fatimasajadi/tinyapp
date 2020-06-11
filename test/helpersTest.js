const { assert } = require('chai');
const { emailAvailable } = require('../helpers.js');

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "111"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "test"
  },
  "7272FF": {
    id: "7272FF",
    email: "fat@gmail.com",
    password: "123"
  }
};

describe('emailAvailable', function() {
  it('should return false if the email address exists in the users DB (we do not want to have duolicated users in our DB)', function() {
    // Write your assert statement here
    assert.strictEqual(emailAvailable("user@example.com", users), false);
  });
  it('should return true if the email address does not exexist in the users DB (so we can add it to the DB)', function() {
    // Write your assert statement here
    assert.strictEqual(emailAvailable("s.sfatemeh@gmail.com", users), true);
  });
});