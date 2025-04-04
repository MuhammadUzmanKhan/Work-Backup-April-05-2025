import React from 'react';
import { Grid, Typography } from '@mui/material';
import StatCard from 'views/Admin/Stats/StatCard';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NorthWestOutlinedIcon from '@mui/icons-material/NorthWestOutlined';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import StatGraph from 'views/Admin/Stats/StatGraph';
import palette from 'theme/palette';
import StatRating from 'views/Admin/Stats/StatRating';

// import styles from './admin.module.scss';

const StatsAdminPage = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h3" my={3} fontFamily="Helvetica Neue" color={palette.darkPurple[900]}>
          {'Statistics Overview'}
        </Typography>
        <Grid container spacing={3} fontFamily="Helvetica Neue">
          <Grid item xs={3}>
            <StatCard onClick={() => { }} name={"Products"} body1={"5"} body2={"Uploaded"} icon={<CreditCardIcon fontSize='large' color='secondary' />} viewAll={true} link={"/stats/products"}/>
          </Grid>
          <Grid item xs={3}>
            <StatCard onClick={() => { }} name={"Avg. Views"} body1={"72%"} body2={"per day"} icon={<VisibilityIcon fontSize='large' color='secondary' />} />
          </Grid>
          <Grid item xs={3}>
            <StatCard onClick={() => { }} name={"Avg. Clicks on Apply"} body1={"43%"} body2={"per day"} icon={<NorthWestOutlinedIcon fontSize='large' color='secondary' />} />
          </Grid>
          <Grid item xs={3}>
            <StatCard onClick={() => { }} name={"Avg. Rating"} body1={"4.5"} body2={"out of 5"} icon={<StarBorderOutlinedIcon fontSize='large' color='secondary' />} />
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h3" my={3} fontFamily="Helvetica Neue" color={palette.darkPurple[900]} >
          {'Credit Cards'}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={9}>
            <StatGraph name={"Credit Cards"}/>
            {/* <StatGraph name={"Personal Loans"} /> */}
          </Grid>
          <Grid item xs={3}>
            <StatRating nbbRating={4.5} nonNbbRating={3.3} categoryName={'credit card'} />
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h3" my={3} fontFamily="Helvetica Neue" color={palette.darkPurple[900]} >
          {'Personal Loans'}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={9}>
            <StatGraph name={"Personal Loans"}/>
            {/* <StatGraph name={"Personal Loans"} /> */}
          </Grid>
          <Grid item xs={3}>
            <StatRating nbbRating={4.5} nonNbbRating={3.3} categoryName={'personal loans'} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default StatsAdminPage;
