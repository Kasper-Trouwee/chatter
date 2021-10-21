const express = require('express');
let router = express.Router();

router
    .route("/")
    .get((req, res) => {
        res.render('index', {
            title: "Welcome to Chatter",
            isAuthenticated: req.oidc.isAuthenticated(),
            user: req.oidc.user,
        }); 
    });


router
    .route("/room")
    .get((req, res) => {
        if(req.oidc.isAuthenticated()){
            res.render('room', {
                user: req.oidc.user,
            }); 
        }
    });


router
    .route("/room/chat")
    .get((req, res) => {
        if(req.oidc.isAuthenticated()){
            res.render('chat'); 
        }
    });

module.exports = router;