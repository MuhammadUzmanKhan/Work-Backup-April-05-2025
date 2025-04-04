import BaseSelect from 'components/formControl/baseSelect/BaseSelect'
import React from 'react'
import { useTranslation } from 'react-i18next'

export default function FilterCheckbox({ checkboxes, setFieldValue, filters }) {
  const { t } = useTranslation()

  return (
    <>
      <br />
      <br />
      <BaseSelect
        name="tag"
        label={t('fields.tag')}
        items={filters.filter((filter) => !!filter.value)}
        initvalue={checkboxes.tag?.id}
        sx={{ width: '100%', marginBottom: 0 }}
        onChange={(value) => {
          setFieldValue(`checkboxes.tag.id`, value)
        }}
      />

      <br />
    </>
  )
}
