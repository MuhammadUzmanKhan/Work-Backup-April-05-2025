import React from 'react';
import { Card, CardContent, Grid, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { ReactComponent as Wealth } from 'assets/icons/Wealth.svg';

import palette from 'theme/palette'
import styles from '../Admin.module.scss'
import { useTranslation } from 'react-i18next'
import { Box } from '@mui/system'

const ItemDashboard = ({ item, onClick, translate = false, quizActive = false }) => {
  const { t } = useTranslation()
  return (
    <Card
      onClick={onClick}
      className={styles.card}
      style={quizActive ? { border: `2px solid ${palette.variables.orange}` } : {}}>
      <CardContent sx={{ padding: '16px 15px 8px', position: 'relative' }}>
        <Grid container direction="column" alignItems="center">
          <Grid item xs={12} mb={2}>
            {item.icon ? <img style={{ width: '80px' }} src={item.icon} alt="" /> : <Wealth />}
          </Grid>

          <Grid item xs={12} mb={2}>
            <Typography
              component="p"
              variant="bodyBig"
              color="common.darkPurple"
              textAlign="center">
              {!translate ? item.name : t(`admin.${item.name}`)}
            </Typography>
          </Grid>
          {quizActive && (
            <Box
              sx={{
                position: 'absolute',
                right: 25,
                top: 20,
                fontWeight: '500',
                color: palette.variables.orange
              }}>
              Active
            </Box>
          )}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ItemDashboard;

ItemDashboard.propTypes = {
  item: PropTypes.object,
  onClick: PropTypes.func
};
