const router = require('express').Router();
const User = require('../model/User');

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const user = new User({
    name,
    email,
    password,
  });
  try {
    const savedUser = await user.save()
    res.send(savedUser);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post('/login');

module.exports = router;