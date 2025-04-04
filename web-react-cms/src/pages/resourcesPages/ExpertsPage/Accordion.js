import React, { useState } from 'react';
import {
  Accordion as AccordionWrap,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import palette from 'theme/palette';

// import PropTypes from 'prop-types';

const Accordion = () => {
  const [expanded, setExpanded] = useState('');

  const handleChangeExpand = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  return (
    <Box>
      <AccordionWrap
        sx={{
          boxShadow: 'none'
        }}
        expanded={expanded === 'panel1'}
        onChange={handleChangeExpand('panel1')}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon color="common.darkPurple" />}
          aria-controls="panel1a-content"
          id="panel1a-header">
          <Typography color="common.darkPurple" variant="body1">
            How to determine the best loan rate for you?
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <Typography color={palette.variables.greyLight} variant="body2">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Felis dolor risus dignissim
            amet dignissim proin lorem nunc. Velit facilisis nibh venenatis diam ullamcorper in
            pellentesque sodales volutpat. Curabitur lectus velit sollicitudin mauris diam id at
            varius pulvinar. Blandit pharetra iaculis nibh nascetur et, nullam. Molestie et urna id
            volutpat leo cursus viverra facilisis. Scelerisque suspendisse sed eu, lobortis quis
            lectus. Tellus, volutpat, eu adipiscing nulla laoreet cras vel. Sagittis massa mollis in
            fames. Est ultrices sit vivamus erat rhoncus consequat mattis morbi viverra. Lectus sed
            eu sed eget.
          </Typography>
        </AccordionDetails>
      </AccordionWrap>

      <AccordionWrap
        sx={{
          boxShadow: 'none'
        }}
        expanded={expanded === 'panel2'}
        onChange={handleChangeExpand('panel2')}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon color="common.darkPurple" />}
          aria-controls="panel2a-content"
          id="panel2a-header">
          <Typography color="common.darkPurple" variant="body1">
            Do you need a credit card?
          </Typography>
        </AccordionSummary>

        <AccordionDetails sx={{ padding: 0 }}>
          <Typography color={palette.variables.greyLight} variant="body2">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Felis dolor risus dignissim
            amet dignissim proin lorem nunc. Velit facilisis nibh venenatis diam ullamcorper in
            pellentesque sodales volutpat. Curabitur lectus velit sollicitudin mauris diam id at
            varius pulvinar. Blandit pharetra iaculis nibh nascetur et, nullam. Molestie et urna id
            volutpat leo cursus viverra facilisis. Scelerisque suspendisse sed eu, lobortis quis
            lectus. Tellus, volutpat, eu adipiscing nulla laoreet cras vel. Sagittis massa mollis in
            fames. Est ultrices sit vivamus erat rhoncus consequat mattis morbi viverra. Lectus sed
            eu sed eget.
          </Typography>
        </AccordionDetails>
      </AccordionWrap>
    </Box>
  );
};

export default Accordion;

// Accordion.propTypes = {
//   data: PropTypes.array
// };
