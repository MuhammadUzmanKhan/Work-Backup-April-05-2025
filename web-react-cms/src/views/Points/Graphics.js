import React, { useState } from 'react';
import { Box } from '@mui/material';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import PropTypes from 'prop-types';

import ProgressChar from './ProgressChar';

import palette from 'theme/palette';
import styles from 'pages/pointsPages/points.module.scss';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.tooltip}>
        <p>{payload[0].value}</p>
      </div>
    );
  }

  return null;
};

const Graphics = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(1);

  const handleClick = (data, index) => {
    setActiveIndex(index);
  };

  return (
    <Box>
      <ProgressChar />

      <ResponsiveContainer width="100%" height={300}>
        <BarChart width={400} height={300} data={data}>
          <XAxis dataKey="name" stroke={palette.variables.green} />
          <YAxis />
          <Tooltip
            content={<CustomTooltip />}
            wrapperStyle={{
              width: 'max-content',
              height: 30,
              backgroundColor: palette.variables.green,
              color: '#fff',
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: 6,
              // border: 'solid 1px #fff',
              top: -50
            }}
          />
          <CartesianGrid stroke={palette.variables.green} strokeDasharray="5 5" />
          <Bar dataKey="uv" onClick={handleClick} barSize={32}>
            {data.map((entry, index) => (
              <>
                <Cell
                  cursor="pointer"
                  fill={
                    index === activeIndex ? palette.variables.green : palette.variables.greyLight
                  }
                  key={`cell-${index}`}
                />
              </>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default Graphics;

Graphics.propTypes = {
  data: PropTypes.array
};

CustomTooltip.propTypes = {
  active: PropTypes.string,
  label: PropTypes.string,
  payload: PropTypes.array
};
