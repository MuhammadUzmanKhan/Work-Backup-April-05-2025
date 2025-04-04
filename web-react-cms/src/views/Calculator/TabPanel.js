import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

import SliderCalculator from './SliderCalculator';
import { getCalculation, calculationLoanEMI } from 'utils/functions';

import styles from 'pages/calculatorPage/calculator.module.scss';

const TabPanel = ({ value, index, title }) => {
  const { t } = useTranslation();

  const [loanAmount, setLoanAmount] = useState(1);
  const [interestRate, setInterestRate] = useState(1);
  const [loanTenure, setLoanTenure] = useState(1);
  const [totalInterestPayable, setTotalInterestPayable] = useState(1);
  const [loanEMI, setLoanEMI] = useState(1);
  const [totalPayment, setTotalPayment] = useState(1);

  const data = [
    {
      name: t('calculator.principalLoanAmount'),
      value: (totalInterestPayable / totalPayment) * 100
    },
    {
      name: t('calculator.totalInterest'),
      value: 100 - (totalInterestPayable / totalPayment) * 100
    }
  ];
  const COLORS = ['#F29469', '#69B5B5'];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  useEffect(() => {
    setLoanEMI(calculationLoanEMI(+(interestRate / 12 / 100), +loanTenure * 12, +loanAmount));
    setTotalInterestPayable(getCalculation(loanAmount, interestRate, loanTenure));
  }, [loanAmount, interestRate, loanTenure]);

  useEffect(() => {
    setTotalPayment(loanEMI * loanTenure * 12);
  }, [loanEMI]);

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}>
      {value === index && (
        <Grid container flexDirection="column">
          <Grid item sx={{ p: 3 }}>
            <Grid container flexDirection="column">
              <SliderCalculator
                title={title}
                higher={100000}
                suffix="BHD"
                step={1}
                onChange={setLoanAmount}
              />
              <SliderCalculator
                title={t('calculator.interestRate')}
                higher={20}
                suffix="%"
                step={0.5}
                onChange={setInterestRate}
              />
              <SliderCalculator
                title={t('calculator.loanTenure')}
                higher={45}
                suffix="Yr"
                step={1}
                onChange={setLoanTenure}
              />
            </Grid>
          </Grid>

          <Grid item sx={{ border: 'solid 1px #f2f2f2' }}>
            <Grid container className={styles.wrapGraphicsCalcucator}>
              <Grid
                item
                xs={6}
                sx={{ borderRight: 'solid 1px #f2f2f2' }}
                className={styles.item_first}>
                <Grid container flexDirection="column">
                  <Grid
                    item
                    xs={12}
                    justifyContent="center"
                    flexDirection="column"
                    sx={{ borderBottom: 'solid 1px #f2f2f2', p: 3 }}>
                    <Box textAlign="center">
                      <Typography mr={3} variant="bodyBig" fontSize={14} color="common.greyLight">
                        {t('calculator.loanEMI')}
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography mr={3} variant="bodyBig">
                        BHD {interestRate && loanTenure && loanAmount && loanEMI}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    justifyContent="center"
                    flexDirection="column"
                    sx={{ borderBottom: 'solid 1px #f2f2f2', p: 3 }}>
                    <Box textAlign="center">
                      <Typography mr={3} variant="bodyBig" fontSize={14} color="common.greyLight">
                        {t('calculator.totalInterestPayable')}
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography mr={3} variant="bodyBig">
                        BHD {totalInterestPayable}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    justifyContent="center"
                    m="auto"
                    flexDirection="column"
                    sx={{ p: 3 }}>
                    <Box textAlign="center" maxWidth={180}>
                      <Typography
                        mr={3}
                        m="auto"
                        variant="bodyBig"
                        fontSize={14}
                        color="common.greyLight">
                        {t('calculator.totalPayment')}
                      </Typography>
                    </Box>

                    <Box textAlign="center">
                      <Typography mr={3} variant="bodyBig">
                        BHD {totalPayment}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={6} justifyContent="center" sx={{ p: 3 }} className={styles.item}>
                <Box textAlign="center">
                  <Typography mr={3} variant="bodyBig" fontSize={14}>
                    {t('calculator.breakUpTotalPayment')}
                  </Typography>
                </Box>

                <Box width="100%" height={200}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart width={400} height={400}>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value">
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <Box
                    mt={1}
                    sx={{
                      border: 'solid 1px #29173B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 8px'
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '5px' }}>
                      <Box
                        sx={{ borderRadius: '50%', background: '#F29469', width: 10, height: 10 }}
                        mr="5px"
                      />
                      <Box>
                        <Typography variant="bodyBig" fontSize={10} color="common.greyLight">
                          {t('calculator.totalInterest')}
                        </Typography>
                      </Box>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{ borderRadius: '50%', background: '#69B5B5', width: 10, height: 10 }}
                        mr="5px"
                      />
                      <Box>
                        <Typography variant="bodyBig" fontSize={10} color="common.greyLight">
                          {t('calculator.principalLoanAmount')}
                        </Typography>
                      </Box>
                    </div>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default TabPanel;

TabPanel.propTypes = {
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
  title: PropTypes.string
};
