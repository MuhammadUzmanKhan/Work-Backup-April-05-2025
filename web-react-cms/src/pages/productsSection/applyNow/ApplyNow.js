import React from 'react';
import { Grid, Step, StepLabel, Stepper, Typography } from '@mui/material';
import styles from './applyNow.module.scss';

export default function ApplyNow() {
  const [activeStep] = React.useState(0);
  const steps = [
    {
      label:
        'Visit https://www.nbbonline.com/personal/credit-cards/infinite-credit-card#apply-now\n'
    },
    {
      label: 'Fill your details'
    },
    {
      label: 'Click Submit'
    },
    {
      label: 'A bank representation will reach out to you in 3-5 working days'
    }
  ];

  return (
    <Grid container>
      <Grid xs={12} item sx={{ marginBottom: '14px' }}>
        <Typography variant="h3" color="common.darkPurple">
          You’re one step closer!
        </Typography>
      </Grid>
      <Grid xs={12} item sx={{ marginBottom: '14px' }}>
        <Typography variant="body2" color="common.greyLight">
          Here’s more information on what you need and how to apply:
        </Typography>
      </Grid>
      <Grid xs={12} item sx={{ marginBottom: '15px' }}>
        <Typography variant="body2" color="common.greyLight">
          Documents Required
        </Typography>
      </Grid>
      <Grid xs={12} item>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <Typography variant="body2" color="common.greyLight">
              CPR
            </Typography>
          </li>
          <li className={styles.listItem}>
            <Typography variant="body2" color="common.greyLight">
              Salary Slip
            </Typography>
          </li>
          <li className={styles.listItem}>
            <Typography variant="body2" color="common.greyLight">
              6 months account statement
            </Typography>
          </li>
        </ul>
      </Grid>
      <Grid xs={12} item sx={{ marginBottom: '16px' }}>
        <Typography variant="body2" color="common.greyLight">
          How to Apply:
        </Typography>
      </Grid>
      <Grid xs={12} item>
        <Stepper
          className={styles.stepper}
          activeStep={activeStep}
          color="#69B5B5"
          orientation="vertical">
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="body2" color="common.greyLight">
                  {step.label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Grid>
    </Grid>
  );
}
