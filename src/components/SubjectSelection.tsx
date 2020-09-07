import React from 'react';

import { Subject } from '../_types';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { TextField } from '@material-ui/core';
import allSubjects from '../data/subjects.json';


function SubjectSelection({ setSubjectSetFilter }: any) {
  return (
    <Autocomplete
      multiple
      id="subjects"
      options={allSubjects}
      getOptionLabel={(option: Subject) => option.subject + " - " + option.title}
      defaultValue={[]}
      onChange={(e: any, value: Array<Subject>) => {
        setSubjectSetFilter(new Set(value.map((subject) => subject.subject)));
      }}
      renderInput={(params: any) => (
        <TextField
          {...params}
          variant="standard"
          label="Filter by Subjects"
          placeholder="subjects"
        />
      )}
    />
  )
}

export default React.memo(SubjectSelection);