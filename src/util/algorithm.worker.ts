import { relevancyAlgorithm } from './relevancyAlgorithm';
// import { Course } from '../_types/Course';
// import natural from 'natural';

onmessage = (event) => {
  console.log('Message received from main script');
  
  const { searchQuery, allCourses, tfidf, wordSet } = event.data;

  let results = relevancyAlgorithm(searchQuery, allCourses, tfidf, wordSet);

  console.log('Sending message back to main script');

  // @ts-ignore
  postMessage(results); // TODO: change targetOrigin -> doesnt matter because we dont have any sensitive data.
}
