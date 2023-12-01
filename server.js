const express = require('express');
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require('jsonwebtoken');
const passport = require("passport");
const passportJWT = require("passport-jwt");
dotenv.config();
const userService = require("./user-service.js");

const HTTP_PORT = process.env.PORT || 8080;

let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;

let jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
    secretOrKey: process.env.JWT_SECRET,
  };

  let strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
    console.log('payload received', jwt_payload);

    if (jwt_payload) {
        
        next(null, { _id: jwt_payload._id, 
            userName: jwt_payload.userName }); 
    } else {
        next(null, false);
    }
});


app.use(passport.initialize());



app.use(express.json());
app.use(cors());

app.post("/api/user/register", (req, res) => {
    userService.registerUser(req.body)
    .then((msg) => {
        res.json({ "message": msg });
    }).catch((msg) => {
        res.status(422).json({ "message": msg });
    });
});

app.post("/api/user/login", (req, res) => {
    userService.checkUser(req.body)
    .then((user) => {
        if (user) {
            // Generate payload for the JWT token
            const payload = {
                _id: user._id,
                userName: user.userName

            };

            // Sign the payload with JWT_SECRET from .env file
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Adjust expiration as needed

            res.json({ message: 'Login successful', token });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    }).catch(msg => {
        res.status(422).json({ message: msg });
    });
});

app.get("/api/user/favourites", passport.authenticate('jwt', { session: false }), (req, res) => {
    // Accessible only if authenticated
    userService.getFavourites(req.user._id)
    .then(data => {
        res.json(data);
    }).catch(msg => {
        res.status(422).json({ error: msg });
    });
});

app.put("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    // Accessible only if authenticated
    userService.addFavourite(req.user._id, req.params.id)
    .then(data => {
        res.json(data)
    }).catch(msg => {
        res.status(422).json({ error: msg });
    });
});

app.delete("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    // Accessible only if authenticated
    userService.removeFavourite(req.user._id, req.params.id)
    .then(data => {
        res.json(data)
    }).catch(msg => {
        res.status(422).json({ error: msg });
    });
});


app.get("/api/user/history", passport.authenticate('jwt', { session: false }), (req, res) => {
    // Accessible only if authenticated
    userService.getHistory(req.user._id)
    .then(data => {
        res.json(data);
    }).catch(msg => {
        res.status(422).json({ error: msg });
    });
});

app.put("/api/user/history/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    // Accessible only if authenticated
    userService.addHistory(req.user._id, req.params.id)
    .then(data => {
        res.json(data)
    }).catch(msg => {
        res.status(422).json({ error: msg });
    });
});

app.delete("/api/user/history/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    // Accessible only if authenticated
    userService.removeHistory(req.user._id, req.params.id)
    .then(data => {
        res.json(data)
    }).catch(msg => {
        res.status(422).json({ error: msg });
    });
});

userService.connect()
.then(() => {
    app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
})
.catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
});
