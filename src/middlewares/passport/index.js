import passport from "passport"
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GithubStrategy } from "passport-github";
import { UsuariosDao } from "../../dao/index.js";
import { BCRYPT_UTILS } from "../../utils/bcryp-utils.js";
import { DATE_UTILS } from "../../utils/index.js";



const init = () => {
    
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
        const user = await UsuariosDao.getById(id)
        done(null, user);
    });
    
    passport.use(
        "login",
        new LocalStrategy({ usernameField: 'email', passwordField: 'password', passReqToCallback: true }, login)
    );
    
    passport.use(
        "github",
        new GithubStrategy({
            clientID: "Iv1.b1b0cc5a3203c034",
            clientSecret: "36b7b06cbf4904571737c76031002af1b9418b42",
            callbackURL: "http://localhost:8080/api/auth/github",
            scope: ["user:email"]
        },github_login)
    )
}

const github_login = async function(accessToken, refreshToken, profile, done){
    try {
        const gitmail = profile.emails?.[0].value

        if(!gitmail){
            return done(null, false)
        }

        let user = await UsuariosDao.getOne({email:gitmail})
        if(!user){
            user = {
                email: gitmail,
                timestamp: DATE_UTILS.getTimestamp()
            }
            console.log(user)
            const createdUser = await UsuariosDao.save(user)
            user = createdUser
        }

        const userResponse = {
            id: user.id,
            email: user.email,
            carrito: user.carrito
        }

        done(null,userResponse)
    } catch (error) {
        console.log(error)
        done(error)
    }
}


const login = async function (req,email,password,done){
    try {
        if (!email || !password){
            return done(null,false, {error: "Invalid Email or Password"})
        }
        const user = await UsuariosDao.getOne({ email: email });
        if (!user) {
            return done(null, false, { error: "User not found" });
        }

        if (!BCRYPT_UTILS.validatePassword(user, password)) {
            return done(null, false, {error: "Invalid Password"});
        }

        const userResponse = user
        return done(null, userResponse);

    } catch (error) {
        console.log(error)
        return done(error)
    }
}


export const PassportAuth = {init}
