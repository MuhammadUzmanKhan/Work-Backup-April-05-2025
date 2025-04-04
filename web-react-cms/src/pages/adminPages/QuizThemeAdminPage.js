import { Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import { Permissions } from 'components/Permissions'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { getQuizThemeActive, getQuizThemes } from 'store/actions/quizTheme'
import palette from 'theme/palette'
import ItemDashboard from 'views/Admin/Dashboard/ItemDashboard'

function QuizThemeAdminPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { quizThemes, activeTheme } = useSelector((state) => state.quizThemes)
  useEffect(() => {
    dispatch(getQuizThemes())
    dispatch(getQuizThemeActive({ id: 'latest' }))
  }, [])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3">{t('admin.quizTheme')}</Typography>
        <Permissions permission={'write:quizTheme'}>
          <BaseButton
            customColor={palette.variables.orange}
            variant="contained"
            element={t('add')}
            href="/#/quiz-theme/0"
            sx={{ display: 'flex', marginLeft: 3 }}
          />
        </Permissions>
      </Box>
      <Grid container spacing={2} alignItems="stretch">
        {quizThemes
          ?.map((item) => ({ name: item.name, icon: item.iconUrl, id: item.id }))
          .map((item) => (
            <Grid item md={4} xs={6} key={item.id}>
              <ItemDashboard
                item={item}
                onClick={() => navigate(`/quiz-theme/${item.id}`)}
                quizActive={item.id === activeTheme?.id}
              />
            </Grid>
          ))}
      </Grid>
    </Box>
  )
}

export default QuizThemeAdminPage
