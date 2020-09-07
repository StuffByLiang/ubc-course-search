import React from 'react';
import { Course } from '../_types/Course';
import { Card, CardContent, Typography, CardHeader, CardActions, Button, Box } from '@material-ui/core';

interface Props {
  course: Course
}

function CourseCard({ course }: Props) {
  return (
    <Box
      mt={2}
    >
      <Card
        elevation={3}
       >
        <CardContent>
          <Typography component="h3" style = {{fontWeight: 'bold'}}>
            {course.name}
          </Typography>
          <Typography component="h4">
            {course.title}
          </Typography>
          {course.description}
        </CardContent>
        <CardActions>
          <Button className="gradient" color="primary" variant= "contained" target="_blank" size="small" href={course.link}>
            SSC Link
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
}

export default CourseCard;