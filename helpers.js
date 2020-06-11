const emailAvailable = function(email, users) {
  for (let key in users) {
    if (email === users[key].email) {
      return false;
    }
  }
  return true;
};

module.exports = { emailAvailable };