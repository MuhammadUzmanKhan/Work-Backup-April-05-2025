import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Grid, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';

import { ReactComponent as CaretGreyRight } from 'assets/icons/caret-grey-right.svg';
import { BackgroundContext } from 'layouts/historyLayout/HistoryLayout';
import { CardsContext } from 'layouts/productsLayout/ProductsLayout';
// import cardTypeRoutes from 'constants/cardTypeRoutes';
import ApplyModal from 'views/Modals/ApplyModal';

import {
  selectCategory,
  selectProductCategory,
  selectSelectedCategory,
  selectTag
} from 'store/reducers/products';

import styles from './cards.module.scss';

export default function ProductsCategories() {
  const [, setBackgroundVal] = useContext(BackgroundContext);
  const [, setCardsVal] = useContext(CardsContext);
  const [open, setOpen] = React.useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const params = useParams();

  const category = useSelector(selectSelectedCategory);
  const categoryList = useSelector(selectProductCategory);
  const tags = category.tags.map((tag) => ({
    ...tag,
    type: tag.name.split(' ').join('_').toLowerCase(),
    onClick: () => {
      dispatch(selectTag(tag));
      navigate(`/${category.type}/${tag.name.split(' ').join('_').toLowerCase()}`);
    }
  }));
  const handleClose = () => setOpen(false);

  const handleApply = () => {
    setOpen(false);
    navigate('/card-list/allCreditCards?isFilters=true');
  };

  useEffect(() => {
    if (Object.values(category).length <= 1) {
      const entity = categoryList.find((item) => item.type === params.type);
      entity && dispatch(selectCategory(entity));
    }
  }, [category, categoryList]);
  useEffect(() => {
    setBackgroundVal({ background: '/img/Categories-card-background.svg', isWhite: true });
    setCardsVal({
      title: (
        <Typography component="span" color="common.white" variant="h3">
          {category.name}
        </Typography>
      ),
      withBottomBar: true
    });
  }, [category]);
  // const items = cardTypeRoutes();

  return (
    <Grid container sx={{ marginTop: '16px' }}>
      {tags.map((item, index) => (
        <Grid key={index} item xs={12}>
          <ListItemButton className={styles.listItemButton} onClick={item.onClick}>
            <ListItemIcon className={styles.listItemButtonIcon}>
              <img src={item.iconUrl} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography color="common.darkPurple" variant="subtitle1">
                  {item.name}
                </Typography>
              }
            />
            <CaretGreyRight className={styles.rightCaret} />
          </ListItemButton>
        </Grid>
      ))}

      <ApplyModal open={open} handleClose={handleClose} handleApply={handleApply} />
    </Grid>
  );
}
