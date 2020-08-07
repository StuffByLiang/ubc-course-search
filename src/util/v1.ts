import { Course } from "../_types/Course";

export function algorithm(searchQuery: string, allCourses: Array<Course>): Array<Course> {

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