import React from 'react';
import { Card, CardContent, Typography, Stack } from '@mui/material';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ onClick, name, body1, body2, icon, viewAll = false, link }) => {
  const navigate = useNavigate();
  return (
    <Card onClick={onClick} sx={{ borderRadius: '25px', padding: "10px" }}>
      <CardContent>
        <Stack direction={'row'} sx={{ display: 'flex', justifyContent: "space-between" }}>
          <Typography sx={{ marginBottom: '0.5em' }} variant="h5" component="div" color='common.darkPurple' fontFamily="Helvetica Neue">
            {name}
          </Typography>
          {icon ? icon : null}
        </Stack>
        <Typography sx={{ marginBottom: '0.5em' }} variant="h4" component="div" fontFamily="Helvetica Neue">
          {body1}
        </Typography>
        <Stack direction={'row'} sx={{ display: 'flex', justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ marginBottom: '0.5em' }} variant="body2" component="div" fontFamily="Helvetica Neue">
            {body2}
          </Typography>
          {viewAll && <Typography onClick={() => navigate(link)} sx={{ marginBottom: '0.5em',cursor:'pointer' }} variant="h7" component="div" color='common.lightGreen' fontFamily="Helvetica Neue">
            View all
          </Typography>}
        </Stack>
      </CardContent>
    </Card>
  )
};
export default StatCard;

StatCard.propTypes = {
  item: PropTypes.object,
  onClick: PropTypes.func,
  name: PropTypes.string,
  body1: PropTypes.string,
  body2: PropTypes.string,
  icon: PropTypes.element,
}; 
