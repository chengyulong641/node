const jwt =require("jsonwebtoken")
const express =require('express')    //引入express
const connection =require("../mysql.js");
const bodyParser = require('body-parser');

const app = express()
const port = 8000  //（监听的端口号）
//解析,用req.body获取post参数
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//设置跨域访问
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

// 接口状态返回
const  status=(code,msg,data=null)=>{
    return {code,msg,data}
}

app.use(function (req, res, next) {
    if (req.url != '/api/login' && req.url != '/api/register') {
        // 如果考验通过就next，否则就返回登陆信息不正确
        verifyToken(req, res, next);
    } else {
        next();
    }
})
const verifyToken=(req, res, next)=> {
    const token = req.headers.token; // 从请求头中获取 token
    if (!token) {
        res.send(status(401,"未登录或登录过期！"));
        return;
    }
    jwt.verify(token, 'token', { expiresIn: "1h" },(err, decoded) => {
        if (err) {
            res.send(status(401,"登录过期，请重新登录！！"));
            return;
        }else{
            // req.userId = decoded.userId; // 将解码后的用户信息存储在请求对象中，以便后续接口使用
            next();
        }
    });
}

// 登录接口
app.post("/api/login", (req, res) => {
    var username = req.body.username
    var password = req.body.password
    if (!username || !password) {
        res.send(status(400,'用户名与密码为必传参数'))
        return
    }
    const sqlStr = "select * from user_info WHERE username=? AND password=?"
    connection.query(sqlStr, [username, password], (err, result) => {
        if (err) throw err
        console.log(result)
        if (result.length > 0) {
            // 生成token
            var token = jwt.sign(
                {
                    username: result[0].username,
                    password: result[0].password,

                },
                "token",
                { expiresIn: "1h" },
            )
            console.log(token)
            res.send(status(200,'登录成功',token))
            // 如果没有登录成功，则返回登录失败
        } else {
            // 判断token
            if (req.headers.authorization == undefined || req.headers.authorization == null) {
                if (req.headers.authorization) {
                    var token = req.headers.authorization.split(" ")[1] // 获取token
                }
                jwt.verify(token, "secret", (err, decode) => {
                    if (err) {
                        res.send({ code: 1, msg: "账号或密码错误" })
                    }
                })
            }
        }
    })
})

// 注册接口
app.post("/api/register", (req, res) => {
    var username = req.body.username
    var password = req.body.password
    if (!username || !password) {
        res.send({
            code: 400,
            msg: "用户名与密码为必传参数...",
        })
        return
    }
    if (username && password) {
        const result = `SELECT * FROM user WHERE username = '${username}'`
        connection.query(result, [username], (err, results) => {
            if (err) throw err
            if (results.length >= 1) {
                // 如果有相同用户名 注册失败
                res.send(status(400, "注册失败，用户名重复"))
            } else {
                const sqlStr = "insert into user(userName,passWord) values(?,?)"
                connection.query(sqlStr, [username, password], (err, results) => {
                    if (err) throw err
                    if (results.affectedRows === 1) {
                        res.send(status( 200, "注册成功" ))
                    } else {
                        res.send(status( 400, "注册失败" ))
                    }
                })
            }
        })
    }
})
// 路由二级---转化成树形结构
const listToTreeData=(list, rootValue)=> {
    var arr = []
    list.forEach(item => {
        if (item.pid === rootValue) {
            const children = listToTreeData(list, item.id)
            // 找到之后 就要去找 item 下面有没有子节点
            if (children.length) {
                // 如果children的长度大于0 说明找到了子节点
                item.children = children
            }
            arr.push(item) // 将内容加入到数组中
        }
    })
    return arr
}
//列表
app.get('/api/menus_list', function (req, res) {
    var sql = 'SELECT * FROM menus_list';
    connection.query(sql, function (err, result) {
        if (err) {
            console.log('[SELECT ERROR] - ', err.message);
            return;
        }
        result = result.map(it => ({
            id: it.id,
            pid: it.pid,
            path: it.path,
            name: it.name,
            component: it.component,
            meta: {
                icon: it.icon,
                title: it.title,
                isKeepAlive: !!it.isKeepAlive
            }
        }));

        let data = listToTreeData(result, 0);

        res.json(status(200, "获取菜单列表成功", data));

    });
});

//新增插入
app.get('/api/menus_list_add', function (req, res) {
    var addSql = 'INSERT INTO menus_list(name) VALUES("aaaa")';
    var addSqlParams = req.query.name;
    connection.query(addSql, addSqlParams, function (err, result) {
        if (err) {
            console.log('[INSERT ERROR] - ', err.message);
            return;
        }
        res.json({ success: '添加成功' })
    });
});

//修改
app.get('/api/menus_list_edit', function (req, res) {
    var modSql = 'UPDATE hello SET name = ? WHERE Id = ?';
    var modSqlParams = [req.query.edit, req.query.id];
    //改
    connection.query(modSql, modSqlParams, function (err, result) {
        if (err) {
            console.log('[UPDATE ERROR] - ', err.message);
            return;
        }
        res.json({ success: '修改成功' })
    });
});

//删除
app.get('/list_del', function (req, res) {
    var delSql = "DELETE FROM hello WHERE Id = ?"
    //删
    var delid = [req.query.id];
    connection.query(delSql, delid, function (err, result) {
        if (err) {
            console.log('[DELETE ERROR] - ', err.message);
            return;
        }
        res.json({ success: '删除成功' })
    });
    // console.log("主页 POST 请求");
    // res.send('Hello POST');
})


//post接口 获取参数req.body
app.post('/demo', function (req, res) {
    // console.log("主页 POST 请求");
    var delSql = "DELETE FROM hello WHERE Id = ?"
    var delid = [req.body.id];
    // console.log(req.body.id)
    connection.query(delSql, delid, function (err, result) {
        if (err) {
            console.log('[SELECT ERROR] - ', err.message);
            return;
        }
        res.json(result)
    });
})

//配置服务端口
module.exports= app

