CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(15) CHECK(LENGTH(password) BETWEEN 8 AND 15) NOT NULL,
  user_type VARCHAR(20) NOT NULL
);

CREATE TABLE quizzes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  creator_id INTEGER REFERENCES users(id) WHERE user_type='Quiz-creator'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

ALTER TABLE questions
ADD COLUMN options TEXT NOT NULL;

ALTER TABLE questions
DROP CONSTRAINT "questions_quiz_id_fkey";

ALTER TABLE quizzes 
ADD UNIQUE(title);

INSERT INTO users(name,email,password,user_type) values('xxx','xxx@gmail.com','87654321','Quiz-creator');

INSERT INTO quizzes(title,creator_id) values('Cricket-Quiz','1'); 

INSERT INTO questions(quiz_id,question,answer,options) values('1','Which team has never won the World Cup?','New Zealand','India,Pakistan,Sri Lanka,New Zealand');
