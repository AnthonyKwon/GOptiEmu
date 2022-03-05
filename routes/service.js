const express = require('express');
const router = express.Router();
const defaultError = {
    code: "400000",
    message: "One or more parameters is incorrect"
};

function showParameterError(res) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(defaultError));
}

router.get('/gamemode/v3/packages/', function(req, res, next) {
    try {
        // parse GET parameters (type, device_name, package_names)
        const type = req.query['type']; // ex: type=install
        const device_name = req.query['device_name']; // ex: device_name=
        const package_names = req.query['package_names']; // ex: package_names=com.samsung.android.game.gos
        if (!type || !device_name || !package_names) throw new Error('Invalid Parameter');

        //TODO: parse headers

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: "Hello world! You're watching this as the code is incomplete." }));
    } catch(err) {
        console.error(err.stack);
        showParameterError(res);
    }
  });

module.exports = router;
