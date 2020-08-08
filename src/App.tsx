import React, { useState, useEffect } from 'react';
import logo from './logo_white.svg';
import './App.css';

import { Course } from './_types/Course';
import { TextField, Container, ThemeProvider, createMuiTheme, InputBase, Paper, makeStyles, Collapse, FormControlLabel, Switch, IconButton, Divider, FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Box from '@material-ui/core/Box';
import CourseCard from './components/CourseCard';
import Fuse from 'fuse.js'
import { relevancyAlgorithm } from './util/relevancyAlgorithm';
import { TfIdf } from 'natural';
import natural from 'natural'
import bm25 from 'wink-bm25-text-search';
import nlp from 'wink-nlp-utils'

import useDebounce from './hooks/useDebounce';

// @ts-ignore
import Worker from './util/algorithm.worker';
import { constants } from 'http2';

// take the search query string and find all courses whose description, course title, or course name contain that string 
// for every course in allCourses, map a relevancy score to another array, then return an array 

const worker = new Worker();
const tfidf = new TfIdf();
const engine = bm25();

const pipe = [
  nlp.string.lowerCase,
  nlp.string.tokenize0,
  // nlp.tokens.stem contains false positive -> anime -> animal
];

engine.defineConfig( { fldWeights: { name: 3, title: 2, description: 1 } } );
engine.definePrepTasks( pipe );


const theme = createMuiTheme({
  typography: {
  },
});

const useStyles = makeStyles((theme) => ({
  root: {
  },
  searchBar: {
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginLeft: '5px'
  },
  iconButton: {
    padding: 10,
  },
  formControl: {
    alignItems: 'left',
  }
}));

function App() {
  const classes = useStyles();

  const [allCourses, setAllCourses] = useState<Array<Course>>([]);
  const [searchedCourses, setSearchedCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [advancedOptions, setAdvancedOptions] = useState<boolean>(false);
  const [wordSet, setWordSet] = useState<Set<string>>(new Set<string>()); 
  const [engineType, setEngineType] = useState<string>("bm25"); 

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
    fetch('https://api.ubccourses.com/course')
      .then(result => result.json())
      .then(data => {
        console.log(data);
        setAllCourses(data.courses);

        data.courses.forEach((course: Course, i: number) => {  // this grabs every course description 
          tfidf.addDocument(course.description); 
          engine.addDoc(course, i);
        })
        engine.consolidate();

        let newWordSet = new Set<string>();

        var tokenizer = new natural.WordTokenizer();
        data.courses.forEach((course: Course) => {  
          let words = tokenizer.tokenize(course.description); 
          words = words.concat(tokenizer.tokenize(course.title)) ;
          words = words.concat(tokenizer.tokenize(course.name)); 
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
    let engineString;

    switch(engineType) {
      case "tfidf":
        engineString = JSON.stringify(tfidf);
        break;
      case "bm25":
      default:
        engineString = engine.exportJSON();
    }
    
    worker.postMessage({
      searchQuery, allCourses, engineType, engineString,  wordSet
    });
    console.timeEnd('worker start')
  }, [debouncedSearchTerm, engineType, allCourses]);

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
              <Box className={classes.searchBar}>
                <SearchIcon color="primary" />
                <InputBase
                  className={classes.input}
                  fullWidth
                  value={searchQuery}
                  onChange={(e)=>setSearchQuery(e.target.value)}
                  placeholder="Search Course"
                  inputProps={{ 'aria-label': 'search course' }}
                  />
                  <IconButton className={classes.iconButton} onClick={() => setAdvancedOptions((prev) => !prev)} color="primary">
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                <Collapse in={advancedOptions}>
                  <Divider />
                  <Box p={1}>
                    <FormControl
                      className={classes.formControl}
                    >
                      <InputLabel id="search engine">Search Engine</InputLabel>
                      <Select
                        labelId="search engine"
                        id="search engine"
                        value={engineType}
                        onChange={(e) => setEngineType(e.target.value as string)}
                      >
                        <MenuItem value="bm25">bm25 (default, recommended)</MenuItem>
                        <MenuItem value="tfidf">tfidf</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Collapse>
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