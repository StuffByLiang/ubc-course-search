import React, { useState, useEffect, useRef } from 'react';
import ReactGA from 'react-ga';
import logo from './logo_white.svg';
import './App.css';

import { Course } from './_types/';
import { Link, Container, ThemeProvider, createMuiTheme, InputBase, Paper, makeStyles, Collapse, IconButton, Divider, FormControl, InputLabel, Select, MenuItem, LinearProgress, CircularProgress, Grid } from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Box from '@material-ui/core/Box';
import SearchIcon from '@material-ui/icons/Search';
import SearchResults from './components/SearchResults';
import SearchSuggestionBox from './components/SearchSuggestionBox';
import AdvancedOptions from './components/AdvancedOptions';
import bm25 from 'wink-bm25-text-search';
import nlp from 'wink-nlp-utils'

import * as typeformEmbed from '@typeform/embed'


import useDebounce from './hooks/useDebounce';

// @ts-ignore
import Worker from './util/algorithm.worker';

import allCourses from './data/courses.json';
import allSubjects from './data/subjects.json';
import allSectionInfos from './data/sectionInfos.json';

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

const typeform = typeformEmbed.makePopup(
  'https://stuffbyliangtypeform.typeform.com/to/SABcahTa',
  {
  }
);

function App() {
  const classes = useStyles();
  console.log("hello")

  // const [allCourses, setAllCourses] = useState<Array<Course>>([]);
  const [searchedCourses, setSearchedCourses] = useState<Course[]>([]);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<Array<string>>([]);

  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [advancedOptions, setAdvancedOptions] = useState<boolean>(false);
  const [wordSet, setWordSet] = useState<Set<string>>(new Set<string>()); 
  const [courseLevelRange, setCourseLevelRange] = useState<[number, number]>([0, 9]); 
  const [subjectSetFilter, setSubjectSetFilter] = useState<Set<string>>(new Set<string>()); 
  const [suggestionsLimit, setSuggestionsLimit] = useState<number>(4); 
  const [displayLimit, setDisplayLimit] = useState<number>(10); 
  const [searching, setSearching] = useState<boolean>(false);

  const debouncedSearchTerm: string = useDebounce(searchQuery, 500);
  const debouncedDisplayLimit: number = useDebounce(displayLimit, 1000);
  
  useEffect(() => {
    // set up worker listener
    worker.onmessage = function (event: MessageEvent) {
      console.timeEnd("recieved data from worker")

      console.log(event.data);
      
      setSearchedCourses(event.data.result);
      setSuggestions(event.data.suggestions)
      setNotFound(event.data.notFound)
      setSearching(false);
    };

    allCourses.forEach((course: Course, i: number) => {  // this grabs every course description 
      engine.addDoc(course, i);
    });
    engine.consolidate();

    let newWordSet = new Set<string>();

    allCourses.forEach((course: Course) => { 
      let words = nlp.string.tokenize0(course.description); 
      words = words.concat(nlp.string.tokenize0(course.title));
      words = words.concat(nlp.string.tokenize0(course.name)); 
      words.forEach((word: string) => {
        newWordSet.add(word.toLowerCase()); 
      })
    })
    console.log(newWordSet);
    setWordSet(newWordSet); 
  }, []);

  useEffect(() => {
    console.log('run algo')
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

      
      ReactGA.event({
        category: "search",
        action: "search",
        label: debouncedSearchTerm,
      });
    }
  }, [debouncedSearchTerm, wordSet]);

  useEffect(() => {
    function filterCourses(courses: Array<Course>, subjectSetFilter: Set<string>, courseLevelRange: [number, number]) {
      return courses.filter((course) => {
        // filter by year level
        let level = parseInt(course.course[0]);
    
        return isNaN(level) || (level >= courseLevelRange[0] && level <= courseLevelRange[1]);
      }).filter((course) => {
        // filter by subjects
        return subjectSetFilter.size === 0 ? true : subjectSetFilter.has(course.subject);
      })
    }

    // run when filter options have been updated
    console.log('run filter')
    let result = filterCourses(searchedCourses, subjectSetFilter, courseLevelRange);
    result = result.splice(0, debouncedDisplayLimit);
    setFilteredCourses(result);
  }, [debouncedDisplayLimit, subjectSetFilter, courseLevelRange, searchedCourses])

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
                  <AdvancedOptions
                    displayLimit={displayLimit}
                    setDisplayLimit={setDisplayLimit}
                    suggestionsLimit={suggestionsLimit}
                    setSuggestionsLimit={setSuggestionsLimit}
                    courseLevelRange={courseLevelRange}
                    setCourseLevelRange={setCourseLevelRange}
                    setSubjectSetFilter={setSubjectSetFilter}
                  />
                </Collapse>
            </Paper>
            <div className="link-container">
              <Link href="#" onClick={() => typeform.open()}>Feedback / suggestions</Link>
            </div>
          </Container>
        </Box>
        <Container className="center">
          {(filteredCourses.length !== 0 || notFound) &&
            <SearchSuggestionBox
              notFound={notFound}
              suggestions={suggestions}
              suggestionsLimit={suggestionsLimit}
            />
          }
          {searching && <CircularProgress className={classes.loadingBar} color="primary" />}
          <SearchResults courses={filteredCourses} />
        </Container>
        <footer>
          <Link href="https://github.com/StuffByLiang/ubc-course-search">Github</Link>,
          <Link href="#" onClick={() => typeform.open()}>Feedback / suggestions</Link>,
          <Link href="https://docs.ubccourses.com">UBC Courses API</Link>
        </footer>
      </div>
    </ThemeProvider>
  );
}

export default App;