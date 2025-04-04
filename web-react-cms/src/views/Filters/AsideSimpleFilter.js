import React, { useState, Fragment } from 'react';
import { Box, Drawer, Grid, TextField, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { ReactComponent as IconClose } from 'assets/icons/icon-close.svg';
import palette from 'theme/palette';
import BaseButton from 'components/formControl/baseButton/BaseButton';
import FilterSelect from 'components/formControl/formCreator/FilterSelect';
import FilterCheckbox from 'components/formControl/formCreator/FilterCheckbox';
import styles from './asideFilter.module.scss';
import { MobileDatePicker } from '@mui/lab';

export default function AsideSimpleFilter({ status, onChange, onSubmit }) {
  const { t } = useTranslation();
  const [selectedDate, handleDateChange] = useState(new Date());
  const [nationality, setNationality] = useState('');

  const toggleDrawer = (status) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    onChange(status);
  };

  const applyFilters = () => {
    onSubmit();
  };

  return (
    <Drawer anchor="right" open={status} onClose={toggleDrawer(false)}>
      <Box sx={{ width: '100vw', minWidth: '100%', minHeight: '90%' }}>
        <Box
          sx={{
            padding: '20px 15px 25px',
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
          <Grid container>
            <Grid item xs={12} textAlign="right">
              <IconClose onClick={() => onChange(false)} />
            </Grid>
            <Grid item xs={12} sx={{ marginBottom: '24px' }}>
              <Typography variant="h3" color="common.darkPurple">
                {/* eslint-disable-next-line react/no-unescaped-entities */}
                Let's get to know you!
              </Typography>
            </Grid>
            <Grid xs={12} item>
              <Typography
                variant="subtitle1"
                color="common.darkPurple"
                sx={{ marginBottom: '24px' }}>
                To help find the right product for you, please fill in the below information
              </Typography>
            </Grid>
            <Grid item xs={12} sx={{ marginBottom: '24px' }}>
              <Grid item xs={12} sx={{ marginBottom: '8px' }}>
                <Typography variant="subtitle1" color="common.darkPurple">
                  Date of birth
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Fragment>
                  <MobileDatePicker
                    value={selectedDate}
                    openTo="year"
                    disableFuture
                    views={['year', 'month', 'day']}
                    onChange={handleDateChange}
                    color="primary"
                    renderInput={(params) => (
                      <TextField
                        sx={{ border: 'none', margin: '0' }}
                        className={styles.datePicker}
                        placeholder="Select date of birth"
                        {...params}
                      />
                    )}
                  />
                </Fragment>
              </Grid>
            </Grid>
            <Grid item xs={12} sx={{ marginBottom: '24px' }}>
              <Grid item xs={12} sx={{ marginBottom: '8px' }}>
                <Typography variant="subtitle1" color="common.darkPurple">
                  Nationality
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FilterSelect
                  items={[]}
                  value={nationality}
                  onChange={setNationality}
                  placeholder="Select your nationality"
                />
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <FilterCheckbox onChange={() => ({})} label="Show Only Sharia-Compliant Products" />
            </Grid>
          </Grid>
          <Grid container>
            <Grid xs={12} item>
              <BaseButton
                customColor={palette.variables.darkPurple}
                type="submit"
                fullWidth
                variant="contained"
                onClick={applyFilters}
                element={t('submit')}
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Drawer>
  );
}

AsideSimpleFilter.defaultProps = {
  data: {}
};

AsideSimpleFilter.propTypes = {
  status: PropTypes.bool,
  onChange: PropTypes.func,
  onSetFilters: PropTypes.func,
  data: PropTypes.object,
  initialData: PropTypes.object,
  onSubmit: PropTypes.func
};
