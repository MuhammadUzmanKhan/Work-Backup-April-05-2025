import React, { useState, useContext, useEffect } from 'react';
import { Box, Grid, Typography } from '@mui/material';

import DefaultProductView from 'views/Product/DefaultProductView';
import FilterLabels from 'components/formControl/formCreator/FilterLabels';

import styles from './resources.module.scss';

import { BackgroundContext } from '../../layouts/historyLayout/HistoryLayout';
import { useNavigate } from 'react-router-dom';
import { productsComunity, filterAnswer, resourcesComunityCards } from 'utils/fakeValues';

const CommunityPage = () => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState('Cashback');
  // const items = [0, 1, 2, 3, 4, 5];
  const [, setBackgroundVal] = useContext(BackgroundContext);
  const navigate = useNavigate();

  useEffect(() => {
    setBackgroundVal({ background: '', isWhite: false });
  }, []);

  return (
    <Box className={styles.container}>
      <Box>
        <Grid container>
          <Grid xs={12} item sx={{ marginBottom: '25px' }}>
            <Typography component="h3" variant="h3" color="common.darkPurple">
              Community Reviews
            </Typography>
          </Grid>

          <Grid
            xs={12}
            item
            sx={{ display: 'flex', gap: '16px', overflow: 'auto', paddingBottom: '15px' }}>
            {resourcesComunityCards.map((item) => (
              <Box
                onClick={() => setSelectedCategory(item)}
                key={item.id}
                sx={{
                  border: '2px solid #F2F2F2',
                  boxSizing: 'border-box',
                  borderRadius: '20px',
                  padding: '24px 16px 22px',
                  minWidth: '145px',
                  minHeight: '124px',
                  textAlign: 'center',
                  borderColor: selectedCategory.id === item.id ? '#69B5B5' : '#F2F2F2'
                }}>
                <img
                  src={item.url}
                  style={{ width: '48px', height: '36px', paddingBottom: '14px' }}
                  alt=""
                />
                <Typography variant="subtitle1" color="common.darkPurple">
                  {item.name}
                </Typography>
              </Box>
            ))}
          </Grid>

          <Grid xs={12} item>
            <FilterLabels
              sx={{
                display: 'flex',
                gap: '8px',
                overflow: 'auto',
                marginBottom: '15px',
                flexWrap: 'nowrap',
                width: 'max-content'
              }}
              buttonSx={{ minWidth: 'fit-content' }}
              items={filterAnswer}
              value={selectedLabel}
              handleChange={(e) => setSelectedLabel(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            {productsComunity.map((product, index) => (
              <DefaultProductView
                item={product}
                key={index}
                onClick={() => navigate('/product-review/slug')}
              />
            ))}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default CommunityPage;
