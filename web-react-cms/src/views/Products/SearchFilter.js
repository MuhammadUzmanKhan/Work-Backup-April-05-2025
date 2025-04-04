import React from 'react';
import { Badge, Box, Grid } from '@mui/material';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import BaseTextField from 'components/formControl/baseTextField/BaseTextField';
import { ReactComponent as IconSearch } from 'assets/icons/Icon-Search.svg';
import { ReactComponent as FilterIcon } from 'assets/icons/filter-icon.svg';
import { ReactComponent as CancelCircleIcon } from 'assets/icons/cancel-circle-icon.svg';
import styles from 'pages/productsSection/products/cards.module.scss';
import { selectFilters } from 'store/reducers/products';
import { useTranslation } from 'react-i18next'

export default function SearchFilter({ setStatusAside, onChange, value, withFilter = true }) {
  const filters = useSelector(selectFilters);
  const { t } = useTranslation()

  return (
    <Box>
      <Grid container justifyContent="space-between" alignItems="flex-end">
        <Grid item xs={withFilter ? 10 : 12}>
          <BaseTextField
            sx={{ width: '100%' }}
            rounded
            placeholder={t('search')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <Box sx={{ marginLeft: '19px', display: 'flex' }}>
                  <IconSearch />
                </Box>
              ),
              endAdornment: value ? (
                <Box onClick={() => onChange('')} sx={{ marginRight: '10px', display: 'flex' }}>
                  <CancelCircleIcon />
                </Box>
              ) : (
                <div />
              )
            }}
          />
        </Grid>

        {withFilter && (
          <Grid item xs={1} sx={{ minWidth: 'fit-content' }}>
            {Object.values(filters).length ? (
              <Badge
                badgeContent=""
                componentsProps={{ badge: { className: styles.baseBadge } }}
                color="lightGreen">
                <FilterIcon onClick={() => setStatusAside(true)} className={styles.filterIcon} />
              </Badge>
            ) : (
              <FilterIcon onClick={() => setStatusAside(true)} className={styles.filterIcon} />
            )}
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

SearchFilter.propTypes = {
  title: PropTypes.any,
  setStatusAside: PropTypes.func,
  onChange: PropTypes.func,
  value: PropTypes.any,
  withFilter: PropTypes.bool
};
