import React from 'react';
import { Box, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as IconInternational } from '../../assets/icons/flags/International.svg';
import { ReactComponent as IconInternationalWhite } from '../../assets/icons/flags/InternationalWhite.svg';
import { selectLanguage, setLanguage } from '../../store/app/appSlice';
import styles from './languageSwitch.module.scss';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const renderIcon = (language, isWhite) => {
  switch (language) {
    case 'en':
      return isWhite ? <IconInternationalWhite /> : <IconInternational />;
    case 'ar':
      return isWhite ? <IconInternationalWhite /> : <IconInternational />;
  }
};

export default function LanguageSwitch({ isWhite, setLoading }) {
  const language = useSelector(selectLanguage)
  const dispatch = useDispatch()

  const handleChange = async (lang) => {
    setLoading(true)
    await dispatch(setLanguage(lang === 'en' ? 'ar' : 'en'))
    setLoading(false)
  }
  return (
    <Box
      className={classNames([styles.languageContainer, { [styles.isWhite]: isWhite }])}
      style={{ cursor: 'pointer' }}
      onClick={() => handleChange(language)}>
      {renderIcon(language, isWhite)}{' '}
      <Typography
        sx={{ margin: '0 8px 0 8px', textTransform: 'uppercase' }}
        variant="caption"
        align="center"
        color={isWhite ? 'white' : 'darkPurple'}
        gutterBottom>
        {language}
      </Typography>
    </Box>
  )
}
LanguageSwitch.defaultProps = {
  isWhite: false
};

LanguageSwitch.propTypes = {
  isWhite: PropTypes.bool
};
