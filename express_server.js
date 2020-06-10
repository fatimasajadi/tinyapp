const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
var cookieParser = require('cookie-parser');
app.use(cookieParser());

//HelperFunctions
const generateRandomString = function(length) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
const emailAvailable = function(email) {
  for (let key in users) {
    if (email === users[key].email) {
      return false;
    }
  }

  return true;
};
//DB
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user_id: req.cookies.user_id, users: users, email: req.cookies.email };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user_id: req.cookies.user_id, users: users };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  urlDatabase[generateRandomString(6)] = req.body.longURL;
  let myBody = req.body.longURL;
  let valueAdded = Object.entries(urlDatabase).find(([key, value]) => value === myBody)[0];
  res.redirect(`/urls/${valueAdded}`);
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls/");
});

app.post("/register", (req, res) => {
  let userId = generateRandomString(6);
  if (emailAvailable(req.body.email)) {
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: req.body.password,
    }
    res.cookie('user_id', userId);
    res.redirect("/urls/");
  } else if (!req.body.email || !req.body.password) {
    res.status(404).send("Oh uh, something went wrong");
  } else if (!emailAvailable(req.body.email)) {
    console.log(req.body.email)
    res.status(400).send("This email has already been registerd!");
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/login", (req, res) => {
  res.cookie('email', req.body.email);

  res.redirect("/urls/");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/urls/:shortURL", (req, res) => {
  let editShort = req.params.shortURL;
  console.log(req.body.editshort);
  urlDatabase[editShort] = req.body.editshort;
  console.log(urlDatabase)
  res.redirect("/urls/");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase.shortURL, user_id: req.cookies.user_id, users: users, email: req.cookies.email };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortDel = req.params.shortURL;
  delete urlDatabase[shortDel];
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase.shortURL, user_id: req.cookies.user_id, users: users, email: req.cookies.email };
  res.render("urls_show", templateVars);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});