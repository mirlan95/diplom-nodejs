const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
 
  //connection configurations
const mc = mysql.createConnection({
    host: 'localhost',
    user: 'dbadmin',
    password: '123456',
    database: 'diplom'
});
//connect to database 
//mc.connect();

// default route
app.get('/', function (req, res) {
    return res.send({ error: true, message: 'hello' })
});
 //get themes from tester_exams table
app.get('/exams', function(req,res){
 	mc.query('select * from tester_exams', function(error, results, fields){
 	      if(error) return res.status(400).send({ error:true, message: 'error'});;
 	      return res.send(results);
 	});
 });
 
app.get('/questions', function(req, res){
    var exam_id = req.query.exam_id;	
    var themes = [];
    console.log(exam_id);
    mc.query('select theme_id, simple_count, normal_count, hard_count from tester_examthemes where exam_id  = ? ', exam_id,function(error, result, fields) {
        if (error){
            return res.status(400).send({error: true, message: 'error_simple_count'});
        }   
        var query = "";
        var attrs =  [];
        for (var i = 0; i < result.length; i++) {
            var levels = [result[i].simple_count, result[i].normal_count, result[i].hard_count]
                for (var j = 0; j < 3; j++){
                    if (i > 0 || j > 0) query += " UNION";
                    query += " (SELECT * FROM tester_questions WHERE theme_id = ? AND level = " + (j) + " ORDER BY RAND() LIMIT ?)";                        attrs.push(result[i].theme_id)
                    attrs.push(levels[j])
                }
        }
        mc.query(query, attrs, function(error, result, fields){
            if (error || result == undefined) return res.status(400).send({error: true, message: error});
                return res.send(result);
            });
    });

});        
app.post('/login',function(req,res){
    var username = req.body.username;
 	var password = req.body.password;
    var exam_id = req.body.exam_id;
    var is_user = false;
    //console.log(username,exam_id);
    mc.query('select number from tester_students',function(err,result){  
        if(err) return res.sendStatus(400);
        for(var i = 0; i < result.length; i++){ 
            if(username == result[i].number){
                var is_user = true;
            }
        }
        if(is_user){
            var is_exam = false;
            mc.query('select exam_id from tester_exams',function(err,r){  
                if(err) return res.status(400).send({ error:true, message: 'error_exam'});
                for(var i = 0; i < r.length; i++){ 
                    if(exam_id == r[i].exam_id){
                        var is_exam = true;
                    }
                }
                console.log(is_user);
                if(is_exam){
                    var query_password = 'SELECT password from tester_exampasswords where exam_id = ? AND student_id = (SELECT student_id from tester_students where number= ?)';
                    mc.query(query_password, [exam_id,username], function(error, results, fields){
                        console.log(results);
                        if(error || results.length == 0){
                            return res.status(400).send({ error:true, message: 'error_password'});
                        }
                        else if(results[0].password == password){
                                var q = 'select result from tester_examresults where exam_id = ? AND student_id = (SELECT student_id from tester_students where number= ?)';
                                mc.query(q,[exam_id,username],function(error,result){
                                //  console.log(result[0].result); 
                                    if(error || result[0].result == undefined)return res.status(400).send({ error:true, message: 'error_result'});
                                    //console.log(result[0].result);
                                    if(!result[0].result) return res.status(200).send({ error:false, message: 'success!'});
                                });
                            }
                        else {
                            return res.status(400).send({ error:true, message: 'error_pass'});
                        }
                        });
                }else {
                    return res.status(400).send({ error:true, message: 'error_isexam'});  
                }
            });
            
        }else {
            return res.status(400).send({ error:true, message: 'error_isuser'});
        }
    });
});
app.get('/answers', function(req,res){
    var arr = [];
    arr = req.query.arr.slice();
    mc.query('select * from tester_answers where question_id IN (' + arr.join() + ')',function(error, result, fields){

    if(error)return res.status(400).send({ error:true, message: 'error'});;
    return res.send(result);     
    });
   
 });
app.post("/result",function(req, res){
    var result = req.body.result;
    var student_id = req.body.student_id;
    var exam_id = req.body.exam_id;
    
    //console.log(result);
    mc.query('UPDATE tester_examresults SET result = ? WHERE student_id = ? AND exam_id = ?',[result,student_id,exam_id], function(error,result,fields){
        if(error)return res.status(400).send({error:true, message: 'error'});
        return res.status(200).send({message: 'success!'});
    });
});

// port must be set to 8080 because incoming http requests are routed from port 80 to port 8080
app.listen(8080, function () {
    console.log('Node app is running on port 8080');
    //console.log(studentId);
});