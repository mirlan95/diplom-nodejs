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

// default route
app.get('/', function (req, res) {
    return res.send({ error: true, message: 'hello',miki:'s' })
});
 //get themes from tester_exams table
 app.get('/themes', function(req,res){
 	mc.query('select * from tester_exams', function(error, results, fields){
 		if(error) throw error;
 		return res.send({error : false ,data: results, message : 'themes list'});
 	});
 });
 app.get('/ques', function(req, res){
 	var username = req.params.username;
 	var password = req.params.password;
 	var exam_id = req.params.exam_id;	
 	
 	console.log(req.body.password);
 		console.log(req.params.username);
 	if(!exam_id || !username || !password){    
 		
 		return res.status(400).send({ error:true, message: 'Please provide task'});
    }

    mc.query('select student_id from tester_students where number=?',username,function(error,result,fields){
    	if(error)throw error;
    	var student_id = result[0].student_id;
    });

 	mc.query('SELECT password from tester_exampasswords where exam_id = ? AND student_id = (SELECT student_id from tester_students where number= ?)', [exam_id,username], function(error, results, fields){
 		if(error)throw error;
 		console.log(results[0].password);
 		console.log(password);
 		if(results[0].password==password){
 			mc.query('select result from tester_examresults where exam_id = ? AND student_id = ?',[exam_id,student_id],function(error,result,fields){
 				if(error)throw error;
 				if(!result[0].result){
 					return res.send({success:false});
 				}
 				else {
 					return res.send({miki:miki});
 				}
 			});
 		}
 		else return res.send({miki:results});
 	});

 	//var password = mc.query('select password from tester_exampasswords where student_id = ?', student_id);
 	//console.log(password);
 	//var result = mc.query('select result from tester_examresults where exam_id = ? && student_id = ?'
 	
 });
// port must be set to 8080 because incoming http requests are routed from port 80 to port 8080
app.listen(8080, function () {
    console.log('Node app is running on port 8080');
    //console.log(studentId);
});