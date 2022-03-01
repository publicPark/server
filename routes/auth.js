const router = require('express').Router();
const User = require('../model/User');
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
    const savedUser = await user.save();
    res.send({user: user._id});
  } catch (err) {
    res.status(400).send(err);
  }
});

let refreshTokens = []; // test

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
  const refreshToken = generateRefreshToken({ id: user._id });
  
  // 실제로는 db에 토큰, user id 저장하자
  refreshTokens.push(refreshToken);

  // 이미 있던 중복 과거 리프레쉬 토큰 지워

  res.json({ accessToken, refreshToken });
});

// REFRESH
router.post('/token', async (req, res) => {
  const refreshToken = req.body.token;
  if(refreshToken == null) return res.sendStatus(401);
  if (!refreshTokens.includes(refreshToken)) { // 이게 배열도 됐어?
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

router.delete('/logout', (req, res) => {
  refreshTokens = refreshTokens.filter(token => token !== req.body.token); // 리스트에서 filter로 이렇게 빼.. WOW..
  res.sendStatus(204);
});

module.exports = router;