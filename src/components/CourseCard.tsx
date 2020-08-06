import React from 'react';
import { Course } from '../_types/Course';
import { Card, CardContent, Typography, CardHeader, CardActions, Button } from '@material-ui/core';

interface Props {
  course: Course
}

function CourseCard({ course }: Props) {
  
  return (
    <Card variant = "outlined" color = "blue">
      <CardContent>
        <Typography component="h3">
          {course.name}
        </Typography>
        <Typography component="h4">
          {course.title}
        </Typography>
        {course.description}
      </CardContent>
      <CardActions>
        <Button color = "primary" variant = "outlined" target="_blank" size="small" href={course.link}>
          SSC Link
        </Button>
      </CardActions>
    </Card>
  );
}

export default CourseCard;