const mysql= require('mysql')

//连接数据库
const connection = mysql.createConnection({
    host: 'localhost',//主机
    user: 'root',//mysql认证的用户名
    password: '1234',//mysql用户密码
    database: 'test',//数据库名
    port: '3306'//端口号
});

connection.connect(function(err){
    if(err){
        console.log("数据库连接失败")
    }else{
        // res.write("数据库连接成功");
        // res.end();
        console.log("数据库连接成功")
    }
});
module.exports=connection
