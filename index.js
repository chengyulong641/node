const express =require("express");
const user = require("./router/index.js")
const app = express()
var router = express.Router();
router.use('/sys', user);
app.use(router)
const index= app.listen(3000, function () {
    var host = index.address().address;
    var port = index.address().port;
    // console.log('Example app listening at http://%s:%s', host, port);
    console.log("项目启动成功")
})

