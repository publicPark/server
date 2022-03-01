const router = require('express').Router();
const verify = require('../middleware/verifyToken');

router.get('/my', verify, (req, res) => {
  // res.send(req.user);

  res.json({
    data: 'my information because you are logged in'
  });
});

module.exports = router;