const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
var cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ['f080ac7b-b838-4c5f-a1f4-b0a9fee10130', 'c3fb18be-448b-4f6e-a377-49373e9b7e1a'],
}))
const bcrypt = require('bcrypt');
const { emailAvailable } = require('./helpers');

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

const getMatchingUser = function(email, password) {
  for (let key in users) {
    if (email === users[key].email && bcrypt.compareSync(password, users[key].password)) {
      return users[key];
    }
  }
  return false;
};

const urlsForUser = function(id) {
  const obj = {}
  for (let key in urlDatabase) {
    if (urlDatabase[key]["userID"] === id) {
      obj[key] = urlDatabase[key];
    }
  }

  return obj;
};

//DB
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  },
  "7272FF": {
    id: "7272FF",
    email: "fat@gmail.com",
    password: bcrypt.hashSync("fat", 10)
  }
};
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID", createdAt: new Date() },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID", createdAt: new Date() },
  "msnmsn": { longURL: "http://www.msn.com", userID: "7272FF", createdAt: new Date() }
};


const isUserLoggedIn = (req) => {
  const userId = req.session.user_id;
  return userId && users[userId];
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {;
  if (isUserLoggedIn(req)) {
    const specificUrlDB = urlsForUser(req.session.user_id);
    let templateVars = { urls: specificUrlDB, user_id: req.session.user_id, users: users, };
    res.render("urls_index", templateVars);
  } else {
    req.session.user_id = null;
    let templateVars = { user_id: req.session.user_id, users: users };
    res.status(401).render('unauthorized', templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user_id: req.session.user_id, users: users };
  if (isUserLoggedIn(req)) {
    res.render("urls_new", templateVars);
  } else {
    res.status(401).render('unauthorized', templateVars);
  }
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: req.session.user_id,
    createdAt: new Date(),
  };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/logout", (req, res) => {
  req.session['user_id'] = null;
  res.redirect("/urls/");
});

app.post("/register", (req, res) => {
  let userId = generateRandomString(6);
  if (emailAvailable(req.body.email, users)) {
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
    }
    req.session.user_id = userId;
    res.redirect("/urls/");
  } else if (!req.body.email || !req.body.password) {
    res.status(404).send("Oh uh, something went wrong");
  } else if (!emailAvailable(req.body.email, users)) {
    console.log(req.body.email)
    res.status(400).send("This email has already been registerd!");
  }
});

app.get("/register", (req, res) => {
  let templateVars = { user_id: req.session.user_id, users: users };
  res.render("register", templateVars);
});

app.post("/login", (req, res) => {
  const matchingUser = getMatchingUser(req.body.email, req.body.password);
  if (matchingUser) {
    req.session.user_id = matchingUser.id;
    res.redirect("/urls/");
    console.log(matchingUser)
  } else if (!emailAvailable(req.body.email, users)) {

    res.status(403).send("The password is incorrect!");

  } else {
    res.status(403).send("The email address not found!");
  }
});

app.get("/login", (req, res) => {
  let templateVars = { user_id: req.session.user_id, users: users };
  res.render("login", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  let editShort = req.params.shortURL;
  if (req.session.user_id) {
    const specificUrlDB = urlsForUser(req.session.user_id);
    for (key in specificUrlDB) {
      if (key === editShort)
        urlDatabase[editShort].longURL = req.body.editshort;
    }
    res.redirect("/urls/");
  }

});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (!isUserLoggedIn(req)) {
    res.status(401).render('unauthorized', { user_id: null });
    return;
  }
  const specificUrlDB = urlsForUser(req.session.user_id);
  const dbEntry = specificUrlDB[shortURL];
  console.log(dbEntry);

  if (!dbEntry) {
    res.status(404).send('URL not found');
    return;
  }

  let templateVars = { createdAt: dbEntry.createdAt, shortURL: shortURL, longURL: dbEntry.longURL, user_id: req.session.user_id, users: users };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortDel = req.params.shortURL;
  if (req.session.user_id) {
    const specificUrlDB = urlsForUser(req.session.user_id);
    for (key in specificUrlDB) {
      if (key === shortDel)
        delete urlDatabase[shortDel];
    }
    res.redirect("/urls");
  }

});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});