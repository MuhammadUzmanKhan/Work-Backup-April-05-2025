import { Box, Typography } from '@mui/material';
import React from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { fakeOptionsList } from 'utils/fakeValues';
import BaseSelect from 'components/formControl/baseSelect/BaseSelect';
import BaseTextField from 'components/formControl/baseTextField/BaseTextField';
import InputLabel from '@mui/material/InputLabel';

function QuizzesDetailsPage() {
  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h3">Quizzes</Typography>
          <Box sx={{ display: 'flex' }}>
            <Box mr={1}>
              <EditIcon color="secondary" />
            </Box>
            <Box>
              <DeleteIcon color="error" />
            </Box>
          </Box>
        </Box>
        <Typography variant="subtitle1" component="h3">
          Publish on 9 May 2022
        </Typography>
      </Box>
      <Box sx={{ mt: 5 }}>
        <BaseSelect
          name="authorName"
          items={fakeOptionsList}
          initvalue={fakeOptionsList[0].id}
          label="Type"
          sx={{ width: '100%', marginBottom: 0, m: 0 }}
        />
        <InputLabel sx={{ mt: 5 }} variant="outlined">
          Quizzes
        </InputLabel>
        <BaseTextField
          sx={{ mt: 0 }}
          fullWidth
          placeholder={t('fields.someText')}
          id="quizzes"
          name="Quizzes"
        />
        <InputLabel sx={{ mt: 6 }} variant="outlined">
          Multiple Answer
        </InputLabel>
        <BaseTextField
          sx={{ mt: 0 }}
          fullWidth
          id="multipleAnswer"
          name="multipleAnswer"
          placeholder={t('fields.someText')}
        />
        <BaseTextField
          sx={{ mt: 2 }}
          fullWidth
          placeholder={t('fields.someText')}
          id="multipleAnswer2"
          name="multipleAnswer2"
        />
        <BaseTextField
          sx={{ mt: 2 }}
          fullWidth
          id="multipleAnswer3"
          name="multipleAnswer3"
          placeholder={t('fields.someText')}
        />
        <InputLabel sx={{ mt: 6 }} variant="outlined">
          Correct Answer
        </InputLabel>
        <BaseTextField
          sx={{ mt: 0 }}
          fullWidth
          id="multipleAnswer3"
          name="multipleAnswer3"
          placeholder={t('fields.someText')}
        />
        <InputLabel sx={{ mt: 6 }} variant="outlined">
          Tags
        </InputLabel>
        <BaseSelect
          name="tags"
          items={fakeOptionsList}
          initvalue={fakeOptionsList[0].id}
          sx={{ width: '100%', marginBottom: 0, m: 0 }}
        />
        <InputLabel sx={{ mt: 6 }} variant="outlined">
          Linked to Guidebook?
        </InputLabel>
        <BaseSelect
          name="linked"
          items={fakeOptionsList}
          initvalue={fakeOptionsList[0].id}
          sx={{ width: '100%', marginBottom: 0, m: 0 }}
        />
        <InputLabel sx={{ mt: 6 }} variant="outlined">
          Guidebook
        </InputLabel>
        <BaseSelect
          name="guidebook"
          items={fakeOptionsList}
          initvalue={fakeOptionsList[0].id}
          sx={{ width: '100%', marginBottom: 0, m: 0 }}
        />
      </Box>
    </>
  )
}

export default QuizzesDetailsPage;
