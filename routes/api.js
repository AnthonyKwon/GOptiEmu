const createError = require('http-errors');
const express = require('express');
const req = require('express/lib/request');
const app = require('../app');
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

// create parameter type definiton object
function getParamType(type) {
    const typeDefObj = { jsType: undefined, shownType: type };
    switch(type) {
        case 'int':
            typeDefObj.jsType = "number";
            typeDefObj.isInt = true;
            break;
        case 'double':
            typeDefObj.jsType = "number";
            typeDefObj.isInt = false;
            break;
    }
    return typeDefObj;
}
// check if parameter is correct
function verifyParam(query, ...queryList) {
    // it seems like server loosely checks about params, or actually not checks it (only check about syntax)
    const queryMap = new Map();
    for (let i = 0; i < queryList.length-1; i+=2) {
        queryMap.set(queryList[i], getParamType(queryList[i+1]));
    }

    for (const [e, etype] of queryMap) {
        if (!query[e]) {
            // specified parameter is missing
            throw new Error(`QueryRequired:${e}:${etype.shownType}`);
        }

        if (etype.jsType === "number" && !Number(query[e])) {
            // parameter type is invalid (non-number for an number)
            throw new Error(`InvalidType:${e}:${etype.shownType}`);
        }

        if (etype.jsType === "number" && etype.isInt !== Number.isInteger(Number(query[e]))) {
            // parameter type is invalid (wrong integer/double type)
            throw new Error(`InvalidType:${e}:${etype.shownType}`);
        }
    }
}

// check if user-agent data is correct
function verifyUA(userAgent) {
    /**
     * gms_version: version number("major.minor" formatted) for the Google Play Service app (ex: 21.21)
     * gos_version: version code for the GOS app (ex: 350200018)
     * device_name: codename of the device (ex: herolte)
     * model_name: Model of the device (ex: SM-G930F)
     * al: API level of the device (ex: 23)
     * version_r: Release version of android (ex: 6.0.1)
     * version_i: Incremental version number (ex: G930FXXU8EUE1)
     * uuid: UUID (excluding dash) for the target device (ex: b52aa00c534648e28dd8a4981cf308f8)
     * 
     * it seems like server does not check data is vaild, only checks data is available 
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

// return device group based on the request data
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

        // TODO: replace dummy codes to actual implmention
        // ex: star_lsi - starlte/starlteks, c1s - c1s
        res.setHeader('Content-Type', 'application/json');
        res.status(200);
        res.end(JSON.stringify({ device_group_name: deviceId })); // dummy - return deviceId instead of device group for now 
    } catch(err) {
        console.error(err.stack);
    }
});

// return device policy based on the request data
router.get('/gos/devices/:deviceId/policy', function(req, res, next) {
    // parse User-Agent which contains information about device
    const deviceId = req.params.deviceId; // codename of the device
    const userAgent = UAStringtoObject(req.headers['user-agent']); // user-agent object
    const result = verifyUA(userAgent); // check if user-agent data is correct
    if (result) {
        // some element in user-agent data is missing, return error
        sendError(res, 400, `Missing 'User-Agent' header parameter: '${result}'`);
        return;
    }

    // TODO: replace dummy codes to actual implmention
    try {
        verifyParam(req.query, 'os_sdk_version', 'int', 'gms_version', 'double', 'gos_version', 'int');
    } catch(err) {
        // if query test failed, return error from result
        if(err.message.includes("QueryRequired")) {
            const queryName = err.message.split(':')[1];
            const queryType = err.message.split(':')[2];
            sendError(res, 400, `Required ${queryType} parameter '${queryName}' is not present`);
            return;
        } else if (err.message.includes("InvalidType")) {
            sendError(res, 400, 'Type mismatch.');
            return;
        } else {
            console.error(err);
        }
    }

    // send raw policy response as response (must be modified properly later)
    const policyRule = require('../response/policy.json');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(policyRule));
});

router.get('/packages', function(req, res, next) {
    // parse User-Agent which contains information about device
    const userAgent = UAStringtoObject(req.headers['user-agent']); // user-agent object
    const result = verifyUA(userAgent); // check if user-agent data is correct
    if (result) {
        // some element in user-agent data is missing, return error
        sendError(res, 400, `Missing 'User-Agent' header parameter: '${result}'`);
        return;
    }

    // TODO: replace dummy codes to actual implmention
    // if server doesn't know about an app, then "undefined" returns as a result
    // if server has app in the database, but it's not a game, then "non-game" returns as a result
    // if server has app in the database, and it's a game, then "game" returns as a result
    if (!req.query['package_names']) {
        // client does not send app list. return error
        sendError(res, 400, `Required set parameter 'package_names' is not present`);
        return;
    }
    const apps = req.query['package_names'].includes(',') ? req.query['package_names'].split(',') : [req.query['package_names']];
    
    // create dummy response (must be replaced as correct implmention)
    const response = [];
    for (a of apps) {
        response.push({ pkg_name: a, pkg_type: "non-game" });
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response));
});

// handle 404 error 
router.use(function(req, res, next) {
    sendError(res, 404, "No matching handler");
});

module.exports = router;
