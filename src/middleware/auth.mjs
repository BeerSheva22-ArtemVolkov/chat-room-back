import jwt from 'jsonwebtoken';
// import config from 'config'

const BEARER = 'Bearer ';
const JWT_SECRET = 'art_secret'

const auth = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (authHeader && authHeader.startsWith(BEARER)) {
        const accessToken = authHeader.substring(BEARER.length);
        try {
            // const payload = jwt.verify(accessToken, process.env[config.get('jwt.env_secret')]); // 2 арг - секьюрити ключ
            const payload = jwt.verify(accessToken, JWT_SECRET); // 2 арг - секьюрити ключ
            req.user = { username: payload.sub, roles: payload.roles }
        } catch (error) {
            
        }
    }
    next();
}

export default auth;