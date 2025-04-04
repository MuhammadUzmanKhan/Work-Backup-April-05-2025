import React, { useContext, useEffect } from 'react';
import {
  Box,
  Grid,
  Rating,
  Typography,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  LinearProgress
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { t } from 'i18next';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { BackgroundContext } from 'layouts/historyLayout/HistoryLayout';
import { ReactComponent as BankIcon } from 'assets/icons/bank-icon.svg';
import palette from 'theme/palette';
import BaseButton from 'components/formControl/baseButton/BaseButton';
import { ReactComponent as AvatarIcon } from 'assets/avatars/avatar1.svg';
import { ReactComponent as CaretRightDarkIcon } from 'assets/icons/caret-right-dark.svg';
import { ReactComponent as RatingIcon } from 'assets/icons/rating-icon.svg';
import { selectProduct } from 'store/reducers/products';
import { fetchProductById } from 'store/actions/products';
import ReviewContent from 'views/Product/ReviewContent';
import { ReactComponent as AlertCircleIcon } from 'assets/icons/Icon-alert-circle.svg';
import NotificationModal from '../../../views/Modals/NotificationModal';

export default function Product() {
  const [value, setValue] = React.useState('1');
  const [, setBackgroundVal] = useContext(BackgroundContext);
  const params = useParams();

  useEffect(() => {
    setBackgroundVal({ background: '/img/product-info-background.svg', isWhite: false });
  }, []);
  const [expanded, setExpanded] = React.useState('panel1');
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);
  const [productSection, setProductSection] = React.useState({});

  const product = useSelector(selectProduct);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchProductById({ id: params.slug }));
  }, []);

  const handleChangeExpand = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ marginBottom: '40px', textAlign: 'center' }}>
        <img style={{ width: '328px', height: '202px' }} src={product.imageUrl} alt="" />
      </Box>
      <Grid
        sx={{
          background: '#FFFFFF',
          margin: '0 -16px',
          padding: '24px 16px',
          borderRadius: '20px 20px 0px 0px',
          minHeight: '60vh'
        }}>
        <Grid item xs={12}>
          <Typography
            style={{ marginBottom: '8px' }}
            variant="subtitle1"
            color={palette.variables.greyLight}>
            Credit card
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography style={{ marginBottom: '18px' }} variant="h3" color="common.darkPurple">
            {product.name}
          </Typography>
        </Grid>
        <Grid item xs={12} display="flex" alignItems="center">
          <Grid item xs={6}>
            <Rating
              color="common.orange"
              sx={{ marginRight: '10px' }}
              name="simple-controlled"
              value={product.productReview.rating}
              precision={0.5}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="common.darkPurple">
              {product.productReview.rating}
            </Typography>
          </Grid>
        </Grid>
        <Grid item xs={12} sx={{ marginBottom: '24px' }}>
          <TabContext value={value}>
            <Box
              sx={{
                borderBottom: 1,
                borderColor: palette.variables.coolWhite,
                padding: '0 16px',
                margin: '0 -16px'
              }}>
              <TabList onChange={handleChange} aria-label="lab API tabs example">
                <Tab label="About" value="1" />
                <Tab label="Details" value="2" />
                <Tab label="Reviews" value="3" />
              </TabList>
            </Box>
            <TabPanel value="1">
              <Typography style={{ marginBottom: '24px' }} color="#727272" variant="body1">
                {product.description}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '58px' }}>
                <BankIcon style={{ marginRight: '8px' }} />
                {/*// TODO: fetch provider and get current provider's name from list by providerId*/}
                <Typography color="common.darkPurple" variant="subtitle1">
                  National Bank of Bahrain
                </Typography>
              </Box>
            </TabPanel>
            <TabPanel value="2">
              <Typography
                component="h4"
                style={{ marginBottom: '18px' }}
                color="common.darkPurple"
                variant="bodyBig">
                Rates and Fees
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gridColumnGap: '12px',
                  gridRowGap: '12px',
                  marginBottom: '16px'
                }}>
                {product.mainFields.map((data, index) => (
                  <Box
                    onClick={() => {
                      setProductSection(data);
                      setOpen(true);
                    }}
                    key={index}
                    sx={{
                      padding: '20px 26px',
                      border: '1px solid #F2F2F2',
                      boxSizing: 'border-box',
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}>
                    <Typography
                      component="h4"
                      style={{ marginBottom: '4px' }}
                      color="common.darkPurple"
                      variant="bodyBig">
                      {data.value}
                    </Typography>
                    <Typography
                      sx={{ display: 'flex', alignItems: 'center' }}
                      color={palette.variables.greyLight}
                      variant="body2">
                      {data.label}
                      <AlertCircleIcon style={{ marginLeft: '4px' }} />
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box>
                <Accordion
                  sx={{
                    boxShadow: 'none'
                  }}
                  expanded={expanded === 'panel1'}
                  onChange={handleChangeExpand('panel1')}>
                  <AccordionSummary
                    sx={{
                      padding: 0
                    }}
                    expandIcon={<ExpandMoreIcon color="common.darkPurple" />}>
                    <Typography color="common.darkPurple" variant="bodyBig">
                      Additional Details
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography color={palette.variables.greyLight} variant="body2">
                      {product.additionalText}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
                <Divider sx={{ borderColor: palette.variables.coolWhite, marginBottom: '18px' }} />
              </Box>
              <Box>
                <Typography color="common.darkPurple" variant="bodyBig">
                  Meet Our Expert
                </Typography>
                <Box
                  sx={{
                    padding: '16px 16px 16px 15px',
                    background: '#FFFFFF',
                    border: '2px solid #69B5B5',
                    boxSizing: 'border-box',
                    borderRadius: '12px'
                  }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                      <AvatarIcon style={{ marginRight: '8px' }} />
                      <Typography variant="subtitle1" color="common.darkPurple">
                        Dr. Ali Ahmed
                      </Typography>
                    </Box>

                    <CaretRightDarkIcon />
                  </Box>
                  <Typography variant="body2" color="#727272">
                    Not sure what these charges are? Click here for our expert’s opinion
                  </Typography>
                </Box>
              </Box>
            </TabPanel>
            <TabPanel value="3">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '27px' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <RatingIcon style={{ marginRight: '10px' }} />
                    <Typography color="common.darkPurple" variant="h1">
                      {product.productReview.rating}
                    </Typography>
                  </Box>
                  <Typography color="common.black" variant="caption">
                    {product.productReview.count} reviews
                  </Typography>
                </Box>
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: '198px',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                    <Typography variant="caption" color="common.black">
                      Exellent
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      color="green"
                      value={90}
                      sx={{
                        borderRadius: '3px',
                        background: palette.variables.coolWhite,
                        width: '80px'
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: '198px',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                    <Typography variant="caption" color="common.black">
                      Good
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      color="lightGreen"
                      value={65}
                      sx={{
                        borderRadius: '3px',
                        background: palette.variables.coolWhite,
                        width: '80px'
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: '198px',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                    <Typography variant="caption" color="common.black">
                      Average
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      color="orange"
                      value={45}
                      sx={{
                        borderRadius: '3px',
                        background: palette.variables.coolWhite,
                        width: '80px'
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: '198px',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                    <Typography variant="caption" color="common.black">
                      Below Average
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      color="pink"
                      value={30}
                      sx={{
                        borderRadius: '3px',
                        background: palette.variables.coolWhite,
                        width: '80px'
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: '198px',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                    <Typography variant="caption" color="common.black">
                      Poor
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      color="error"
                      value={15}
                      sx={{
                        borderRadius: '3px',
                        background: palette.variables.coolWhite,
                        width: '80px'
                      }}
                    />
                  </Box>
                </Box>
              </Box>
              <ReviewContent />
            </TabPanel>
          </TabContext>
        </Grid>
      </Grid>
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          bottom: 0,
          background: '#FFFFFF',
          height: '109px',
          width: '100%',
          boxShadow: '0px 4px 16px rgba(40, 24, 58, 0.08), 0px -1px 8px rgba(40, 24, 58, 0.05)',
          borderRadius: '20px 20px 0px 0px'
        }}>
        <Box
          sx={{
            padding: '15px 14px 18px 16px'
          }}>
          <BaseButton
            customColor={palette.variables.darkPurple}
            type="submit"
            fullWidth
            variant="contained"
            element={t('apply')}
          />
        </Box>
      </Box>
      <NotificationModal
        withoutIcon
        titleSx={{
          textAlign: 'left',
          padding: 0
        }}
        title={productSection.label}
        description={productSection.description}
        open={open}
        handleClose={handleClose}
      />
    </Box>
  );
}
