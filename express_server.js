const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { emailAvailable } = require('./helpers');
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['f080ac7b-b838-4c5f-a1f4-b0a9fee10130', 'c3fb18be-448b-4f6e-a377-49373e9b7e1a'],
}))


//HelperFunctions
//This function generates random alphanumeric string.
//This function takes the length of the string as an argument
const generateRandomString = function(length) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

//Takes email and pasword and check if they match!
const getMatchingUser = function(email, password) {
  for (let key in users) {
    if (email === users[key].email && bcrypt.compareSync(password, users[key].password)) {
      return users[key];
    }
  }
  return false;
};

//Takes an id then chek the data base and returns all the records specific to the id.
const urlsForUser = function(id) {
  const obj = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key]["userID"] === id) {
      obj[key] = urlDatabase[key];
    }
  }
  return obj;
};

//Checks if a user is already logged in and returns userID.
const isUserLoggedIn = (req) => {
  const userId = req.session.user_id;
  return userId && users[userId];
}

//Check to see if a specific short url is on the DB or not!
const isUrlAvailable = (url, DB) => {
  for (let key in DB) {
    if (key === url) {
      return true;
    }
  }
  return false;
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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//If the user is alredy logged in, GET the /urls record specific to the user
//If the user is not logged in, ask the user to login or register first.
app.get("/urls", (req, res) => {;
  if (isUserLoggedIn(req)) {
    const specificUrlDB = urlsForUser(req.session.user_id);
    let templateVars = { urls: specificUrlDB, user_id: req.session.user_id, users: users, };
    res.render("urls_index", templateVars);
  } else {
    req.session.user_id = null;
    let templateVars = { user_id: req.session.user_id, users: users };
    const errorMsg = "401 Unauthorized Error! Please try login or register!";
    res.status(401).render('unauthorized', {...templateVars, errorMsg });
  }
});

//Only logged in users can have access to /urls/new to create new urls.
//If the user is not logged in, and tried to access the /urls/new, asks the users to login or register first!
app.get("/urls/new", (req, res) => {
  let templateVars = { user_id: req.session.user_id, users: users };
  if (isUserLoggedIn(req)) {
    res.render("urls_new", templateVars);
  } else {
    const errorMsg = "401 Unauthorized Error! Please try login or register!";
    res.status(401).render('unauthorized', {...templateVars, errorMsg });
  }
});

//POST new urls to the /urls and assign the random id to the record in DB.
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

//Clears the cookie and redirect the user to the main (/urls) page.
app.post("/logout", (req, res) => {
  req.session['user_id'] = null;
  res.redirect("/urls/");
});

//Assigns a random id to the new registered users.
//Checks if the user is alredy on the DB, if not add it to the record.
//If the email is alredy on the DB, returns an error, saying that the email already exists.
//Both email and password are required in order to be registered.
app.post("/register", (req, res) => {
  let templateVars = { user_id: req.session.user_id, users: users };
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
    res.status(404).send("Email and password are required");
  } else if (!emailAvailable(req.body.email, users)) {
    const errorMsg = "This email has already been registerd!";
    res.status(400).render('unauthorized', {...templateVars, errorMsg });
  }
});

//GET the /register page.
app.get("/register", (req, res) => {
  let templateVars = { user_id: req.session.user_id, users: users };
  res.render("register", templateVars);
});

//Checks if the email and password match inorder to login.
//If email exists but password was incorrect, return "password is incorrect error".
//If email does not exist, return proper error by saying that the email is not found.
app.post("/login", (req, res) => {
  let templateVars = { user_id: req.session.user_id, users: users };
  const matchingUser = getMatchingUser(req.body.email, req.body.password);
  if (matchingUser) {
    req.session.user_id = matchingUser.id;
    res.redirect("/urls/");

  } else if (!emailAvailable(req.body.email, users)) {
    const errorMsg = "The password is incorrect!"
    res.status(403).render('unauthorized', {...templateVars, errorMsg });

  } else {
    const errorMsg = "The email address is not found!";
    res.status(403).render('unauthorized', {...templateVars, errorMsg });

  }
});

//GET the initial login page.
app.get("/login", (req, res) => {
  let templateVars = { user_id: req.session.user_id, users: users };
  res.render("login", templateVars);
});

//Only loggedin users can edit their own urls 
//If a user wants to edit another's url, return "access denied!"
app.post("/urls/:shortURL", (req, res) => {
  let templateVars = { user_id: req.session.user_id, users: users };
  let editShort = req.params.shortURL;
  if (req.session.user_id) {
    const specificUrlDB = urlsForUser(req.session.user_id);
    for (key in specificUrlDB) {
      if (key === editShort) {
        urlDatabase[editShort].longURL = req.body.editshort;
        res.redirect("/urls/");
      } else {
        const errorMsg = "Access denied!";
        res.status(401).render('unauthorized', {...templateVars, errorMsg });
      }
    }
  }
});

//GET specific url page only if the creator user is logged in.
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

//Only loggedin users can delete their own urls 
//If a user wants to delete another's url, return "access denied!"
app.post("/urls/:shortURL/delete", (req, res) => {
  let templateVars = { user_id: req.session.user_id, users: users };
  let shortDel = req.params.shortURL;
  if (req.session.user_id) {
    const specificUrlDB = urlsForUser(req.session.user_id);
    for (key in specificUrlDB) {
      if (key === shortDel) {
        delete urlDatabase[shortDel];
        res.redirect("/urls")
      } else {
        const errorMsg = "Access denied!";
        res.status(401).render('unauthorized', {...templateVars, errorMsg });

      }
    }
  }
});

//only short urls that are actually recorded on the DB can be accessed through /u/:shortURL.
//If the url is not recorded, should return proper error by saying that "This website is not on the Database!"
app.get("/u/:shortURL", (req, res) => {
  let templateVars = { user_id: req.session.user_id, users: users };
  let shortURL = req.params.shortURL;

  if (isUrlAvailable(shortURL, urlDatabase)) {
    res.redirect(urlDatabase[shortURL].longURL);
  } else {
    const errorMsg = "This website is not on the Database!";
    res.status(401).render('unauthorized', {...templateVars, errorMsg });
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});