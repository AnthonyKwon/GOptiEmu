const createError = require('http-errors');
const express = require('express');
const router = express.Router();

// send error to client
function sendError(res, code, message) {
    const jsonContent = {
        code,
        message,
        version: "1.0"
    };
    res.setHeader('Content-Type', 'application/json');
    res.status(code);
    res.end(JSON.stringify(jsonContent));
}

// convert User-Agent string to Object
function UAStringtoObject(uaString) {
    const uaObject = {};
    const rawDevInfo = uaString.split('(')[1].split(')')[0].split(';');
    uaObject['User-Agent'] = uaString.split('(')[0].trim(); // User-Agent
    for (e of rawDevInfo) {
        try {
            const key = e.split(':')[0].trim();
            const value = e.split(':')[1].trim();
            uaObject[key] = value;
        } catch(err) {
            // Wrongly formatted UA string
            console.error(err);
        }
    }
    return uaObject;
}

// check if user-agent data is correct
function verifyUA(userAgent) {
    /**
     * gms_version: version of the Google Play Service app
     * gos_version: version of the GOS app
     * device_name: codename of the device (ex: herolte)
     * model_name: Model of the device (ex: SM-G930F)
     * al: API level of the device (ex: 23)
     * version_r: Release version of android (ex: 6.0.1)
     * version_i: Incremental version number (ex: G930FXXU8EUE1)
     * uuid: UUID of the target device
     * 
     * TODO: write description of version_l
     * TODO: check how UUID is generated and verified
     */
    const dataList = ['gms_version', 'gos_version', 'device_name', 'model_name', 'al', 'version_r', 'version_i', 'uuid'];
    // check if every data in the datalist available
    // return name of the first unavailable data 
    for (data of dataList) {
        if (!userAgent[data]) {
            return data;
        }
    }
    return; // return nothing when passed
}

router.get('/devices/:deviceId', function(req, res, next) {
    try {
        // parse User-Agent which contains information about device
        const deviceId = req.params.deviceId; // codename of the device
        const userAgent = UAStringtoObject(req.headers['user-agent']); // user-agent object
        const result = verifyUA(userAgent); // check if user-agent data is correct

        if (result) {
            // some element in user-agent data is missing, return error
            sendError(res, 400, `Missing 'User-Agent' header parameter: '${result}'`);
            return;
        }

        // return device group base on the request data
        // TODO: return correct device group instead of returning device id
        // ex: star_lsi - starlte/starlteks, c1s - c1s
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        res.end(JSON.stringify({ device_group_name: deviceId }));
    } catch(err) {
        console.error(err.stack);
    }
});

// handle 404 error 
router.use(function(req, res, next) {
    sendError(res, 404, "No matching handler");
});

module.exports = router;
