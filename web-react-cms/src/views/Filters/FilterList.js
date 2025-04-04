import React from 'react';
import { Box, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { t } from 'i18next';
import PropTypes from 'prop-types';

import { selectFilters, removeFilter, removeAllFilters } from 'store/reducers/products';
import BaseButton from 'components/formControl/baseButton/BaseButton';
import palette from 'theme/palette';
import { ReactComponent as IconTrash } from 'assets/icons/Icon-Trash-1.svg';
import { ReactComponent as IconCloseWhite } from 'assets/icons/icon-close-white.svg';

export default function FilterList({ onResetFilters }) {
  const dispatch = useDispatch();
  const filters = useSelector(selectFilters);
  const remove = (index, key) => dispatch(removeFilter({ index, key }));
  const removeAll = () => {
    onResetFilters();
    dispatch(removeAllFilters());
  };

  if (!filters.length) return <div />;
  return (
    <Box
      sx={{
        marginTop: '8px',
        whiteSpace: 'nowrap',
        overflow: 'auto'
      }}>
      <BaseButton
        customColor="white"
        sx={{
          color: palette.variables.darkPurple,
          border: '1px solid #C6C6C6',
          boxShadow: 'none',
          textTransform: 'capitalize',
          maxWidth: 'fit-content',
          padding: '8px 10px',
          minHeight: '36px',
          marginRight: '8px'
        }}
        onClick={() => removeAll()}
        variant="contained"
        element={
          <React.Fragment>
            <Typography
              style={{ marginRight: '8px' }}
              variant="body2"
              color={palette.variables.greyLight}
              component="span">
              {t('clearAll')}
            </Typography>
            <IconTrash />
          </React.Fragment>
        }
      />
      {filters.map((filter, index) => (
        <React.Fragment key={filter.key}>
          {Array.isArray(filter.label) ? (
            filter.label.map((label, index) => (
              <BaseButton
                key={label}
                customColor={palette.variables.lightGreen}
                sx={{
                  color: palette.variables.darkPurple,
                  border: '1px solid #C6C6C6',
                  boxShadow: 'none',
                  textTransform: 'capitalize',
                  maxWidth: 'fit-content',
                  padding: '8px 10px',
                  minHeight: '36px',
                  marginRight: '8px'
                }}
                element={
                  <React.Fragment>
                    <Typography style={{ marginRight: '6px' }} variant="body2" color="common.white">
                      {label}
                    </Typography>
                    <IconCloseWhite onClick={() => remove(index, filter.key)} />
                  </React.Fragment>
                }
              />
            ))
          ) : (
            <BaseButton
              key={filter.key}
              customColor={palette.variables.lightGreen}
              sx={{
                color: palette.variables.darkPurple,
                border: '1px solid #C6C6C6',
                boxShadow: 'none',
                textTransform: 'capitalize',
                maxWidth: 'fit-content',
                padding: '8px 10px',
                minHeight: '36px',
                marginRight: '8px'
              }}
              element={
                <React.Fragment>
                  <Typography style={{ marginRight: '6px' }} variant="body2" color="common.white">
                    {filter.label}
                  </Typography>
                  <IconCloseWhite onClick={() => remove(index)} />
                </React.Fragment>
              }
            />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
}

FilterList.defaultProps = {
  onResetFilters: () => ({})
};

FilterList.propTypes = {
  onResetFilters: PropTypes.func
};
