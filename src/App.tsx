import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

import { Course } from './_types/Course';
import { TextField, Container } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import CourseCard from './components/CourseCard';


// take the search query string and find all courses whose description, course title, or course name contain that string 
// for every course in allCourses, map a relevancy score to another array, then return an array 

function algorithm(searchQuery: string, allCourses: Array<Course>): Array<Course> {

  return allCourses.map((course) => {
    return {
      score: getScore(course, searchQuery),
      course
    }
  }).sort(function(a, b) {
    return b.score - a.score;
  }).filter((data) => {
    return data.score != 0
  }).map((data) => {
    return data.course
  }).splice(0, 10);
  
  // allCourses -> empty
  // for every course, map its relevance into a map containing course and relevance score 
   
}

// assign a course a relevancy score from a given string 
// a course with no mention of the searchQuery will have a score of 0 
function getScore(c: Course, searchQuery: string) : number {
  let score: number = 0; 
  if(count(c.name, searchQuery) > 0) {
      score += 100;   // cocurses whose names include the search query will be the most relevant 
  } 
  // count occurances in course title
  score += count(c.description, searchQuery);
  score += count(c.title, searchQuery);
  return score; 
}

// returns # of occurances of sub_str from main_str 
function count(main_str: string, sub_str: string ): number {
  main_str += '';
  sub_str += '';

  if (sub_str.length <= 0) {
    return main_str.length + 1;
  }

  let subStr = sub_str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (main_str.match(new RegExp(subStr, 'gi')) || []).length;
}

function App() {
  const [allCourses, setAllCourses] = useState<Array<Course>>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  useEffect(() => {
    // fetch all course data here and then call setAllCourses
    fetch('http://api.ubccourses.com/course')
      .then(result => result.json())
      .then(data => {
        console.log(data);
        setAllCourses(data.courses);
      })
  }, []);

  let result = searchQuery ? algorithm(searchQuery, allCourses) : [];

  console.log(result)

  return (
    <div className="App">
      <Container>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          <code>The best UBC course searcher</code>
        </p>
        <TextField
          value={searchQuery}
          onChange={(e)=>setSearchQuery(e.target.value)}
          id="outlined-basic" 
          label="Search Course"
          variant="outlined" />
        {result.map((course) => 
          <CourseCard course={course} />
        )}
      </Container>
    </div>
  );
}

export default App;