import React from 'react';
import { Stack, Typography, Rating } from '@mui/material';

const RatingItem = ({ ratingScore, description }) => {
    return (
        <>
            <Stack direction={'row'} sx={{ display: 'flex', justifyContent: "start", alignItems: "center" }}>
                <Typography sx={{ marginBottom: '0.5em' }} variant="body2" component="div" fontFamily="Helvetica Neue">
                    <Rating
                        sx={{ marginRight: '10px' }}
                        name="simple-controlled"
                        value={ratingScore}
                        precision={0.5}
                        readOnly={true}
                    />
                </Typography>
                <Typography sx={{ marginBottom: '0.5em' }} variant="h5" component="div" color='common.lightGreen' fontFamily="Helvetica Neue">
                    {ratingScore}
                </Typography>
            </Stack>
            <Typography sx={{ marginBottom: '2rem' }} variant="body2" component="div" color='common.darkPurple' fontFamily="Helvetica Neue">
                {description}
            </Typography>
        </>
    )
}

export default RatingItem;