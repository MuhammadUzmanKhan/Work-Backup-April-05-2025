import React from 'react';
import { useSelector } from 'react-redux';
import { Box, List, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

// import { ReactComponent as CardIcon } from 'assets/icons/products/card-icon.svg';
// import { ReactComponent as CarIcon } from 'assets/icons/products/car-icon.svg';
// import { ReactComponent as CryptoIcon } from 'assets/icons/products/crypto-icon.svg';
// import { ReactComponent as DepositIcon } from 'assets/icons/products/deposit-icon.svg';
// import { ReactComponent as PersonalIcon } from 'assets/icons/products/personal-icon.svg';
// import { ReactComponent as SavingIcon } from 'assets/icons/products/saving-icon.svg';

import styles from './dashboardProducts.module.scss';
import DashboardProduct from './DashboardProduct';
// import { useNavigate } from 'react-router-dom';
import PageLoading from 'components/PageLoading';

export default function DashboardProducts({ items }) {
  const { t } = useTranslation();

  const loading = useSelector((state) => state.products.loaders.category);

  // const navigate = useNavigate();
  // const items = [
  //   {
  //     title: t('creditCard'),
  //     icon: <CardIcon />,
  //     onClick: () => navigate('/card-categories')
  //   },
  //   {
  //     title: t('personalLoans'),
  //     icon: <PersonalIcon />,
  //     onClick: () => ({})
  //   },
  //   {
  //     title: t('carLoans'),
  //     icon: <CarIcon />,
  //     onClick: () => ({})
  //   },
  //   {
  //     title: t('depositAccount'),
  //     icon: <DepositIcon />,
  //     onClick: () => ({})
  //   },
  //   {
  //     title: t('savingAccounts'),
  //     icon: <SavingIcon />,
  //     onClick: () => ({})
  //   },
  //   {
  //     title: t('crypto'),
  //     icon: <CryptoIcon />,
  //     onClick: () => ({})
  //   }
  // ];
  return (
    <Box>
      <Typography variant="bodyBig">{t('searchCompare')}</Typography>
      <List
        className={styles.listContainer}
        sx={{ width: '100%' }}
        component="nav"
        aria-labelledby="nested-list-subheader">
        {items.map((item) => (
          <DashboardProduct item={item} key={item.id} />
        ))}
      </List>
      <PageLoading loading={loading} />
    </Box>
  );
}

DashboardProducts.propTypes = {
  items: PropTypes.array
};
