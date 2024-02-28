import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Quiz project",
  password: "123456",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
let global=[];

app.get("/",async(req,res)=>{
    res.render("login.ejs");
})

app.post("/signup", async(req, res) => {
  try{
    const result = await db.query("INSERT INTO users(name,email,password,user_type) values($1,$2,$3,$4);",
    [req.body.name,req.body.email,req.body.password,req.body.type]);
    if (req.body.type === "Quiz-creator"){
      const result1= await db.query("SELECT * FROM users where email=$1 AND password=$2;",[req.body.email,req.body.password])
      global.push(result1.rows[0].id);
      res.redirect("/creatorhome");
    }
    else{
      res.redirect("/home");
    }
  }
  catch(err){
    console.log(err);
    if (req.body.type!=='Quiz-creator' || req.body.type!=='Quiz-taker'){
      res.render("login.ejs",{
        error4: "Enter the correct role"
      });
    }
    else{
      res.render("login.ejs",{
        error3: "Should be between 8 and 15 characters"
      });
    }
  }
});

let currentCreatorId=1;
let globe;

app.post("/signin", async(req, res) => {
  try {
    globe = await db.query("SELECT * from users where email=($1) AND password=($2);",
    [req.body.email,req.body.password]);
    if (globe.rows.length===0){
      res.render("login.ejs",{
        error:"Wrong email or password. Try again"
      })
    }
    else{
      if (globe.rows[0].user_type==='Quiz-creator'){
        global.push(globe.rows[0].id);
        currentCreatorId = globe.rows[0].id;
        res.redirect("/creatorhome");
      }
      else{
        currentCreatorId = globe.rows[0].id;
        res.redirect("/home");
      }
    }
  } 
  catch (err) {
    console.log(err);
  }
});

app.get("/creatorhome", async(req, res) => {
  const result = await db.query("SELECT * FROM quizzes WHERE creator_id=$1;",[currentCreatorId]);
  let quizTitle=[];
  for (let i=0;i<result.rows.length;i++){
    quizTitle.push(result.rows[i].title);
  }
  res.render("creatorhome.ejs",{
    numberOfQuizzes : result.rows.length,
    quizTitle : quizTitle
  })
})

// let questions=[];
// let quiz=[];
// let options,answer;
// let totalCorrect=0;
let options=[{opt:"Edit the option"},{opt:"Edit the option"},{opt:"Edit the option"},{opt:"Edit the option"}];
let answer,oldAnswer;
let currentQuizId = 100;
// let currentQuestion=0;
// async function optionsDisplay(){
//   const result = await db.query("SELECT * FROM QUESTIONS WHERE quiz_id=$1;",[currentQuizId]);

// }
let qno = 1;
app.get("/create", async(req, res) => {
  const result = await db.query("SELECT * FROM questions WHERE quiz_id=$1;",[currentQuizId])
  qno = result.rows.length + 1;
  res.render("create.ejs",{
    options:options,
    qno:qno
  })
})

app.post("/next", async(req, res) => {
  try{
    let question = req.body.newItem;
    let x="";
    for (let i=0; i<options.length;i++){
      x = x.concat(options[i].opt);
      if (i!==3){
        x = x.concat(",");
      }
    }
      const result = await db.query("INSERT INTO questions(quiz_id,question,answer,options) values($1,$2,$3,$4);",
      [currentQuizId,question,answer,x]);
      options=[{opt:"Edit the option"},{opt:"Edit the option"},{opt:"Edit the option"},{opt:"Edit the option"}];
      res.redirect("/create")
  }
  catch(err){
    console.log(err);
  }
})

app.post("/edit", async(req, res) => {
  const updatedOption = req.body.updatedOption;
  const index = req.body.index;
  options[index].opt = updatedOption;
  res.redirect("/create");
})

app.post("/answer", async(req, res) => {
  answer = req.body.answer;
  oldAnswer = answer;
})

app.get("/finish", async(req, res) => {
  res.render("quiz title.ejs")
})

app.post("/title", async(req, res) => {
  const title = req.body.title;
  try{
    if(title!=""){
      const result = await db.query("INSERT INTO quizzes(title,creator_id) values($1,$2) RETURNING *;",[title, currentCreatorId]);
      const quizId = result.rows[0].id;
      const data = await db.query("UPDATE questions set quiz_id=$1 WHERE quiz_id=$2;",[quizId,currentQuizId]);
      //res.render()
    }
    else if (title==""){
      res.render("quiz title.ejs",{
        error: "Title can't be empty"
      })
    }
  } 
  catch(err){
    console.log(err);
    res.redirect("/title", {
      error: "Title already exists. Please enter a new title"
    })
  }
})

app.get("/home", async(req, res) => {
  const result = await db.query("SELECT * FROM quizzes;");
  const length = result.rows.length;
  let quizTitle = [];
  for (let i=0;i<length;i++){
    quizTitle.push(result.rows[i].title);
  }
  res.render("home.ejs",{
    quizTitle : quizTitle,
    numberOfQuizzes : length
  })
})
let data;
let currentQuestion, currentAnswer, currentOptions = [];
let z = 0;
let length = 0;

app.post("/test", async(req, res) => {
  const title = req.body.title;
  const result = await db.query("SELECT * FROM quizzes WHERE title=$1",[title]);
  const quiz_id = result.rows[0].id;
  data = await db.query("SELECT * FROM questions WHERE quiz_id=$1;",[quiz_id]);
  length = data.rows.length;
  currentAnswer = data.rows[z].answer;
  res.render("test.ejs",{
    question : data.rows[z].question,
    answer : data.rows[z].answer,
    options : data.rows[z].options.split(","),
    qno : z + 1
  })
})

async function nextQuestion() {
  z++;
  currentQuestion = data.rows[z].question;
  currentAnswer = data.rows[z].answer;
  currentOptions = data.rows[z].options.split(",");
}
let score = 0;
app.post("/chosenOption", async(req, res) => {
  const chosenOption = req.body.chosenOption;
  if (chosenOption===currentAnswer){
    score++;
  }
})

app.get("/nextque", async(req, res) => {
  try {
      await nextQuestion();
      res.render("test.ejs",{
        question : currentQuestion,
        answer : currentAnswer,
        options : currentOptions,
        qno : z + 1
      })
  } catch (error) {
    console.log(error);
    res.render("result.ejs",{
      score : score,
      length : length
    });
  }
})

app.get("/backtohome", async(req, res) => {
  const result = await db.query("SELECT * FROM users where id=$1;",[currentCreatorId]);
  const role = result.rows[0].user_type
  if (role==='Quiz-creator'){
    res.redirect("/creatorhome");
  }
  else{
    res.redirect("/home");
  }
})

app.get("/signout", async(req, res) => {
  res.redirect("/");
})
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
