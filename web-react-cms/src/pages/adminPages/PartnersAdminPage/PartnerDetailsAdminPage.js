import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, IconButton, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit';

// import BaseButton from 'components/formControl/baseButton/BaseButton';
import { ReactComponent as Trust } from 'assets/icons/Trust.svg';

// import palette from 'theme/palette';
import styles from '../admin.module.scss';
import { fetchPartnerById } from 'store/actions/partners';
import { fetchCategory } from 'store/actions/products';
import ProductCategoryItem from 'views/Admin/Categories/ProductCategory/ProductCategoryItem';
import { useTranslation } from 'react-i18next'
import { setStatePartnerValue } from 'store/reducers/partners'

const PartnerDetails = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const { partner } = useSelector((state) => state.partners)
  const { productCategory } = useSelector((state) => state.products)

  useEffect(() => {
    dispatch(fetchCategory())
    dispatch(fetchPartnerById({ id }))
    return async () => await dispatch(setStatePartnerValue({ type: 'partner', data: null }))
  }, [])

  const onEditPartner = () => {
    navigate(`/partners/create/${id}`, { state: { partner } })
  }

  const onGoToCategoryProducts = (category) => {
    navigate(`/products/category/${category.id}/provider/${partner.id}`)
  }

  return (
    <Box className={styles.cardPartner}>
      <Grid display={'flex'} alignItems={'center'}>
        <Grid container alignItems="center" mb={5} mt={3}>
          <Grid item>
            {partner?.logoUrl ? (
              <img
                style={{ width: '80px', height: '54px', marginRight: '18px' }}
                src={partner?.logoUrl}
                alt=""
              />
            ) : (
              <Box ml={1} mr={5}>
                <Trust />
              </Box>
            )}
          </Grid>

          <Grid item>
            <Typography variant="bodyBig" color="common.darkPurple">
              {partner?.name}
            </Typography>
          </Grid>
        </Grid>
        <Grid marginRight={5}>
          <IconButton size="small" aria-label="edit" onClick={onEditPartner}>
            <EditIcon color="secondary" fontSize="small" />
          </IconButton>
        </Grid>
      </Grid>

      <Grid container alignItems="center" mb={3}>
        <Grid item>
          <Typography variant="bodyBig" color="common.darkPurple">
            {t('admin.productCategories')}
          </Typography>
        </Grid>

        {/* <Grid item>
          <BaseButton
            customColor={palette.variables.orange}
            variant="contained"
            element={t('add')}
            sx={{ display: 'block', maxWidth: 300, height: 'max-content', marginLeft: 3 }}
            onClick={onCreateProductCategory}
          />
        </Grid> */}
      </Grid>

      <Grid container spacing={2}>
        {productCategory
          .filter((item) => partner?.categoryIds?.includes(item.id))
          .map((item) => (
            <Grid item md={4} xs={6} key={item.id}>
              <ProductCategoryItem item={item} onClick={() => onGoToCategoryProducts(item)} />
            </Grid>
          ))}
      </Grid>
    </Box>
  )
}

export default PartnerDetails
