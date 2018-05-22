const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
 
 // connection configurations
const mc = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'diplomka'
});
//connect to database 
mc.connect();
var question_id_array = [];
// default route
app.get('/', function (req, res) {
    return res.send({ error: true, message: 'hello' })
});
 //get themes from tester_exams table
app.get('/exams', function(req,res){
 	mc.query('select * from tester_exams', function(error, results, fields){
 	      if(error) return res.status(400).send({ error:true, message: 'error'});;
 	      return res.send({results});
 	});
 });
 
app.post('/questions', function(req, res){
    var username = req.body.username;
 	var password = req.body.password;
 	var exam_id = req.body.exam_id;	
 	var student_id;

        if(!exam_id || !username || !password){    
 		return res.status(400).send({ error:true, message: 'error'});
        }

    mc.query('select student_id from tester_students where number=?',username,function(error,result,fields){
        if(error)return res.status(400).send({ error:true, message: 'error'});;
        student_id = result[0].student_id;
    	
    });

 	mc.query('SELECT password from tester_exampasswords where exam_id = ? AND student_id = (SELECT student_id from tester_students where number= ?)', [exam_id,username], function(error, results, fields){
 		if(error)return res.status(400).send({ error:true, message: 'error'});;
 		
 		if(results!=0 && results[0].password==password){
 		
 			mc.query('select result from tester_examresults where exam_id = ? AND student_id = ?',[exam_id,student_id],function(error,result,fields){
 				if(error)return res.status(400).send({ error:true, message: 'error'});;
 				
 				if(result[0].result){//for testing <= if(!result[0].result)
                   // console.log(result[0].result);
                    var themes = [];
                    mc.query('select theme_id, simple_count, normal_count, hard_count from tester_examthemes where exam_id  = ? ', exam_id,function(error, result, fields) {
                            if (error) return res.status(400).send({error: true, message: error});
                            var query = "";
                            var attrs =  [];
                            
                            for (var i = 0; i < result.length; i++) {
                                //console.log(result);
                                var levels = [result[i].simple_count, result[i].normal_count, result[i].hard_count]
                                for (var j = 0; j < 3; j++){
                                    if (i > 0 || j > 0) query += " UNION";
                                    query += " (SELECT * FROM tester_questions WHERE theme_id = ? AND level = " + (j + 1) + " ORDER BY RAND() LIMIT ?)";
                                    attrs.push(result[i].theme_id)
                                    attrs.push(levels[j])
                                }
                            }
                            mc.query(query, attrs, function(error, result, fields){
                                if (error) return res.status(400).send({error: true, message: error});
                                return res.send({result});
                            });
                        }
                        );
 				}else {
 					return res.send({error:true,message: 'you are finished'});
 				}

 			});
 		}
 		
 	});
 	
 });
app.get('/answers', function(req,res){
    var arr = [];
    arr = req.query.arr.slice();
    mc.query('select * from tester_answers where question_id = ?',arr,function(error, result, fields){

    if(error)return res.status(400).send({ error:true, message: 'error'});;
    return res.send({result});     
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