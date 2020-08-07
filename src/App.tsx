import React, { useState, useEffect } from 'react';
import logo from './logo_white.svg';
import './App.css';

import { Course } from './_types/Course';
import { TextField, Container, ThemeProvider, createMuiTheme, InputBase, Paper, makeStyles } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import Box from '@material-ui/core/Box';
import CourseCard from './components/CourseCard';
import Fuse from 'fuse.js'
import { relevancyAlgorithm } from './util/relevancyAlgorithm';
import { TfIdf } from 'natural';
import natural from 'natural';

import useDebounce from './hooks/useDebounce';

// @ts-ignore
import Worker from './util/algorithm.worker';

// take the search query string and find all courses whose description, course title, or course name contain that string 
// for every course in allCourses, map a relevancy score to another array, then return an array 

const worker = new Worker();
const tfidf = new TfIdf();

const theme = createMuiTheme({
  typography: {
  },
});

const useStyles = makeStyles((theme) => ({
  root: {
    padding: '8px 10px',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginLeft: '5px'
  },
}));

function App() {
  const classes = useStyles();

  const [allCourses, setAllCourses] = useState<Array<Course>>([]);
  const [searchedCourses, setSearchedCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [wordSet, setWordSet] = useState<Set<string>>(new Set<string>()); 

  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  
  useEffect(() => {
    // set up worker listener
    console.log(worker)
    worker.onmessage = function (event: MessageEvent) {
      console.timeEnd("recieved data from worker")
      console.log(event.data);
      setSearchedCourses(event.data.splice(0,10));
      console.log(searchedCourses)
    };

    // fetch all course data here and then call setAllCourses
    fetch('http://api.ubccourses.com/course')
      .then(result => result.json())
      .then(data => {
        console.log(data);
        setAllCourses(data.courses);

        data.courses.forEach((course: Course) => {  // this grabs every course description 
          tfidf.addDocument(course.description); 
        })

        let newWordSet = new Set<string>();

        var tokenizer = new natural.WordTokenizer();
        data.courses.forEach((course: Course) => {  
          let words = tokenizer.tokenize(course.description); 
          // console.log(words); 
          words.forEach((word: string) => {
            newWordSet.add(word.toLowerCase()); 
          })
        })
        setWordSet(newWordSet); 
      })
  }, []);

  useEffect(() => {
    // tell worker to run algorithm
    console.time("recieved data from worker")
    console.time('worker start')
    // worker.terminate();
    worker.postMessage({
      searchQuery, allCourses, tfidf: JSON.stringify(tfidf), wordSet
    });
    console.timeEnd('worker start')
  }, [debouncedSearchTerm]);

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Box className="gradient" pb={5}>
          <Container>
            <img src={logo} className="App-logo" alt="logo" />
            <p>
              <code>The best UBC course searcher</code>
            </p>
            <Paper elevation={7} className={classes.root}>
              <SearchIcon color="primary" />
              <InputBase
                className={classes.input}
                fullWidth
                value={searchQuery}
                onChange={(e)=>setSearchQuery(e.target.value)}
                placeholder="Search Course"
                inputProps={{ 'aria-label': 'search course' }}
                />
            </Paper>
          </Container>
        </Box>
        <Container>
          {searchedCourses.map((course) => 
            <CourseCard key={course.name} course={course} />
          )}
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;