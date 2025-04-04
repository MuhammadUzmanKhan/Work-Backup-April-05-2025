import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import { ReactComponent as CaretGreyRight } from 'assets/icons/caret-grey-right.svg';
import palette from 'theme/palette';

export default function QuizList({ items }) {
  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: '#ffffff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px #28183a14'
      }}>
      <List>
        {items.map((item, index) => (
          <ListItem disablePadding key={index}>
            <ListItemButton>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography color="#29173B" variant="subtitle1" component="h2">
                        {item.title}
                      </Typography>
                      <Typography
                        color={palette.variables.greyLight}
                        variant="caption"
                        component="h3">
                        {item.subtitle}
                      </Typography>
                    </Box>
                    <CaretGreyRight />
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

QuizList.propTypes = {
  items: PropTypes.array
};
