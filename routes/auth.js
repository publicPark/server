const router = require('express').Router();
const User = require('../model/User');
const Token = require('../model/Token');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { registerValidation, loginValidation } = require('../modules/validation');
const { generateAccessToken, generateRefreshToken } = require('../middleware/generateToken');

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // validate
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // 이메일 중복 확인
  const emailExist = await User.findOne({ email });
  if (emailExist) return res.status(400).send('Email already exists');
  
  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  // create a new user
  const user = new User({
    name,
    email,
    password: hashPassword,
  });
  try {
    await user.save();
    res.send({user: user._id});
  } catch (err) {
    res.status(400).send(err);
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // chcking if the email exists
  const user = await User.findOne({ email });
  if (!user) return res.status(400).send('Email or Password is wrong');
  // 이렇게 하는 이유: 이메일이 있어요 없어요 라고 알려주면 내가 가입했는지 다른 사람들도 알 수 있으니까 좀 그렇지

  // password is correct
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).send('Invalid password');
  // ㅋㅋㅋ 근데 이렇게 한건 뭐가 틀렸는지 내가 지금 알아야 돼. 원래 똑같이 해야 돼

  // create and assign a token
  const accessToken = generateAccessToken({id:user._id});
  
  // 이미 리프레쉬 토큰이 디비에 있으면 재발급 하지마
  const refreshTokenAlready = await Token.findOne({ userId: user._id });
  if (!refreshTokenAlready) {
    // 없으면 발급
    const refreshToken = generateRefreshToken({ id: user._id });
    const token = new Token(
      {
        userId: user._id,
        token: refreshToken
      }
    );
    await token.save();
    res.json({ accessToken, refreshToken });
  } else {
    // 있으면 그대로
    console.log("이미 로그인 한 사람이 또 로그인", user._id);
    res.json({ accessToken, refreshToken: refreshTokenAlready.token });
  }
});

// REFRESH
router.post('/token', async (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null) return res.sendStatus(401);
  const refreshTokenAlready = await Token.findOne({ token: refreshToken });
  if (!refreshTokenAlready) {
    console.log("list has not the refreshToken");
    return res.sendStatus(403);
  }

  try {
    const user = await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const accessToken = generateAccessToken({id:user._id});
    res.send(accessToken);
  } catch (err) {
    return res.sendStatus(403);
  }
});

router.delete('/logout', async (req, res) => {
  try {
    const deletedToken = await Token.deleteOne({ token: req.body.token });
    if (deletedToken.deletedCount>0) {
      console.log("del", deletedToken);
      res.sendStatus(204);
    } else {
      res.sendStatus(400); // 삭제할 것이 없는데? bad request
    }
  } catch (err) {
    res.status(500).send(err);
  }
});
 
module.exports = router;

/* 테스트)
로그인 > 토큰 두개 발급
다시 로그인 > 엑세스 토큰만 발급, 리프레쉬 토큰은 그대로
내 정보 확인
내 정보 확인(토큰 만료)
리프레쉬 > 엑세스 토큰 발급
내 정보 확인
로그아웃 > 리프레쉬 토큰 삭제
리프레쉬 > 불가
로그인 > 토큰 두개 발급
*/