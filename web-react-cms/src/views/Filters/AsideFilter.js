import React, { useEffect, useState } from 'react';
import { Box, Drawer, Grid, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { sortBy } from 'lodash';

import { ReactComponent as IconClose } from 'assets/icons/icon-close.svg';
import FormCreator from 'components/formControl/formCreator/FormCreator';
import palette from 'theme/palette';
import BaseButton from 'components/formControl/baseButton/BaseButton';
import { getObjectDiff } from 'utils';
import { selectFilters } from 'store/reducers/products';
import { setFilters } from 'store/actions/products';

export default function AsideFilter({
  status,
  onChange,
  onSetFilters,
  data,
  initialData,
  dataItems
}) {
  const initialState = initialData;
  const [formValues, setFormValues] = useState(initialState);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const filters = useSelector(selectFilters);

  useEffect(() => {
    if (Object.values(filters).length) {
      setFormValues({
        ...formValues,
        ...Object.values(filters).reduce((acc, curr) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {})
      });
    } else {
      setFormValues(initialState);
    }
  }, [initialState, filters]);

  const chooseComponent = ({ type, answerType }) => {
    if (type === 'productFilterQnAs' && answerType === 'MULTIPLE') {
      return 'filterLabels';
    } else if (type === 'productFilterQnAs' && answerType === 'SINGLE') {
      return 'filterSelect';
    } else if (type === 'productFilterRanges') {
      return 'filterSlider';
    } else if (type === 'productFilterCheckBoxes') {
      return 'filterCheckbox';
    }
  };

  const formsData = sortBy(
    Object.entries(data).reduce((acc, [type, value]) => {
      acc.push(
        ...value.map((v) => ({
          ...v,
          items: v.answers,
          type,
          value: formValues[v.displayIndex],
          component: chooseComponent({ type, answerType: v.answerType }),
          handleChange: (event, newFilters) => handleChange({ [v.displayIndex]: newFilters }),
          onChange: (value) => {
            handleChange({ [v.displayIndex]: value });
          }
        }))
      );
      return acc;
    }, []),
    'displayIndex'
  );

  const toggleDrawer = (status) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    onChange(status);
  };
  const handleChange = (value) => {
    setFormValues({ ...formValues, ...value });
  };

  //TODO: deprecated function for FilterList component, it was needed for showing label in correct way.
  // const getSerializedData = (key, value) => {
  //   const entity = formsData.find((form) => form.displayIndex === key);
  //   switch (entity.type) {
  //     case 'productFilterQnAs':
  //       return value;
  //     case 'productFilterRanges':
  //       return `${value.join(' - ')} ${entity.suffix}`;
  //     case 'productFilterCheckBoxes':
  //       return entity.label;
  //     default:
  //       return value;
  //   }
  // };

  const getTag = (displayIndex, value) => {
    function between(x, min, max) {
      return x >= min && x <= max;
    }

    const { key, answerType, ...entity } = dataItems.find(
      (item) => item.displayIndex.toString() === displayIndex.toString()
    );
    if (key === 'productFilterQnAs' && answerType === 'MULTIPLE') {
      //TODO: When tags will exist need to add value.map(v => v.tag/tags)
      if (entity.question) {
        return value.map((el) => ({ ...el, question: entity.question }));
      }
      return value;
    } else if (key === 'productFilterQnAs' && answerType === 'SINGLE') {
      return value.tag;
    } else if (key === 'productFilterRanges') {
      return entity.tags.find((t) => between(value, t.lowerValue, t.higherValue));
    } else if (key === 'productFilterCheckBoxes') {
      return entity.tag;
    }

    return entity;
  };
  const applyFilters = (e) => {
    const keys = getObjectDiff(initialState, formValues);
    const data = keys
      .map((key) => ({
        key,
        value: formValues[key],
        tag: getTag(key, formValues[key])
        // label: getSerializedData(key, formValues[key])
      }))
      .reduce((acc, curr) => {
        acc.push(curr);
        return acc;
      }, []);

    onSetFilters(data);
    dispatch(setFilters(data));
    toggleDrawer(false)(e);
  };

  const clearFilters = () => {
    setFormValues(initialState);
  };

  return (
    <Drawer anchor="right" open={status} onClose={toggleDrawer(false)}>
      <Box sx={{ width: '100vw', minWidth: '100%', minHeight: '90%' }}>
        <Box
          sx={{
            padding: '20px 15px 25px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
          <Grid container>
            <Grid item xs={12} textAlign="right">
              <IconClose onClick={() => onChange(false)} />
            </Grid>
            <Grid
              item
              xs={12}
              sx={{
                marginBottom: '24px'
              }}>
              <Typography variant="h3" color="#29173B">
                {t('filter')}
              </Typography>
            </Grid>
            <FormCreator items={formsData} />
          </Grid>

          <Grid container>
            <Grid xs={12} item sx={{ display: 'flex', gap: '11px' }}>
              <BaseButton
                customColor="white"
                sx={{
                  color: palette.variables.darkPurple,
                  filter:
                    'drop-shadow(0px 4px 16px rgba(40, 24, 58, 0.08)) drop-shadow(0px -1px 8px rgba(40, 24, 58, 0.05))'
                }}
                type="submit"
                fullWidth
                variant="contained"
                onClick={clearFilters}
                element={t('clearAll')}
              />
              <BaseButton
                customColor={palette.variables.darkPurple}
                type="submit"
                fullWidth
                variant="contained"
                onClick={applyFilters}
                element={t('apply')}
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Drawer>
  );
}

AsideFilter.defaultProps = {
  data: {}
};

AsideFilter.propTypes = {
  status: PropTypes.bool,
  onChange: PropTypes.func,
  onSetFilters: PropTypes.func,
  data: PropTypes.object,
  initialData: PropTypes.object,
  dataItems: PropTypes.array
};
