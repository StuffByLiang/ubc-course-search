import React, { useState, useEffect } from 'react';
import logo from './logo_white.svg';
import './App.css';

import { Course } from './_types/Course';
import { TextField, Container, ThemeProvider, createMuiTheme, InputBase, Paper, makeStyles, Collapse, FormControlLabel, Switch, IconButton, Divider, FormControl, InputLabel, Select, MenuItem, LinearProgress, CircularProgress, Grid } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Box from '@material-ui/core/Box';
import CourseCard from './components/CourseCard';
import bm25 from 'wink-bm25-text-search';
import nlp from 'wink-nlp-utils'

import useDebounce from './hooks/useDebounce';

// @ts-ignore
import Worker from './util/algorithm.worker';

// // take the search query string and find all courses whose description, course title, or course name contain that string 
// // for every course in allCourses, map a relevancy score to another array, then return an array 

const worker = new Worker();

const engine = bm25();

const pipe = [
  nlp.string.lowerCase,
  nlp.string.tokenize0,
  // nlp.tokens.stem contains false positive -> anime -> animal
];

engine.defineConfig( { fldWeights: { name: 3, title: 2, description: 1 } } );
engine.definePrepTasks( pipe );


const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#8711c1"
    },
    secondary: {
      main: "#2472fc"
    }
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
  },
  loadingBar: {
    padding: '15px 0',
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
  const [searching, setSearching] = useState<boolean>(false);

  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  
  useEffect(() => {
    // set up worker listener
    console.log(worker)
    worker.onmessage = function (event: MessageEvent) {
      console.timeEnd("recieved data from worker")
      setSearchedCourses(event.data);
      console.log(searchedCourses);
      setSearching(false);
    };

    // fetch all course data here and then call setAllCourses
    fetch('https://api.ubccourses.com/course')
      .then(result => result.json())
      .then(data => {
        setAllCourses(data.courses);

        data.courses.forEach((course: Course, i: number) => {  // this grabs every course description 
          engine.addDoc(course, i);
        })
        engine.consolidate();

        let newWordSet = new Set<string>();

        data.courses.forEach((course: Course) => { 
          let words = nlp.string.tokenize0(course.description); 
          words = words.concat(nlp.string.tokenize0(course.title));
          words = words.concat(nlp.string.tokenize0(course.name)); 
          words.forEach((word: string) => {
            newWordSet.add(word.toLowerCase()); 
          })
        })
        console.log(newWordSet);
        setWordSet(newWordSet); 
      })
      .catch(err => {
        alert(err)
        console.error(err)
      })
  }, []);

  useEffect(() => {
    // tell worker to run algorithm
    if(debouncedSearchTerm !== "") {
      console.time("recieved data from worker")
      console.time('worker start')
      let engineString = engine.exportJSON();
      
      worker.postMessage({
        searchQuery, allCourses, engineString,  wordSet
      });
      setSearching(true);
      console.timeEnd('worker start')
    }
  }, [debouncedSearchTerm, engineType, allCourses]);

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Box className="gradient" pb={5}>
          <Container>
            <div className="center">
              <img src={logo} className="App-logo" alt="logo" />
              <p>
                <code>The best UBC course searcher. Try 'anime', or 'greek mythology'!</code>
              </p>
            </div>
            <Paper elevation={7} className={classes.root}>
              <Box className={classes.searchBar}>
                <SearchIcon color="secondary" />
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
                    <Grid container>
                      <Grid item xs={12} sm={6}>
                        <FormControl
                          fullWidth
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
                            {/* <MenuItem value="tfidf">tfidf</MenuItem> */}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
            </Paper>
          </Container>
        </Box>
        <Container className="center">
          {searching && <CircularProgress className={classes.loadingBar} color="primary" />}
          {searchedCourses.map((course) => 
            <CourseCard key={course.name} course={course} />
          )}
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;