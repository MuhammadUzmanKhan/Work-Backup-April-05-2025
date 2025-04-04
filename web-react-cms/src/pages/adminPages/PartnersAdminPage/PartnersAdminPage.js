import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Grid, Typography } from '@mui/material';

import SearchFilter from 'views/Products/SearchFilter';
import PartnerItem from 'views/Admin/Categories/Partners/PartnerItem';
import BaseButton from 'components/formControl/baseButton/BaseButton';

import { setStatePartnerValue } from 'store/reducers/partners';

import palette from 'theme/palette';
import styles from '../admin.module.scss';
import { fetchPartners } from 'store/actions/partners';
import { Permissions } from 'components/Permissions'

const PartnersAdminPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [filter, setFilter] = useState('')

  const { partners } = useSelector((state) => state.partners)

  const onGoToPartner = (partner) => {
    dispatch(setStatePartnerValue({ type: 'partner', data: partner }))
    navigate(`/partners/details/${partner.id}`)
  }

  const filteredPartners = () => {
    if (filter) {
      return (
        partners.filter(
          (partner) => partner.name && partner.name.toLowerCase().includes(filter.toLowerCase())
        ) || []
      )
    } else {
      return partners
    }
  }

  const onCreatePartner = () => {
    navigate('/partners/create')
  }

  useEffect(() => {
    dispatch(fetchPartners())
  }, [])

  return (
    <Box className={styles.container}>
      <Grid container alignItems="center" justifyContent="space-between" mb={3}>
        <Grid item>
          <Typography variant="h3" mt={3}>
            {t('admin.partners')}
          </Typography>
        </Grid>

        <Grid item sx={{ display: 'flex', alignItems: 'end' }}>
          <SearchFilter value={filter} onChange={(value) => setFilter(value)} withFilter={false} />
          <Permissions permission={'write:partner'}>
            <BaseButton
              customColor={palette.variables.orange}
              variant="contained"
              element={t('add')}
              sx={{ display: 'block', maxWidth: 300, height: 'max-content', marginLeft: 3 }}
              onClick={onCreatePartner}
            />
          </Permissions>
        </Grid>
      </Grid>

      <Grid container spacing={2} direction="column">
        {filteredPartners()?.map((item) => (
          <Grid item md={4} xs={6} key={item.id}>
            <PartnerItem item={item} onClick={() => onGoToPartner(item)} />
          </Grid>
        ))}
        {filteredPartners()?.length === 0 && (
          <Box display={'flex'} justifyContent={'center'} mt={10}>
            <Typography variant="h3" mt={3}>
              {'No Partner Found'}
            </Typography>
          </Box>
        )}
      </Grid>
    </Box>
  )
}

export default PartnersAdminPage;
