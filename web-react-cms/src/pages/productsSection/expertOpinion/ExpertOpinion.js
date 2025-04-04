import React from 'react';
import { Typography, Grid, AccordionSummary, AccordionDetails, Accordion } from '@mui/material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import palette from 'theme/palette';
import { ReactComponent as AvatarIcon } from 'assets/avatars/avatar1.svg';

export default function ExpertOpinion() {
  const [expanded, setExpanded] = React.useState('panel1');
  const handleChangeExpand = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  return (
    <Grid container>
      <Grid xs={12} item sx={{ marginBottom: '16px' }}>
        <Typography variant="h3" color="common.darkPurple">
          About
        </Typography>
      </Grid>
      <Grid xs={12} sx={{ display: 'flex', gap: '8px', marginBottom: '25px' }}>
        <Grid item>
          <AvatarIcon />
        </Grid>
        <Grid item>
          <Typography
            variant="subtitle1"
            color="common.darkPurple"
            sx={{ marginBottom: '8px' }}
            component="h2">
            Dr. Ali Ahmed
          </Typography>
          <Typography
            sx={{ marginBottom: '15px' }}
            variant="subtitle1"
            color="#727272"
            component="h3">
            Dr. Ali is a certified financial advisor with 10 years of experience in the field
          </Typography>
          <Typography
            color={palette.variables.greyLight}
            variant="caption"
            component="h4"
            sx={{ marginBottom: '12px' }}>
            Area of expertise:
          </Typography>
          <Grid
            item
            xs={12}
            sx={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography
              color="common.white"
              variant="caption"
              sx={{
                padding: '4px 6px',
                background: '#69B5B5',
                borderRadius: '16px'
              }}>
              Credit Products
            </Typography>
            <Typography
              color="common.white"
              variant="caption"
              sx={{
                padding: '4px 6px',
                background: '#69B5B5',
                borderRadius: '16px'
              }}>
              Credit Products
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid xs={12} item sx={{ marginBottom: '16px' }}>
        <Typography variant="bodyBig" color="common.darkPurple" component="h3">
          What should you know before choosing the credit card for you?
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Accordion
          sx={{
            boxShadow: 'none'
          }}
          expanded={expanded === 'panel1'}
          onChange={handleChangeExpand('panel1')}>
          <AccordionSummary
            sx={{
              padding: 0
            }}
            expandIcon={<ExpandMoreIcon color="common.darkPurple" />}>
            <Typography color="common.darkPurple" variant="body1">
              What are interest rate?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ padding: 0 }}>
            <Typography color={palette.variables.greyLight} variant="body2">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Felis dolor risus dignissim
              amet dignissim proin lorem nunc. Velit facilisis nibh venenatis diam ullamcorper in
              pellentesque sodales volutpat. Curabitur lectus velit sollicitudin mauris diam id at
              varius pulvinar. Blandit pharetra iaculis nibh nascetur et, nullam. Molestie et urna
              id volutpat leo cursus viverra facilisis. Scelerisque suspendisse sed eu, lobortis
              quis lectus. Tellus, volutpat, eu adipiscing nulla laoreet cras vel. Sagittis massa
              mollis in fames. Est ultrices sit vivamus erat rhoncus consequat mattis morbi viverra.
              Lectus sed eu sed eget.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );
}
