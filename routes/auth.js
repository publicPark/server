const router = require('express').Router();
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { registerValidation, loginValidation } = require('../modules/validation');

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
  const accessToken = jwt.sign({ _id: user.id }, process.env.TOKEN_SECRET);
  res.header('auth-token', accessToken).send(accessToken);
});

module.exports = router;