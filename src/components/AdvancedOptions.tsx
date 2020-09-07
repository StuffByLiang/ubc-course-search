import React from 'react';

import { Subject } from '../_types';
import { TextField, makeStyles,FormControl, InputLabel, Select, MenuItem, Grid } from '@material-ui/core';
import SubjectSelection from './SubjectSelection';
import Box from '@material-ui/core/Box';

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

function AdvancedOptions(props: any) {
  const classes = useStyles();

  return (
    <Box p={1}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={3}>
          <TextField
            id="display-limit"
            label="Display Limit"
            type="number"
            InputProps={{ inputProps: { min: 1, max: 200 } }}
            value={props.displayLimit}
            onChange={(e)=>props.setDisplayLimit(parseInt(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            id="suggestions-limit"
            label="Suggestions Limit"
            type="number"
            InputProps={{ inputProps: { min: 0, max: 10 } }}
            value={props.suggestionsLimit}
            onChange={(e)=>props.setSuggestionsLimit(parseInt(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}></Grid>
        <Grid item xs={12} sm={3}>
          <FormControl
            fullWidth
            className={classes.formControl}
          >
            <InputLabel id="minYear">Min Course Level</InputLabel>
            <Select
              labelId="minYear"
              id="minYear"
              value={props.courseLevelRange[0]}
              onChange={(e) => props.setCourseLevelRange([parseInt(e.target.value as string), props.courseLevelRange[1]])}
            >
              <MenuItem value="0">000</MenuItem>
              <MenuItem value="1">100</MenuItem>
              <MenuItem value="2">200</MenuItem>
              <MenuItem value="3">300</MenuItem>
              <MenuItem value="4">400</MenuItem>
              <MenuItem value="5">500</MenuItem>
              <MenuItem value="6">600</MenuItem>
              <MenuItem value="7">700</MenuItem>
              <MenuItem value="8">800</MenuItem>
              <MenuItem value="9">900</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl
            fullWidth
            className={classes.formControl}
          >
            <InputLabel id="maxYear">Max Course level</InputLabel>
            <Select
              labelId="Max Course Level"
              id="maxYear"
              value={props.courseLevelRange[1]}
              onChange={(e) => props.setCourseLevelRange([props.courseLevelRange[0], parseInt(e.target.value as string)]) }
            >
              <MenuItem value="0">000</MenuItem>
              <MenuItem value="1">100</MenuItem>
              <MenuItem value="2">200</MenuItem>
              <MenuItem value="3">300</MenuItem>
              <MenuItem value="4">400</MenuItem>
              <MenuItem value="5">500</MenuItem>
              <MenuItem value="6">600</MenuItem>
              <MenuItem value="7">700</MenuItem>
              <MenuItem value="8">800</MenuItem>
              <MenuItem value="9">900</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={12}>
          <SubjectSelection
            setSubjectSetFilter={props.setSubjectSetFilter}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdvancedOptions;