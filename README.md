# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

This is the login form a user might see when they visit the login page. It is very similar to the register page.
!["Screenshot of login page"](https://github.com/fatimasajadi/tinyapp/blob/master/docs/login-page.PNG?raw=true)

This is the main URLs page a logged in user might see. Only the urls created by the current logged in user are visible. User can see the shortURL, longURL, and can click to edit or delete the url.
!["Screenshot of URLs page"](https://github.com/fatimasajadi/tinyapp/blob/master/docs/urls-page.PNG?raw=true)

User can click the edit button and edit the existing URL.
!["Screenshot of edit URLs page"](https://github.com/fatimasajadi/tinyapp/blob/master/docs/edit-page.PNG?raw=true)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.
