/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import RatingItem from './RatingItem';
import { Card, CardContent, Typography } from '@mui/material';

const StatRating = ({ nbbRating, nonNbbRating, categoryName }) => {
    return (
        <Card sx={{ borderRadius: '25px', px: "10px", height: "100%" }}>
            <CardContent>
                <Typography sx={{ marginBottom: '1em' }} variant="h5" component="div" color='common.darkPurple' fontFamily="Helvetica Neue">
                    Average Rating
                </Typography>
                <RatingItem ratingScore={nbbRating} description={`The average rating of NBB's ${categoryName} on the app`} />
                <RatingItem ratingScore={nonNbbRating} description={`The average rating of other ${categoryName} on the app`} />
            </CardContent>
        </Card>
    )
}

export default StatRating