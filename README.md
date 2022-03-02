## 테스트용

### server (그냥 서빙하는 서버)
### authServer (jwt 토큰 인증 서버)
accessToken은 10분 만료, refreshToken은 DB에 저장   
   
.env
```
DB_URL=몽고디비유알엘
PORT=서버
AUTH_PORT=어쓰서버
ACCESS_TOKEN_SECRET=??
REFRESH_TOKEN_SECRET=??
```
   
```
npm run start
npm run start_auth
```