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

// take the search query string and find all courses whose description, course title, or course name contain that string 
// for every course in allCourses, map a relevancy score to another array, then return an array 

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
  const [seachedCourses, setSearchedCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fuse, setFuse] = useState<Fuse<string>>(new Fuse([], {}));
  const [tfidf, setTfidf] = useState<TfIdf>(new TfIdf());
  const [wordSet, setWordSet] = useState<Set<string>>(new Set<string>()); 
  
  useEffect(() => {
    // fetch all course data here and then call setAllCourses
    fetch('http://api.ubccourses.com/course')
      .then(result => result.json())
      .then(data => {
        console.log(data);
        setAllCourses(data.courses);

        let newTfidf = new TfIdf();
        data.courses.forEach((course: Course) => {  // this grabs every course description 
          newTfidf.addDocument(course.description); 
        })
        setTfidf(newTfidf);

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

        const fuseObj = new Fuse<string>(Array.from(newWordSet), {
          ignoreFieldNorm: true,
          includeScore: true
        });

        setFuse(fuseObj);
      })
  }, []);

  useEffect(() => {
    // console.time('search')
    // let result = fuse.search(searchQuery).splice(0, 10);
    // console.timeEnd('search')
    // console.log(result)
    // setSearchedCourses(result);
    console.time("asynchronous call that shouldn't block")
    let test = relevancyAlgorithm(searchQuery, allCourses, fuse, tfidf, wordSet)
      .then((data) => {

        let results = searchQuery === "" ? [] : data.splice(0, 10);
        setSearchedCourses(results);

      })
    console.log(test)
    console.timeEnd("asynchronous call that shouldn't block")

  }, [searchQuery]);
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
          {seachedCourses.map((result) => 
            <CourseCard course={result} />
          )}
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;