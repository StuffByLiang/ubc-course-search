import React from 'react';
import { Typography, Link, Box } from '@material-ui/core';

interface Props {
  notFound: boolean,
  suggestions: Array<string>,
  suggestionsLimit: number,
  setSearchQuery: any
}

function SearchSuggestionsBox({ notFound, suggestions, suggestionsLimit, setSearchQuery }: Props) {
return (
  <Box
    mt={2}
    style={{textAlign: 'left'}}
  >
    {notFound && (
      <Typography component="h3" style = {{fontWeight: 'bold'}}>
        No results found.
        {suggestions.length > 0 &&
          [
            <span> Showing results instead for...</span>,
            <Link onClick={()=>setSearchQuery(suggestions[0])} href="#">{suggestions[0]}</Link>
          ]
        }
      </Typography>
    )}
    
    {(suggestionsLimit !== 0 && suggestions.length > 1) && (
      <Typography component="h3" style = {{fontWeight: 'bold'}}>
        Other Suggestions... {suggestions.slice(1, suggestionsLimit + 1).map((query, i) => <span key={i}><Link style={{marginLeft:'5px'}} onClick={()=>setSearchQuery(query)} href="#">{query}</Link>{','}</span>)}
      </Typography>
    )}
  </Box>
);
}

export default SearchSuggestionsBox;