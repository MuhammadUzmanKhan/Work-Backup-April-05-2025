import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import palette from 'theme/palette';

import FilterLabels from 'components/formControl/formCreator/FilterLabels';

import { filterAnswer, resourcesFAQs } from 'utils/fakeValues';

const FAQsPage = () => {
  const [selectedLabel, setSelectedLabel] = useState('Cashback');
  const [expanded, setExpanded] = useState('');

  const handleChangeExpand = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  return (
    <Box>
      <Grid container>
        <Grid xs={12} item sx={{ marginBottom: '24px' }}>
          <Typography component="h3" variant="h3" color="common.darkPurple">
            Frequently Asked Questions
          </Typography>
        </Grid>

        <Grid xs={12} item sx={{ marginBottom: '32px' }}>
          <FilterLabels
            sx={{
              display: 'flex',
              gap: '8px',
              overflow: 'auto',
              paddingBottom: '15px',
              flexWrap: 'nowrap'
            }}
            buttonSx={{ minWidth: 'fit-content' }}
            items={filterAnswer}
            value={selectedLabel}
            handleChange={(e) => setSelectedLabel(e.target.value)}
          />
        </Grid>

        <Grid xs={12} item>
          {resourcesFAQs.map((el) => (
            <Accordion
              sx={{
                boxShadow: 'none'
              }}
              expanded={expanded === `panel${el.id}`}
              onChange={handleChangeExpand(`panel${el.id}`)}
              key={el.id}>
              <AccordionSummary
                sx={{
                  padding: 0
                }}
                expandIcon={<ExpandMoreIcon color="common.darkPurple" />}>
                <Typography color="common.darkPurple" variant="body1">
                  {el.name}
                </Typography>
              </AccordionSummary>

              <AccordionDetails sx={{ padding: 0 }}>
                <Typography color={palette.variables.greyLight} variant="body2">
                  {el.description}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Grid>
      </Grid>
    </Box>
  );
};

export default FAQsPage;
