import React from 'react';
import palette from 'theme/palette';
import { Card, CardContent, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';


const data = [
    {
        name: 'S',
        darkPurple: 4000,
        purple: 2400,
        amt: 2400,
    },
    {
        name: 'M',
        darkPurple: 3000,
        purple: 1398,
        amt: 2210,
    },
    {
        name: 'T',
        darkPurple: 2000,
        purple: 9800,
        amt: 2290,
    },
    {
        name: 'W',
        darkPurple: 2780,
        purple: 3908,
        amt: 2000,
    },
    {
        name: 'T',
        darkPurple: 1890,
        purple: 4800,
        amt: 2181,
    },
    {
        name: 'F',
        darkPurple: 2390,
        purple: 3800,
        amt: 2500,
    },
    {
        name: 'S',
        darkPurple: 3490,
        purple: 4300,
        amt: 2100,
    },
];

const StatGraph = () => {
    return (
        <Card sx={{ borderRadius: '25px', px: "10px", height: "100%" }}>
            <CardContent>
                <Typography variant="h6" mb={3} fontFamily="Helvetica Neue" color={palette.darkPurple[900]}>
                    {'Avg. Clicks on Apply'}
                </Typography>
                <BarChart
                    width={800}
                    height={250}
                    data={data}
                    barGap={0}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid stroke="#eee" horizontal={true} vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="purple" stackId="a" fill={palette.lightPurple[200]} radius={15} barSize={17} />
                    <Bar dataKey="darkPurple" stackId="b" fill={palette.darkPurple[900]} radius={15} barSize={17} />
                </BarChart>
            </CardContent>
        </Card>
    )
}

export default StatGraph;