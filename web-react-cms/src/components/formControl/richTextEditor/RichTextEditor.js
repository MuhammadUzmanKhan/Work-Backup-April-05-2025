import React from 'react'
import { Editor } from 'react-draft-wysiwyg'
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'
import styles from '../../../pages/adminPages/admin.module.scss'

export default function RichTextEditor({ value, disabled, onChange }) {
  return (
    <Editor
      toolbar={{
        options: [
          'inline',
          'blockType',
          'fontSize',
          'fontFamily',
          'list',
          'textAlign',
          'colorPicker',
          'link',
          'embedded',
          'emoji',
          'image',
          'remove',
          'history'
        ],
        fontFamily: {
          options: ['Montserrat', 'FF Shamel']
        }
      }}
      editorState={value}
      toolbarClassName={[styles.toolbarClassName, disabled && styles.disabled]}
      editorClassName={[styles.editorClassName, disabled && styles.disabled]}
      onEditorStateChange={onChange}
      readOnly={!!disabled}
      spellCheck={true}
    />
  )
}
