import { Course } from '../_types/Course';
import bm25 from 'wink-bm25-text-search';
import nlp from 'wink-nlp-utils';
import LevenshteinDistance from 'js-levenshtein';

interface Match {
  word: string,
  score: number
}

interface Result {
  course: Course,
  score: number
}

interface Suggestion {
  query: Array<string>,
  score: number
}

interface Output {
  result: Array<Course>,
  notFound: boolean,
  suggestions: Array<string>
}

export function relevancyAlgorithm(searchQuery: string, allCourses: Array<Course>, engineString: string, wordSet: Set<string>): Output {
  /* 
   * 0. match all the words in the searchQuery to words in our set of words (tokenize the description)
   * 1. use tf-idf algorithm on description only to compute scores for each of the courses
   * 2. sort and return
   */
  console.time("get query suggestions")
  let querySuggestions = getQuerySuggestions(searchQuery, wordSet);
  console.timeEnd("get query suggestions")

  console.time("bm25 search")
  let results: Array<Result> = querySuggestions.length === 0 ? [] : bm25Search(allCourses, querySuggestions[0], engineString, allCourses.length);
  console.log(results)
  console.timeEnd("bm25 search")

  return {
    result: results.map((result) => {
      return result.course;
    }),
    suggestions: querySuggestions,
    notFound: !hasResult(searchQuery, wordSet)
  }
}

/**
 * Returns true if all words in searchQuery are in wordSet
 * 
 * @param  {string} searchQuery
 * @param  {Set<string>} wordSet
 * @returns boolean
 */
function hasResult(searchQuery: string, wordSet: Set<string>): boolean {
  for (let word of searchQuery.trim().toLowerCase().split(' ')) {
    if(!wordSet.has(word)) {
      return false;
    }
  }

  return true;
}

function getQuerySuggestions(searchQuery: string, wordSet: Set<string>): Array<string> {
  let listOfWords = searchQuery.trim().split(' ');

  let closeWordsList: Array<Array<Match>> = listOfWords.map((query) => {
    let limit = Math.max(1, Math.min(5, Math.floor(Math.pow(1000, 1/listOfWords.length))));
    let wordSuggestions: Array<Match> = getMatches(query, wordSet)
      .filter((match) => {
        return match.score > 1.5;
      })
    return wordSuggestions.splice(0, limit)
  })

  let permutations = getPermutations([], closeWordsList);

  permutations.sort((a, b) => b.score - a.score);

  return permutations.map((suggestion) => suggestion.query.join(' '));
}

function getPermutations(resultSoFar: Array<Suggestion>, closeWordsList: Array<Array<Match>>): Array<Suggestion> {
  if(closeWordsList.length === 0) {
    return resultSoFar;
  } else if (resultSoFar.length === 0) {
    let result = closeWordsList[0].map(match => ({
      query: [match.word],
      score: match.score
    }))
    return getPermutations(result, closeWordsList.slice(1));
  } else if (closeWordsList[0].length === 0) {
    return getPermutations(resultSoFar, closeWordsList.slice(1));
  } else {
    let result = closeWordsList[0].map(match => {
      return resultSoFar.map(suggestion => ({
        query: [...suggestion.query, match.word],
        score: suggestion.score * match.score
      }))
    });

    return getPermutations(([] as Array<Suggestion>).concat(...result), closeWordsList.slice(1));
  }
}

function bm25Search(allCourses: Array<Course>, searchQuery: string, engineString: string, limit: number = 10): Array<Result>  {
  console.log('search query: ' + searchQuery)
  const pipe = [
    nlp.string.lowerCase,
    nlp.string.tokenize0,
    // nlp.tokens.stem
  ];

  const engine = bm25();
  engine.importJSON(engineString);
  engine.definePrepTasks(pipe);

  let results: Array<Result> = engine.search(searchQuery, limit)
    .map((measure: any) => {
      return {
        course: allCourses[measure[0]],
        score: measure[1]
      };
    });
   
  return results;
}

/**
 * Given a list of matches, determine which matches are
 * perfect matches
 * prefix matches
 * substring matches
 * close matches
 */
function getSortedMatches(matches: Array<Match>): {
  perfectMatches: Array<Match>,
  prefixMatches: Array<Match>,
  substringMatches: Array<Match>,
  closeMatches: Array<Match>
} {
  let perfectMatches: Match[]           = [];
  let prefixMatches: Match[]          = [];
  let substringMatches: Match[]       = [];
  let closeMatches: Match[]           = [];

  matches.forEach((result : Match) => {
    if (result.score === 4) {
      perfectMatches.push(result);
    } else if(result.score > 3) {
      prefixMatches.push(result);
    } else if (result.score > 2) {
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
 * Given a word and a wordset, return list of closest words with scores
 * 
 * @param  {string} query
 * @param  {Set<string>} wordSet
 * @returns Array
 */
function getMatches(query: string, wordSet: Set<string>): Array<Match> {
  let results = Array.from(wordSet).map((word) => {
    return {
      word,
      score: getMatchingScore(query, word)
    }
  }).sort((a, b) => {
    return b.score - a.score;
  })
  
  return results;
}

/**
 * gives a score representing how well a given word matches a target word in the following domain 
 *  - 4      - perfect match 
 *  - (3, 4) - given word is a prefix of the target word
 *  - (2, 3) - given word is a substring (but not prefix) of the target word
 *  - [1, 2) - target word can be obtained from the given word upon edits (aka levenshtein distance)
 * 
 * @param  {string} searchQuery
 * @param  {string} target
 * @returns number
 */
function getMatchingScore(searchQuery:string, target: string) : number {
  if (!target || !searchQuery) return 0;

  if (searchQuery === target) {
    return 4;
  }

  if (target.startsWith(searchQuery)) {
    return 3 + searchQuery.length / target.length;
  }

  if (target.includes(searchQuery)) {
    return 2 + searchQuery.length / target.length;
  }

  return 2 - LevenshteinDistance(searchQuery, target)/target.length;
}
