import { Course } from '../_types/Course';
import natural from 'natural';
// import worker  from 'worker_threads';

const TfIdf = natural.TfIdf;

interface Match {
  word: string,
  score: number
}

export function relevancyAlgorithm(searchQuery: string, allCourses: Array<Course>, tfidfString: string, wordSet: Set<string>): Array<Course> {
  /* 
   * 0. match all the words in the searchQuery to words in our set of words (tokenize the description)
   * 1. use tf-idf algorithm on description only to compute scores for each of the courses
   * 2. sort and return top 10 relevant courses
   */
  // var myWorker = new Worke  r('worker.js');
  console.time("get related words")

  const tfidf = new TfIdf(JSON.parse(tfidfString));

  let list = new Array<string>();

  searchQuery.split(' ').map((query) => {
    let {
      perfectMatches,
      prefixMatches,
      substringMatches,
      closeMatches
    } = getMatches(query, wordSet);

    list = list.concat(perfectMatches.map((match) => match.word));
    list = list.concat(prefixMatches.map((match) => match.word));
    list = list.concat(substringMatches.map((match) => match.word));

    if(perfectMatches.length === 0 &&
      prefixMatches.length === 0 &&
      substringMatches.length === 0 &&
      closeMatches.length > 1) {
      list.push(closeMatches[0].word);
    }
    
    // console.log("perfectMatch", perfectMatches)
    // console.log("prefixMatches:", prefixMatches)
    // console.log("substringMatches:", substringMatches)
    // console.log("closeMatches:", closeMatches)
  })
  console.timeEnd("get related words")

  let measures: {
    index: number,
    measure: number
  }[] = [];

  console.time("search")
  list = list.splice(0, 25)
  console.log(list)
  tfidf.tfidfs(list, (index, measure) => {
    if(measure !== 0) {
      measures.push({
        index,
        measure
      });
    }
  });
  console.timeEnd("search")

  console.time("sort")
  let results = measures
    .sort((a, b) => {
      return b.measure - a.measure;
    })
    .map((measure) => {
      return allCourses[measure.index];
    })
  console.timeEnd("sort")

  return results;
}

function getMatches(query: string, wordSet: Set<string>) {
  let results = Array.from(wordSet).map((word) => {
    return {
      word,
      score: getMatchingScore(query, word)
    }
  }).sort((a, b) => {
    return b.score - a.score;
  })
  
  let perfectMatches: Match[]           = [];
  let prefixMatches: Match[]          = [];
  let substringMatches: Match[]       = [];
  let closeMatches: Match[]           = [];

  results.forEach((result : Match) => {
    if (result.score === 3) {
      perfectMatches.push(result);
    } else if(result.score > 2) {
      prefixMatches.push(result);
    } else if (result.score > 1) {
      substringMatches.push(result);
    } else {
      closeMatches.push(result)
    }
  })

  return {
    perfectMatches,
    prefixMatches,
    substringMatches,
    closeMatches
  }
}

/**
 * gives a score representing how well a given word matches a target word in the following domain 
 *  - 3      - perfect match 
 *  - (2, 3) - given word is a prefix of the target word
 *  - (1, 2) - given word is a substring (but not prefix) of the target word
 *  - [0, 1) - target word can be obtained from the given word upon edits (aka levenshtein distance)
 * 
 * @param  {string} searchQuery
 * @param  {string} target
 * @returns number
 */
function getMatchingScore(searchQuery:string, target: string) : number {
  if (!target || !searchQuery) return 0;

  if (searchQuery === target) {
    return 3;
  }

  if (target.startsWith(searchQuery)) {
    return 2 + searchQuery.length / target.length;
  }

  if (target.includes(searchQuery)) {
    return 1 + searchQuery.length / target.length;
  }

  return 1 - natural.LevenshteinDistance(searchQuery, target)/target.length;
}

/**
 * returns how many times sub_str is in main_str
 * 
 * @param  {string} main_str
 * @param  {string} sub_str
 * @returns number
 */
function count(main_str: string, sub_str: string ): number {
  main_str += '';
  sub_str += '';

  if (sub_str.length <= 0) {
    return main_str.length + 1;
  }

  let subStr = sub_str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (main_str.match(new RegExp(subStr, 'gi')) || []).length;
}