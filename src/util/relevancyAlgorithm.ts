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

export function relevancyAlgorithm(searchQuery: string, allCourses: Array<Course>, engineString: string, wordSet: Set<string>): Array<Course> {
  /* 
   * 0. match all the words in the searchQuery to words in our set of words (tokenize the description)
     if one of the words in the search query input does not exist, then: 
     match the word to a word that matches a phrase from our wordset and use that newSearchQuery in our searching algorithm 
   * 1. use bm25 algorithm on description only to compute scores for each of the courses
   * 2. sort and return top 10 relevant courses
   */
  console.time("get related words")

  let list = new Array<string>(); // list of words similar or the same to the search query's words
  let replacementWord: string = ""; 

  let inputWords = searchQuery.trim().split(' ');  // gets the words from the search query 
  console.log(inputWords); 




  // we need to check that every word in the input string is valid, and if one word isn't then it needs to be replaced. 
  // we are going to replace in order of 
  // 1. check if the word is a prefix 
  // 2. check if the word is a substring 
  // 3. check if the word has a close match 
  // grab the highest priority word then we're good.
  for(let i = 0; i < inputWords.length; i++) {
    let {
      perfectMatches,
      prefixMatches,
      substringMatches,
      closeMatches
    } = getMatches(inputWords[i], wordSet);
    if(perfectMatches.length === 0){  // if this word doesnt have a perfect match find a replacement  
      console.log("prefix matches:",prefixMatches); 
      console.log("substringMatches:", substringMatches)
     console.log("closeMatches:", closeMatches)
      
      if(prefixMatches.length !== 0) {
       inputWords[i] = prefixMatches[0].word; 
      } else if (substringMatches.length !== 0) {
        inputWords[i] = substringMatches[i].word; 
      } else {
        if(closeMatches.length > 0) {
          inputWords[i] = closeMatches[0].word; 
        }
      }
    }
  }

    
  // inputWords.map((query) => {
  //   let {
  //     perfectMatches,
  //     prefixMatches,
  //     substringMatches,
  //     closeMatches
  //   } = getMatches(query, wordSet);

  //   list = list.concat(perfectMatches.map((match) => match.word));
  //   list = list.concat(prefixMatches.map((match) => match.word));
  //   list = list.concat(substringMatches.map((match) => match.word));

  //   // if(perfectMatches.length === 0 && prefixMatches.length !== 0) {
  //   //   replacementWord = prefixMatches[0].word; 
  //   // } else if (prefixMatches.length === 0 && substringMatches.length !== 0) {
  //   //   replacementWord = substringMatches[0].word; 
  //   // } else  {
  //   //   replacementWord = closeMatches[0].word;
  //   // }

  //   if(perfectMatches.length === 0 &&
  //     prefixMatches.length === 0 &&
  //     substringMatches.length === 0 &&
  //     closeMatches.length > 1) {
  //     list.push(closeMatches[0].word);
  //   }
    

  //   // console.log("perfectMatch", perfectMatches)
  //   // console.log("prefixMatches:", prefixMatches)
  //   // console.log("substringMatches:", substringMatches)
  //   // console.log("closeMatches:", closeMatches)
  // })

  let newSearchQuery = inputWords.toString(); 
  console.log("new input: " + newSearchQuery); 
  
  list = list.splice(0, 25)
  console.log("list:" + list)
  console.timeEnd("get related words")

  console.time("bm25 search")
  let results: Array<Result> = bm25Search(allCourses, newSearchQuery, engineString);
  console.log(results)
  console.timeEnd("bm25 search")
 
  // if(results.length === 0) {
    
  //   //
  //   // TODO: make this part below into a prompt 
  //   // 
  //   console.log(replacementWord); 
  //   results = bm25Search(allCourses, replacementWord, engineString);  
  // }

  return results.map((result) => {
    return result.course;
  });
}

function bm25Search(allCourses: Array<Course>, searchQuery: string, engineString: string, limit: number = 10): Array<Result>  {
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

// function tfidfSearch(allCourses: Array<Course>, searchQuery: string, engineString: string, limit: number = 10): Array<Result> {
//   const tfidf = new TfIdf(JSON.parse(engineString));

//   let results: Array<Result> = [];

//   tfidf.tfidfs(searchQuery, (index, score) => {
//     if(score !== 0) {
//       results.push({
//         course: allCourses[index],
//         score
//       });
//     }
//   });

//   results = results.sort((a, b) => {
//     return b.score - a.score;
//   })

//   return results.splice(0, limit);
// } 

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

  return 1 - LevenshteinDistance(searchQuery, target)/target.length;
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