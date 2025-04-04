import React from 'react';
import { Card, CardContent, Grid, Rating, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import styles from 'pages/productsSection/products/cards.module.scss';
import { ReactComponent as BtcImg } from 'assets/images/btc-img.svg';
import { ReactComponent as CaretGreyRightIcon } from 'assets/icons/caret-grey-right.svg';
import palette from 'theme/palette';

export default function DefaultProductView() {
  const { t } = useTranslation();
  const isNegative = true;
  return (
    <Card className={styles.cardContainer}>
      <CardContent sx={{ padding: '16px 15px 8px' }}>
        <Grid container>
          <Grid
            item
            xs={12}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
            <BtcImg style={{ marginRight: '18px' }} />
            <Grid item sx={{ display: 'flex', alignItems: 'center', marginRight: '38px' }}>
              <Rating
                sx={{ marginRight: '10px' }}
                name="simple-controlled"
                value={4.5}
                precision={0.5}
              />
              <Typography variant="body2" color="common.darkPurple">
                4.5
              </Typography>
            </Grid>
            <CaretGreyRightIcon className={styles.caretRight} />
          </Grid>
          <Grid item xs={12} sx={{ marginBottom: '8px' }}>
            <Typography variant="bodyBig" color="common.darkPurple">
              Bitcoin (BTC)
            </Typography>
          </Grid>
          <Grid xs={12} item sx={{ display: 'flex', alignItems: 'center' }}>
            <Grid item xs={12} sx={{ display: 'flex', align: 'center' }}>
              <Typography
                style={{ marginRight: '5px', display: 'flex', alignItems: 'center' }}
                variant="caption"
                component="h3"
                color={palette.white['400']}>
                {t('Market Summary')}:
              </Typography>
              <Typography
                variant="title"
                component="h4"
                color={!isNegative ? 'darkPurple' : 'lightGreen'}>
                +1.85%
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
