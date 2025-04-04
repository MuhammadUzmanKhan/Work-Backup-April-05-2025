import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Link,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import palette from 'theme/palette'
import BaseButton from 'components/formControl/baseButton/BaseButton'
import { useTranslation } from 'react-i18next'
import SearchFilter from 'views/Products/SearchFilter'
import EditIcon from '@mui/icons-material/Edit'
import { useDispatch, useSelector } from 'react-redux'
import { getQuizes, getQuizesSearch, getQuizTags } from 'store/actions/quizes'
import { setQuizStateValue } from 'store/reducers/quizes'
import { quizTypes } from 'utils/staticValues'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { Permissions } from 'components/Permissions'

const QuizzesAdminPage = () => {
  const dispatch = useDispatch()
  const [localQuiz, setLocalQuiz] = useState([])
  const { quizes, tags } = useSelector((state) => state.quizes)
  const { t } = useTranslation()

  useEffect(() => {
    dispatch(getQuizes())
    dispatch(getQuizTags())
  }, [])

  useEffect(() => {
    setLocalQuiz([...quizes])
  }, [quizes])

  const handleChange = (id, quizTags) => {
    let list = quizes.map((x) => {
      if (x.id === id) {
        return { ...x, quizTagIds: quizTags }
      }
      return { ...x }
    })

    dispatch(
      setQuizStateValue({
        type: 'quizes',
        data: list
      })
    )
  }

  const asyncFunction = (query) => dispatch(getQuizesSearch({ searchTerm: query }))

  const asyncFunctionDebounced = AwesomeDebouncePromise(asyncFunction, 1000)

  const onSearch = async (query) => {
    // console.log('query and quizzes -- ', query, '    ', quizes)
    // if (query.length < 3) {
    //   setLocalQuiz([...quizes])

    //   return
    // }
    const _quizes = await asyncFunctionDebounced(query)
    if (_quizes.payload) {
      setLocalQuiz([..._quizes.payload])
    } else {
      setLocalQuiz([...quizes])
    }
  }

  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h3">{t('admin.quizzes')}</Typography>
          <Permissions permission={'write:quizqna'}>
            <BaseButton
              customColor={palette.variables.orange}
              variant="contained"
              element={t('add')}
              href="/#/quizzes/add"
              sx={{ display: 'flex', marginLeft: 3 }}
            />
          </Permissions>
        </Box>
        <Typography variant="subtitle1" component="h3">
          {t('fields.questionBank')}
        </Typography>
        <SearchFilter withFilter={false} onChange={onSearch} />
      </Box>
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={3}>
            <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
              {t('fields.typeOfQuestion')}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
              {t('fields.question')}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
              {t('admin.tags')}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography sx={{ ml: 0 }} variant="subtitle1" component="h4">
              {t('fields.linkedToGuideBook') + t('fields.questionSign')}
            </Typography>
          </Grid>
        </Grid>

        {localQuiz.length !== 0 ? (
          localQuiz.map((quiz, i) => (
            <Grid
              key={quiz.answerType + i}
              container
              sx={{ mt: i % 3 == 0 ? 2 : 0 }}
              alignItems="center">
              <Grid item xs={3}>
                <Typography variant="subtitle1" component="h4">
                  {t(`fields.${quizTypes.find((q) => q.value === quiz.answerType).title}`)}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="subtitle1" component="h4">
                  {quiz.question}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <ToggleButtonGroup
                  sx={{ flexWrap: 'wrap', gap: '7px' }}
                  color="primary"
                  value={quiz.quizTagIds}
                  onChange={(event, value) => {
                    handleChange(quiz.id, value)
                  }}>
                  {tags.map((tag) => (
                    <>
                      {quiz.quizTagIds.includes(tag.id) && (
                        <ToggleButton
                          sx={{
                            display: 'flex',
                            gap: '8px',
                            overflow: 'auto',
                            marginBottom: '15px',
                            flexWrap: 'nowrap',
                            width: 'max-content'
                          }}
                          disabled={true}
                          selected={quiz.quizTagIds.includes(tag.id)}
                          key={tag.id}
                          value={tag.id}>
                          {tag.name}
                        </ToggleButton>
                      )}
                    </>
                  ))}
                </ToggleButtonGroup>
              </Grid>
              <Grid item sx={{ display: 'flex' }} xs={2}>
                <Typography sx={{ mr: 2, pl: 3 }} variant="subtitle1" component="h4">
                  {quiz.guidebookId ? t('yes') : t('no')}
                </Typography>
              </Grid>

              <Grid item xs={1} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link color="inherit" underline="none" href={'#/quizzes/' + quiz.id}>
                  <IconButton size="small" aria-label="delete">
                    <EditIcon color="secondary" fontSize="small" />
                  </IconButton>
                </Link>
              </Grid>
            </Grid>
          ))
        ) : (
          <Box display={'flex'} justifyContent={'center'} mt={10}>
            <Typography variant="h3" mt={3}>
              {'No Quiz Found'}
            </Typography>
          </Box>
        )}
      </Box>
    </>
  )
}

export default QuizzesAdminPage;
