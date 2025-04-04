import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

import SearchFilter from 'views/Products/SearchFilter';
import GuidebooksList from './ExpertsPage/GuidebooksList';

import { resourcesGuidbooks } from 'utils/fakeValues';

import styles from './resources.module.scss';

const GuidebooksPage = () => {
  const navigate = useNavigate();

  const onSearch = useCallback((value) => {
    console.log('onSearch', value);
  }, []);

  const onGoToDetails = useCallback((id) => {
    navigate(`/resources/guidebooks/${id}`);
  }, []);

  return (
    <Box className={styles.container}>
      <Typography variant="h3">101 Guidebook</Typography>

      <SearchFilter withFilter={false} onChange={onSearch} />

      <Box sx={{ mt: 3 }}>
        <GuidebooksList data={resourcesGuidbooks} onClick={onGoToDetails} />
      </Box>
    </Box>
  );
};

export default GuidebooksPage;
