import { ToggleButton } from '@mui/material'
import React from 'react'

export default function ToggleButtonCustom({ text, onChange, selected, style, ...props }) {
  return (
    <ToggleButton
      {...props}
      sx={{
        display: 'flex',
        gap: '8px',
        overflow: 'auto',
        // marginBottom: '15px',
        marginRight: '10px',
        flexWrap: 'nowrap',
        width: 'max-content',
        ...style
      }}
      selected={selected}
      onChange={onChange}
      value={'check'}>
      {text}
    </ToggleButton>
  )
}
