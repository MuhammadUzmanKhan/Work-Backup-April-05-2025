import React from 'react';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';

import GuidebookItem from './GuidebookItem';

import styles from '../resources.module.scss';

const GuidebooksList = ({ data, onClick }) => (
  <Box className={styles.wrapGuidebooks}>
    {data?.map((el) => (
      <GuidebookItem data={el} onClick={() => onClick(el.id)} key={el.id} />
    ))}
  </Box>
);

export default GuidebooksList;

GuidebooksList.propTypes = {
  data: PropTypes.array,
  onClick: PropTypes.func
};
