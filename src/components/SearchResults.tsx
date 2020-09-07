import React from 'react';
import { Course } from '../_types/Course';
import CourseCard from './CourseCard';

interface Props {
  courses: Array<Course>
}

function SearchResults({ courses }: Props) {
  return (
    <div>
      {courses.map((course) => 
        <CourseCard key={course.name} course={course} />
      )}
    </div>
  );
}

export default React.memo(SearchResults);