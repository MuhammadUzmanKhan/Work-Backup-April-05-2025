import palette from './palette';

export default function ({ direction }) {
  return {
    direction,
    palette: {
      secondary:{main:'#DEA8DE'},
      primary:{main:'#29173B'},
      success: { main: '#69B5B5' },
      error: { main: '#C86B6D' },
      warning: { main: '#F29469' },
      info: { main: '#453157' },

      common: {
        white: '#FFFFFF',
        lightPurple: '#DEA8DE',
        darkPurple: '#29173B',
        coolWhite: '#F2F2F2',
        coolWhiteLight: '#DDDDDD',
        pink: '#F29191',
        error: '#C86B6D',
        green: '#2E7D7E',
        lightGreen: '#69B5B5',
        orange: '#F29469',
        black: '#000000',
        greyLight: '#4f4d4d',
        grey: '#7A869A'
      },
      lightPurple: {
        main: '#DEA8DE'
      },
      darkPurple: {
        main: '#29173B'
      },
      coolWhite: {
        main: '#F2F2F2',
        light: '#DDDDDD'
      },
      pink: {
        main: '#F29191'
      },
      green: {
        main: '#2E7D7E'
      },
      lightGreen: {
        main: '#69B5B5'
      },
      orange: {
        main: '#F29469'
      }
    },
    typography: {
      h1: {
        fontWeight: 900,
        fontSize: '36px',
        lineHeight: '44px'
      },
      h2: {
        fontWeight: 900,
        fontSize: '30px',
        lineHeight: '37px'
      },
      h3: {
        fontWeight: 700,
        fontSize: '24px',
        lineHeight: '29px'
      },
      h4: {
        fontWeight: 800,
        fontSize: '20px',
        lineHeight: '29px'
      },
      h5: {
        fontWeight: 700,
        fontSize: '18px',
        lineHeight: '29px'
      },
      h6:{
        fontWeight: 600,
        fontSize: '16px',
        lineHeight: '24px'
      },
      h7:{
        fontWeight: 600,
        fontSize: '14px',
        lineHeight: '24px'
      },
      bodyBig: {
        fontWeight: 700,
        fontSize: '20px',
        lineHeight: '30px'
      },
      body1: {
        fontWeight: 400,
        fontSize: '16px',
        lineHeight: '26px'
      },
      body2: {
        fontWeight: 400,
        fontSize: '14px',
        lineHeight: '20px'
      },
      subtitle1: {
        fontWeight: 500,
        fontSize: '14px',
        lineHeight: '22px'
      },
      button: {
        fontWeight: 600,
        fontSize: '14px',
        lineHeight: '17px'
      },
      caption: {
        fontWeight: 500,
        fontSize: '12px',
        lineHeight: '16px',
        textTransform: 'initial'
      },
      overline: {
        fontWeight: 700,
        fontSize: '10px',
        lineHeight: '16px',
        letterSpacing: '1.5px',
        textTransform: 'uppercase'
      },
      title: {
        fontWeight: 700,
        fontSize: '16px',
        lineHeight: '22px'
      },
      ratingText: {
        fontWeight: 400,
        fontSize: '16px',
        lineHeight: '26px'
      },
      fontFamily: [
        'Montserrat',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"'
      ].join(',')
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableRipple: true
        },
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderRadius: '24px',
            minHeight: '44px'
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            marginTop: '19px',
            '& .MuiOutlinedInput-root': {
              padding: 0
            },
            '& .MuiInputBase-root': {
              borderRadius: 0,
              borderBottom: `1px solid ${palette.variables.coolWhite}`
            },
            '& .MuiInputBase-colorSuccess': {
              borderColor: palette.variables.green
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none'
            },
            '& .MuiOutlinedInput-input': {
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '20px',
              color: palette.variables.darkPurple,
              padding: '11px 19px 11px 13px'
            },
            '& .Mui-error': {
              borderColor: palette.pink['500'],
              '& path': {
                fill: palette.pink['500']
              }
            },
            '& .MuiFormHelperText-root.Mui-error, .MuiInputLabel-root.Mui-error': {
              color: palette.white['200']
            },
            '& .MuiFormHelperText-root.Mui-error, .MuiFormHelperText-root': {
              color: palette.pink['500']
            }
          }
        }
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: '#29173B',
            fontWeight: 500,
            fontSize: '14px',
            lineHeight: '22px',
            left: '-15px',
            top: '-10px',
            transform: 'translate(14px, -9px)',
            '&.Mui-focused': {
              color: palette.white['200']
            }
          }
        }
      },
      MuiCheckbox: {
        defaultProps: {
          disableRipple: true
        },
        styleOverrides: {
          root: {
            color: '#DDDDDD',
            '&.Mui-checked': {
              color: '#69B5B5'
            },
            '&.MuiCheckbox-colorError': {
              color: '#F29191'
            }
          }
        }
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            '.MuiButtonBase-root': {
              paddingTop: '6px',
              justifyContent: 'flex-start'
            },
            '.Mui-selected': {
              path: {
                fill: '#69B5B5'
              },
              '.MuiTypography-root': {
                color: '#69B5B5'
              },
              '.MuiTouchRipple-root': {
                display: 'none'
              }
            }
          }
        }
      },
      MuiList: {
        styleOverrides: {
          root: {
            '.MuiListItemIcon-root': {
              minWidth: '50px',
              marginRight: '16px'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            '&.MuiMenu-paper': {
              background: '#F2F2F2',
              borderRadius: '20px'
            },
            '.MuiMenuItem-root': {
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '20px',
              '&.Mui-selected': {
                background: palette.variables.darkPurple,
                color: '#FFFFFF'
              }
            },
            '.PrivatePickersToolbar-root': {
              '.MuiButtonBase-root': {
                display: 'none'
              }
            }
          }
        }
      },
      MuiButtonBase: {
        styleOverrides: {
          root: {
            '&.MuiToggleButton-root': {
              borderRadius: '24px !important',
              padding: '8px 10px',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#4f4d4d',
              textTransform: 'none',
              border: '1px solid #C6C6C6 !important',
              '&.Mui-selected': {
                color: '#FFFFFF',
                backgroundColor: `${palette.variables.green} !important`
              }
            }
          }
        }
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '20px',
            color: palette.variables.darkPurple,
            '&.MuiInputBase-formControl': {
              background: '#F2F2F2',
              borderRadius: '24px !important',
              '.MuiOutlinedInput-notchedOutline': {
                display: 'none'
              }
            }
          }
        }
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            color: '#DEA8DE',
            height: '4px',
            padding: '28px 0 20px !important',
            '.MuiSlider-mark': {
              background: 'transparent'
            },
            '.MuiSlider-markLabel': {
              fontWeight: '400',
              fontSize: '14px',
              lineHeight: '20px',
              color: palette.variables.darkPurple
            },
            '.MuiSlider-thumbSizeMedium': {
              background: 'rgb(222, 168, 222)',
              borderRadius: '50px',
              height: '24px',
              width: '24px',
              boxShadow: 'none !important'
            },
            '.MuiSlider-valueLabelOpen': {
              fontWeight: '500',
              fontSize: '14px',
              lineHeight: '22px',
              textAlign: 'center',
              color: '#29173B',
              background: 'transparent',
              top: '0',
              '&:before, &:after': {
                display: 'none'
              }
            }
          }
        }
      },
      MuiRating: {
        styleOverrides: {
          root: {
            color: '#F29469',
            '.MuiRating-icon': {
              color: '#F29469',
              '&.MuiRating-iconEmpty': {
                color: '#F2F2F2'
              }
            }
          }
        }
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            '.MuiButtonBase-root': {
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '22px',
              textAlign: 'center',
              color: '#9B9B9B',
              '&.Mui-selected': {
                color: '#69B5B5'
              }
            },
            '.MuiTabs-flexContainer': {
              display: 'flex',
              justifyContent: 'space-between'
            },
            '.MuiTabs-indicator': {
              backgroundColor: '#69B5B5'
            }
          }
        }
      },
      MuiTabPanel: {
        styleOverrides: {
          root: {
            padding: '25px 0'
          }
        }
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            '.MuiFormControl-root.MuiFormControl-fullWidth.MuiTextField-root': {
              '.MuiInputBase-input': {
                border: '1px solid transparent',
                borderRadius: '100px'
              },
              '.Mui-error': {
                borderBottom: 'none',
                '.MuiInputBase-input': {
                  borderColor: '#F29191'
                }
              }
            }
          }
        }
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            '.MuiButton-root.MuiButton-text.MuiButton-textPrimary.MuiButton-sizeMedium': {
              color: '#69B5B5 !important'
            }
          }
        }
      },
      MuiCalendarPicker: {
        styleOverrides: {
          root: {
            '.Mui-selected': {
              backgroundColor: '#69B5B5 !important'
            }
          }
        }
      },
      MuiModal: {
        styleOverrides: {
          root: {
            '.MuiBackdrop-root': {
              '&:not(&.MuiBackdrop-invisible)': {
                background: '#29173B',
                opacity: '0.5 !important'
              }
            }
          }
        }
      }
    }
  };
}
